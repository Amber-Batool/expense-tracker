from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.database.mongodb import expenses_collection, income_collection
from app.services.expense_service import get_user_currency


def _amount(doc: dict) -> float:
    """Always report in the user's base currency."""
    value = doc.get("base_amount")
    if value is None:
        value = doc.get("amount", 0)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _date(doc: dict) -> datetime:
    value = doc.get("date") or doc.get("created_at")
    if not isinstance(value, datetime):
        return datetime.now(timezone.utc)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def _load(user_id: str):
    expenses = await expenses_collection.find({"user_id": user_id}).to_list(length=20000)
    income = await income_collection.find({"user_id": user_id}).to_list(length=20000)
    return expenses, income


async def get_summary(user_id: str):
    expenses, income = await _load(user_id)
    currency = await get_user_currency(user_id)

    total_expense = sum(_amount(e) for e in expenses)
    total_income = sum(_amount(i) for i in income)

    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_end = start_of_month - timedelta(seconds=1)
    start_of_last_month = last_month_end.replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    this_month_expense = sum(
        _amount(e) for e in expenses if _date(e) >= start_of_month
    )
    this_month_income = sum(_amount(i) for i in income if _date(i) >= start_of_month)
    last_month_expense = sum(
        _amount(e) for e in expenses if start_of_last_month <= _date(e) <= last_month_end
    )

    change = None
    if last_month_expense > 0:
        change = round(
            ((this_month_expense - last_month_expense) / last_month_expense) * 100, 1
        )

    return {
        "currency": currency,
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(total_income - total_expense, 2),
        "this_month_expense": round(this_month_expense, 2),
        "this_month_income": round(this_month_income, 2),
        "last_month_expense": round(last_month_expense, 2),
        "month_over_month_change": change,
        "savings_rate": round(
            ((total_income - total_expense) / total_income) * 100, 1
        )
        if total_income > 0
        else 0.0,
        "expense_count": len(expenses),
        "income_count": len(income),
        "transaction_count": len(expenses) + len(income),
    }


async def get_category_breakdown(user_id: str):
    expenses, _ = await _load(user_id)

    totals: dict[str, float] = defaultdict(float)
    counts: dict[str, int] = defaultdict(int)
    for expense in expenses:
        category = expense.get("category") or "Other"
        totals[category] += _amount(expense)
        counts[category] += 1

    grand_total = sum(totals.values())

    return [
        {
            "category": category,
            "amount": round(amount, 2),
            "count": counts[category],
            "share": round((amount / grand_total) * 100, 1) if grand_total else 0.0,
        }
        for category, amount in sorted(totals.items(), key=lambda kv: kv[1], reverse=True)
    ]


async def get_monthly_trend(user_id: str, months: int = 12):
    expenses, income = await _load(user_id)

    buckets: dict[str, dict] = {}

    def bucket(key: str) -> dict:
        return buckets.setdefault(key, {"month": key, "expense": 0.0, "income": 0.0})

    for expense in expenses:
        bucket(_date(expense).strftime("%Y-%m"))["expense"] += _amount(expense)
    for entry in income:
        bucket(_date(entry).strftime("%Y-%m"))["income"] += _amount(entry)

    ordered = sorted(buckets.values(), key=lambda row: row["month"])[-months:]

    for row in ordered:
        row["expense"] = round(row["expense"], 2)
        row["income"] = round(row["income"], 2)
        row["savings"] = round(row["income"] - row["expense"], 2)

    return ordered


async def get_daily_trend(user_id: str, days: int = 30):
    """Spending per day for the last N days — used by the sparkline."""
    expenses, _ = await _load(user_id)

    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=days - 1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    buckets = {
        (start + timedelta(days=offset)).strftime("%Y-%m-%d"): 0.0
        for offset in range(days)
    }

    for expense in expenses:
        key = _date(expense).strftime("%Y-%m-%d")
        if key in buckets:
            buckets[key] += _amount(expense)

    return [
        {"date": key, "amount": round(value, 2)} for key, value in sorted(buckets.items())
    ]