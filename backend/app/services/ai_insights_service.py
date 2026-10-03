"""
Insight engine.

This runs entirely on the user's own data — no API key, no third-party call, no
cost. It reads the last few months of transactions and produces:

  * a 0-100 financial health score with a grade and a short reason
  * ranked, actionable insights (overspending, savings rate, unusual charges,
    category drift, month-on-month swings, recurring payments)
  * a next-month forecast built from a weighted moving average
  * a suggested monthly budget per category

Everything is returned in the user's base currency.
"""

from __future__ import annotations

import statistics
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.database.mongodb import expenses_collection, income_collection, users_collection
from app.utils import currency as currency_utils

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def _as_utc(value) -> datetime:
    """Mongo hands back naive datetimes; normalise everything to aware UTC."""
    if not isinstance(value, datetime):
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _base_amount(doc: dict) -> float:
    """Prefer the pre-converted base amount, fall back to the raw amount."""
    value = doc.get("base_amount")
    if value is None:
        value = doc.get("amount", 0)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _month_key(value: datetime) -> str:
    return _as_utc(value).strftime("%Y-%m")


def _pct_change(current: float, previous: float) -> float | None:
    if previous <= 0:
        return None
    return round(((current - previous) / previous) * 100, 1)


def _insight(kind: str, severity: str, title: str, body: str, **extra) -> dict:
    """severity: good | info | watch | alert — the UI colours each differently."""
    return {"kind": kind, "severity": severity, "title": title, "body": body, **extra}


# --------------------------------------------------------------------------
# Health score
# --------------------------------------------------------------------------


def _health_score(
    total_income: float,
    total_expense: float,
    savings_rate: float,
    top_share: float,
    months_tracked: int,
) -> dict:
    """
    Four components, 25 points each:
      savings rate, spend-to-income ratio, category balance, tracking habit.
    """
    # Savings rate: 20%+ is full marks.
    savings_points = max(0.0, min(25.0, (savings_rate / 20.0) * 25.0))

    # Spend ratio: spending under 70% of income is full marks, over 100% is zero.
    if total_income <= 0:
        ratio_points = 0.0
        spend_ratio = 100.0
    else:
        spend_ratio = (total_expense / total_income) * 100
        ratio_points = max(0.0, min(25.0, ((100.0 - spend_ratio) / 30.0) * 25.0))

    # Category balance: no single category should eat more than ~35% of spend.
    if total_expense <= 0:
        balance_points = 12.5
    else:
        balance_points = max(0.0, min(25.0, ((60.0 - top_share) / 25.0) * 25.0))

    # Tracking habit: three or more months of history is full marks.
    habit_points = max(0.0, min(25.0, (months_tracked / 3.0) * 25.0))

    score = round(savings_points + ratio_points + balance_points + habit_points)

    if score >= 80:
        grade, label = "A", "Strong"
    elif score >= 65:
        grade, label = "B", "Healthy"
    elif score >= 50:
        grade, label = "C", "Getting there"
    elif score >= 35:
        grade, label = "D", "Needs attention"
    else:
        grade, label = "E", "At risk"

    return {
        "score": score,
        "grade": grade,
        "label": label,
        "spend_ratio": round(spend_ratio, 1),
        "breakdown": {
            "savings": round(savings_points, 1),
            "spend_ratio": round(ratio_points, 1),
            "balance": round(balance_points, 1),
            "consistency": round(habit_points, 1),
        },
    }


# --------------------------------------------------------------------------
# Forecast
# --------------------------------------------------------------------------


def _forecast(monthly_totals: dict[str, float]) -> dict | None:
    """Weighted moving average: the most recent month counts the most."""
    ordered = [monthly_totals[k] for k in sorted(monthly_totals)][-6:]
    if len(ordered) < 2:
        return None

    weights = list(range(1, len(ordered) + 1))
    projection = sum(v * w for v, w in zip(ordered, weights)) / sum(weights)

    spread = statistics.pstdev(ordered) if len(ordered) > 1 else 0.0

    return {
        "next_month": round(projection, 2),
        "low": round(max(0.0, projection - spread), 2),
        "high": round(projection + spread, 2),
        "confidence": "high" if len(ordered) >= 4 else "low",
        "months_used": len(ordered),
    }


