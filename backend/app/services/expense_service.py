from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.database.mongodb import expenses_collection, income_collection, users_collection
from app.utils import currency as currency_utils


# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------


def _oid(value: str, label: str = "record") -> ObjectId:
    """Turn a path parameter into an ObjectId, or fail with a clean 404."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"That {label} does not exist.",
        )


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_user_currency(user_id: str) -> str:
    """The base currency every total is reported in."""
    try:
        user = await users_collection.find_one(
            {"_id": ObjectId(user_id)}, {"currency": 1}
        )
    except (InvalidId, TypeError):
        user = None
    return currency_utils.normalise((user or {}).get("currency"))


def _serialize(doc: dict, label_field: str) -> dict:
    base_currency = currency_utils.normalise(doc.get("base_currency"))
    entry_currency = currency_utils.normalise(doc.get("currency") or base_currency)
    amount = float(doc.get("amount", 0))
    base_amount = float(doc.get("base_amount", amount))

    return {
        "id": str(doc["_id"]),
        label_field: doc.get(label_field, ""),
        "amount": amount,
        "currency": entry_currency,
        "base_amount": base_amount,
        "base_currency": base_currency,
        "note": doc.get("note") or "",
        "date": doc.get("date") or doc.get("created_at") or _now(),
    }


def serialize_expense(doc: dict) -> dict:
    data = _serialize(doc, "title")
    data["category"] = doc.get("category", "Other")
    return data


def serialize_income(doc: dict) -> dict:
    return _serialize(doc, "source")


async def _build_payload(user_id: str, payload, *, partial: bool) -> dict:
    """
    Normalise an incoming create/update payload:
      - drop unset fields on updates
      - resolve the entry currency
      - recompute base_amount whenever amount or currency changes
    """
    data = payload.model_dump(exclude_unset=True) if partial else payload.model_dump()
    data = {k: v for k, v in data.items() if v is not None}

    base_currency = await get_user_currency(user_id)
    entry_currency = currency_utils.normalise(data.get("currency") or base_currency)
    data["currency"] = entry_currency
    data["base_currency"] = base_currency

    if "amount" in data:
        data["amount"] = round(float(data["amount"]), 2)
        data["base_amount"] = currency_utils.convert(
            data["amount"], entry_currency, base_currency
        )

    if "date" in data and isinstance(data["date"], datetime):
        if data["date"].tzinfo is None:
            data["date"] = data["date"].replace(tzinfo=timezone.utc)

    return data


async def _recompute_base(collection, doc_id: ObjectId, data: dict):
    """When only the currency changed, the base amount still needs updating."""
    if "currency" in data and "amount" not in data:
        existing = await collection.find_one({"_id": doc_id}, {"amount": 1})
        if existing:
            data["base_amount"] = currency_utils.convert(
                float(existing.get("amount", 0)),
                data["currency"],
                data["base_currency"],
            )


# --------------------------------------------------------------------------
# Expenses
# --------------------------------------------------------------------------


async def create_expense(user_id: str, payload):
    data = await _build_payload(user_id, payload, partial=False)
    data["user_id"] = user_id
    data.setdefault("date", _now())
    data.setdefault("note", "")
    data["created_at"] = _now()
    data["updated_at"] = _now()

    result = await expenses_collection.insert_one(data)
    doc = await expenses_collection.find_one({"_id": result.inserted_id})
    return serialize_expense(doc)


async def get_expenses(
    user_id: str,
    category: str = None,
    search: str = None,
    limit: int = 1000,
):
    query = {"user_id": user_id}
    if category and category.lower() != "all":
        query["category"] = category
    if search:
        # Escape the input so a stray "(" from a user can't break the query.
        import re

        pattern = re.escape(search.strip())
        query["$or"] = [
            {"title": {"$regex": pattern, "$options": "i"}},
            {"note": {"$regex": pattern, "$options": "i"}},
        ]

    docs = await expenses_collection.find(query).sort("date", -1).to_list(length=limit)
    return [serialize_expense(doc) for doc in docs]


async def update_expense(user_id: str, expense_id: str, payload):
    doc_id = _oid(expense_id, "expense")
    data = await _build_payload(user_id, payload, partial=True)

    # currency/base_currency are always injected; ignore a payload that
    # changed nothing else.
    meaningful = {k for k in data if k not in {"currency", "base_currency"}}
    if not meaningful and "currency" not in payload.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="Nothing to update.")

    await _recompute_base(expenses_collection, doc_id, data)
    data["updated_at"] = _now()

    result = await expenses_collection.update_one(
        {"_id": doc_id, "user_id": user_id}, {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="That expense does not exist.")

    doc = await expenses_collection.find_one({"_id": doc_id})
    return serialize_expense(doc)


async def delete_expense(user_id: str, expense_id: str):
    doc_id = _oid(expense_id, "expense")
    result = await expenses_collection.delete_one({"_id": doc_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="That expense does not exist.")
    return {"message": "Expense deleted.", "id": expense_id}


# --------------------------------------------------------------------------
# Income
# --------------------------------------------------------------------------


async def create_income(user_id: str, payload):
    data = await _build_payload(user_id, payload, partial=False)
    data["user_id"] = user_id
    data.setdefault("date", _now())
    data.setdefault("note", "")
    data["created_at"] = _now()
    data["updated_at"] = _now()

    result = await income_collection.insert_one(data)
    doc = await income_collection.find_one({"_id": result.inserted_id})
    return serialize_income(doc)


async def get_income(user_id: str, search: str = None, limit: int = 1000):
    query = {"user_id": user_id}
    if search:
        import re

        pattern = re.escape(search.strip())
        query["$or"] = [
            {"source": {"$regex": pattern, "$options": "i"}},
            {"note": {"$regex": pattern, "$options": "i"}},
        ]

    docs = await income_collection.find(query).sort("date", -1).to_list(length=limit)
    return [serialize_income(doc) for doc in docs]


async def update_income(user_id: str, income_id: str, payload):
    doc_id = _oid(income_id, "income entry")
    data = await _build_payload(user_id, payload, partial=True)

    meaningful = {k for k in data if k not in {"currency", "base_currency"}}
    if not meaningful and "currency" not in payload.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="Nothing to update.")

    await _recompute_base(income_collection, doc_id, data)
    data["updated_at"] = _now()

    result = await income_collection.update_one(
        {"_id": doc_id, "user_id": user_id}, {"$set": data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="That income entry does not exist.")

    doc = await income_collection.find_one({"_id": doc_id})
    return serialize_income(doc)


async def delete_income(user_id: str, income_id: str):
    doc_id = _oid(income_id, "income entry")
    result = await income_collection.delete_one({"_id": doc_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="That income entry does not exist.")
    return {"message": "Income deleted.", "id": income_id}


# --------------------------------------------------------------------------
# Currency migration
# --------------------------------------------------------------------------


async def rebase_all(user_id: str, new_base: str) -> dict:
    """
    Called when the user switches their base currency. Recomputes every
    stored base_amount so historical totals stay correct.
    """
    new_base = currency_utils.normalise(new_base)
    touched = 0

    for collection in (expenses_collection, income_collection):
        docs = await collection.find({"user_id": user_id}).to_list(length=20000)
        for doc in docs:
            entry_currency = currency_utils.normalise(
                doc.get("currency") or doc.get("base_currency")
            )
            await collection.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "currency": entry_currency,
                        "base_currency": new_base,
                        "base_amount": currency_utils.convert(
                            float(doc.get("amount", 0)), entry_currency, new_base
                        ),
                    }
                },
            )
            touched += 1

    return {"base_currency": new_base, "records_updated": touched}