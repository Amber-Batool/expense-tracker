from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database.mongodb import users_collection
from app.schemas.auth_schema import (
    ChangePasswordSchema,
    LoginSchema,
    SignupSchema,
    UpdateProfileSchema,
)
from app.services import expense_service
from app.utils import currency as currency_utils
from app.utils.jwt_handler import create_access_token
from app.utils.security import hash_password, verify_password


def _public_user(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "currency": currency_utils.normalise(doc.get("currency")),
    }


async def _find_user(user_id: str) -> dict:
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except (InvalidId, TypeError):
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    return user


async def signup_user(payload: SignupSchema):
    email = payload.email.lower().strip()

    if await users_collection.find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Try logging in.",
        )

    document = {
        "name": payload.name.strip(),
        "email": email,
        "hashed_password": hash_password(payload.password),
        "currency": currency_utils.normalise(payload.currency),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        result = await users_collection.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Try logging in.",
        )

    document["_id"] = result.inserted_id
    user = _public_user(document)

    return {
        "access_token": create_access_token(
            {"sub": user["id"], "email": user["email"], "name": user["name"]}
        ),
        "token_type": "bearer",
        "user": user,
    }


async def login_user(payload: LoginSchema):
    email = payload.email.lower().strip()
    document = await users_collection.find_one({"email": email})

    if not document or not verify_password(
        payload.password, document.get("hashed_password", "")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="That email and password do not match.",
        )

    user = _public_user(document)

    return {
        "access_token": create_access_token(
            {"sub": user["id"], "email": user["email"], "name": user["name"]}
        ),
        "token_type": "bearer",
        "user": user,
    }


async def get_profile(user_id: str):
    return _public_user(await _find_user(user_id))


async def update_profile(user_id: str, payload: UpdateProfileSchema):
    document = await _find_user(user_id)
    updates = {}

    if payload.name is not None:
        updates["name"] = payload.name.strip()

    rebased = None
    if payload.currency is not None:
        new_currency = currency_utils.normalise(payload.currency)
        if not currency_utils.is_supported(payload.currency):
            raise HTTPException(
                status_code=400,
                detail=f"{payload.currency} is not one of the supported currencies.",
            )
        if new_currency != currency_utils.normalise(document.get("currency")):
            updates["currency"] = new_currency
            rebased = new_currency

    if not updates:
        return {"user": _public_user(document), "rebased": None}

    updates["updated_at"] = datetime.now(timezone.utc)
    await users_collection.update_one({"_id": document["_id"]}, {"$set": updates})

    # Switching base currency means every historical total has to be re-converted.
    rebase_result = None
    if rebased:
        rebase_result = await expense_service.rebase_all(user_id, rebased)

    refreshed = await _find_user(user_id)
    return {"user": _public_user(refreshed), "rebased": rebase_result}


async def change_password(user_id: str, payload: ChangePasswordSchema):
    document = await _find_user(user_id)

    if not verify_password(payload.current_password, document.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Your current password is incorrect.")

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400, detail="Pick a password different from the current one."
        )

    await users_collection.update_one(
        {"_id": document["_id"]},
        {
            "$set": {
                "hashed_password": hash_password(payload.new_password),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"message": "Password changed."}