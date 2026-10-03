from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.income_schema import IncomeCreateSchema, IncomeUpdateSchema
from app.services import expense_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/income", tags=["Income"])


@router.post("/", status_code=201)
async def add_income(
    payload: IncomeCreateSchema, current_user: dict = Depends(get_current_user)
):
    return await expense_service.create_income(current_user["user_id"], payload)


@router.get("/")
async def list_income(
    search: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=5000),
    current_user: dict = Depends(get_current_user),
):
    return await expense_service.get_income(current_user["user_id"], search, limit)


@router.put("/{income_id}")
async def edit_income(
    income_id: str,
    payload: IncomeUpdateSchema,
    current_user: dict = Depends(get_current_user),
):
    return await expense_service.update_income(
        current_user["user_id"], income_id, payload
    )


@router.delete("/{income_id}")
async def remove_income(income_id: str, current_user: dict = Depends(get_current_user)):
    return await expense_service.delete_income(current_user["user_id"], income_id)