# --------------------------------------------------------------------------
# Recurring payment detection
# --------------------------------------------------------------------------


def _find_recurring(expenses: list[dict]) -> list[dict]:
    """A title that shows up in 3+ distinct months at a similar amount."""
    groups: dict[str, list[dict]] = defaultdict(list)
    for expense in expenses:
        key = str(expense.get("title", "")).strip().lower()
        if key:
            groups[key].append(expense)

    recurring = []
    for key, items in groups.items():
        months = {_month_key(item.get("date")) for item in items}
        if len(months) < 3:
            continue

        amounts = [_base_amount(item) for item in items]
        average = sum(amounts) / len(amounts)
        if average <= 0:
            continue

        # Amounts should be broadly stable for this to look like a subscription.
        if statistics.pstdev(amounts) / average > 0.25:
            continue

        recurring.append(
            {
                "title": items[0].get("title", key),
                "category": items[0].get("category", "Other"),
                "average_amount": round(average, 2),
                "months_seen": len(months),
                "yearly_cost": round(average * 12, 2),
            }
        )

    recurring.sort(key=lambda r: r["average_amount"], reverse=True)
    return recurring[:5]


# --------------------------------------------------------------------------
# Main entry point
# --------------------------------------------------------------------------


async def generate_insights(user_id: str) -> dict:
    user = await users_collection.find_one({"email": {"$exists": True}, "_id": _safe_oid(user_id)})
    base_currency = currency_utils.normalise((user or {}).get("currency"))

    expenses = await expenses_collection.find({"user_id": user_id}).to_list(length=20000)
    income = await income_collection.find({"user_id": user_id}).to_list(length=20000)

    total_expense = sum(_base_amount(e) for e in expenses)
    total_income = sum(_base_amount(i) for i in income)
    balance = total_income - total_expense

    if not expenses and not income:
        return {
            "currency": base_currency,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "has_data": False,
            "health": None,
            "forecast": None,
            "insights": [
                _insight(
                    "empty",
                    "info",
                    "Add your first few transactions",
                    "Log a week of spending and this page will start telling you where "
                    "your money actually goes, what you can safely save, and what next "
                    "month is likely to cost.",
                )
            ],
            "budget_suggestions": [],
            "recurring": [],
            "totals": {"income": 0, "expense": 0, "balance": 0, "savings_rate": 0},
        }

    # ---------------- Monthly aggregation ----------------
    monthly_expense: dict[str, float] = defaultdict(float)
    monthly_income: dict[str, float] = defaultdict(float)
    category_totals: dict[str, float] = defaultdict(float)
    category_by_month: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for expense in expenses:
        key = _month_key(expense.get("date"))
        amount = _base_amount(expense)
        category = expense.get("category", "Other")
        monthly_expense[key] += amount
        category_totals[category] += amount
        category_by_month[key][category] += amount

    for entry in income:
        monthly_income[_month_key(entry.get("date"))] += _base_amount(entry)

    months = sorted(set(monthly_expense) | set(monthly_income))
    now = datetime.now(timezone.utc)
    this_month = now.strftime("%Y-%m")
    last_month = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")

    this_month_expense = monthly_expense.get(this_month, 0.0)
    last_month_expense = monthly_expense.get(last_month, 0.0)
    this_month_income = monthly_income.get(this_month, 0.0)

    savings_rate = round((balance / total_income) * 100, 1) if total_income > 0 else 0.0

    top_category, top_amount = ("—", 0.0)
    if category_totals:
        top_category, top_amount = max(category_totals.items(), key=lambda kv: kv[1])
    top_share = (top_amount / total_expense * 100) if total_expense > 0 else 0.0

    health = _health_score(
        total_income, total_expense, savings_rate, top_share, len(months)
    )
    forecast = _forecast(dict(monthly_expense))

    # ---------------- Insights ----------------
    insights: list[dict] = []

    # 1. Living beyond income
    if total_income > 0 and total_expense > total_income:
        insights.append(
            _insight(
                "overspend",
                "alert",
                "You are spending more than you earn",
                f"Across all your records you have spent "
                f"{_fmt(total_expense - total_income, base_currency)} more than you "
                f"brought in. Trimming {top_category.lower()} is the fastest lever — "
                f"it is your biggest category.",
                metric=round(total_expense - total_income, 2),
            )
        )
    elif savings_rate >= 20:
        insights.append(
            _insight(
                "savings",
                "good",
                f"You are keeping {savings_rate}% of what you earn",
                "That is above the 20% mark most planners aim for. Consider moving the "
                "surplus somewhere you cannot spend it by accident.",
                metric=savings_rate,
            )
        )
    elif total_income > 0:
        gap = round(total_income * 0.2 - balance, 2)
        insights.append(
            _insight(
                "savings",
                "watch",
                f"Your savings rate is {savings_rate}%",
                f"To reach a 20% rate you would need to free up about "
                f"{_fmt(max(gap, 0), base_currency)}. Start with the categories below.",
                metric=savings_rate,
            )
        )

    # 2. Month-on-month movement
    change = _pct_change(this_month_expense, last_month_expense)
    if change is not None and abs(change) >= 10:
        rising = change > 0
        insights.append(
            _insight(
                "trend",
                "watch" if rising else "good",
                f"Spending is {'up' if rising else 'down'} {abs(change)}% this month",
                f"You are at {_fmt(this_month_expense, base_currency)} so far, against "
                f"{_fmt(last_month_expense, base_currency)} last month.",
                metric=change,
            )
        )

    # 3. Concentration in one category
    if top_share >= 35 and total_expense > 0:
        insights.append(
            _insight(
                "concentration",
                "watch",
                f"{top_category} takes {round(top_share)}% of your spending",
                f"That is {_fmt(top_amount, base_currency)} in total. A single category "
                f"above a third of your budget usually means there is room to cut.",
                category=top_category,
                metric=round(top_share, 1),
            )
        )

    # 4. Category that jumped month on month
    if this_month in category_by_month and last_month in category_by_month:
        jumps = []
        for category, amount in category_by_month[this_month].items():
            previous = category_by_month[last_month].get(category, 0.0)
            delta = _pct_change(amount, previous)
            if delta is not None and delta >= 40 and amount > 0:
                jumps.append((category, delta, amount, previous))
        if jumps:
            category, delta, amount, previous = max(jumps, key=lambda j: j[1])
            insights.append(
                _insight(
                    "category_jump",
                    "watch",
                    f"{category} jumped {round(delta)}% this month",
                    f"{_fmt(previous, base_currency)} last month against "
                    f"{_fmt(amount, base_currency)} now. Worth a quick look at what "
                    f"changed.",
                    category=category,
                    metric=round(delta, 1),
                )
            )

    # 5. Unusually large single transaction
    amounts = [_base_amount(e) for e in expenses if _base_amount(e) > 0]
    if len(amounts) >= 8:
        mean = statistics.mean(amounts)
        deviation = statistics.pstdev(amounts)
        if deviation > 0:
            outliers = [e for e in expenses if _base_amount(e) > mean + 2.5 * deviation]
            if outliers:
                biggest = max(outliers, key=_base_amount)
                insights.append(
                    _insight(
                        "outlier",
                        "info",
                        "One transaction stands well above the rest",
                        f"{biggest.get('title', 'A payment')} at "
                        f"{_fmt(_base_amount(biggest), base_currency)} is far larger than "
                        f"your typical {_fmt(mean, base_currency)}. Normal for a one-off, "
                        f"worth checking if it was not.",
                        metric=round(_base_amount(biggest), 2),
                    )
                )

    # 6. Daily pace against this month's income
    day_of_month = now.day
    if day_of_month >= 5 and this_month_expense > 0:
        daily_pace = this_month_expense / day_of_month
        days_in_month = 30
        projected = daily_pace * days_in_month
        if this_month_income > 0 and projected > this_month_income:
            insights.append(
                _insight(
                    "pace",
                    "alert",
                    "At this pace you will overshoot this month",
                    f"You are averaging {_fmt(daily_pace, base_currency)} a day, which "
                    f"lands around {_fmt(projected, base_currency)} by month end against "
                    f"{_fmt(this_month_income, base_currency)} of income.",
                    metric=round(projected, 2),
                )
            )
        else:
            insights.append(
                _insight(
                    "pace",
                    "info",
                    f"You are averaging {_fmt(daily_pace, base_currency)} a day",
                    f"On track for roughly {_fmt(projected, base_currency)} this month.",
                    metric=round(daily_pace, 2),
                )
            )

    # 7. Recurring payments
    recurring = _find_recurring(expenses)
    if recurring:
        yearly = sum(r["yearly_cost"] for r in recurring)
        insights.append(
            _insight(
                "recurring",
                "info",
                f"{len(recurring)} payments repeat every month",
                f"They add up to about {_fmt(yearly, base_currency)} a year. Cancelling "
                f"even one you no longer use frees real money.",
                metric=round(yearly, 2),
            )
        )

    # 8. Forecast
    if forecast:
        insights.append(
            _insight(
                "forecast",
                "info",
                f"Next month looks like {_fmt(forecast['next_month'], base_currency)}",
                f"Based on your last {forecast['months_used']} months, expect somewhere "
                f"between {_fmt(forecast['low'], base_currency)} and "
                f"{_fmt(forecast['high'], base_currency)}.",
                metric=forecast["next_month"],
            )
        )

    severity_rank = {"alert": 0, "watch": 1, "good": 2, "info": 3}
    insights.sort(key=lambda i: severity_rank.get(i["severity"], 4))

    # ---------------- Budget suggestions ----------------
    month_count = max(len(monthly_expense), 1)
    budget_suggestions = []
    for category, amount in sorted(category_totals.items(), key=lambda kv: kv[1], reverse=True):
        monthly_average = amount / month_count
        share = amount / total_expense if total_expense else 0
        # Ask for a 10% trim on anything above a quarter of the budget.
        trim = 0.90 if share > 0.25 else 1.0
        budget_suggestions.append(
            {
                "category": category,
                "current_monthly": round(monthly_average, 2),
                "suggested_monthly": round(monthly_average * trim, 2),
                "share": round(share * 100, 1),
            }
        )

    return {
        "currency": base_currency,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "has_data": True,
        "health": health,
        "forecast": forecast,
        "insights": insights[:8],
        "budget_suggestions": budget_suggestions[:6],
        "recurring": recurring,
        "totals": {
            "income": round(total_income, 2),
            "expense": round(total_expense, 2),
            "balance": round(balance, 2),
            "savings_rate": savings_rate,
            "this_month_expense": round(this_month_expense, 2),
            "last_month_expense": round(last_month_expense, 2),
            "months_tracked": len(months),
            "top_category": top_category,
        },
    }


# --------------------------------------------------------------------------
# Small internals
# --------------------------------------------------------------------------


def _safe_oid(user_id: str):
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        return None


def _fmt(amount: float, code: str) -> str:
    """Plain server-side formatting. The UI re-formats with the user's locale."""
    meta = currency_utils.CURRENCIES.get(code, {})
    symbol = meta.get("symbol", code)
    decimals = 0 if code in currency_utils.ZERO_DECIMAL else 0  # whole units read better here
    return f"{symbol} {amount:,.{decimals}f}"