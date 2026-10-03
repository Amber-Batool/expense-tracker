from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.schemas.expense_schema import ExpenseCreateSchema, ExpenseUpdateSchema
from app.services import expense_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])


@router.post("/", status_code=201)
async def add_expense(
    payload: ExpenseCreateSchema, current_user: dict = Depends(get_current_user)
):
    return await expense_service.create_expense(current_user["user_id"], payload)


@router.get("/")
async def list_expenses(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=5000),
    current_user: dict = Depends(get_current_user),
):
    return await expense_service.get_expenses(
        current_user["user_id"], category, search, limit
    )


@router.put("/{expense_id}")
async def edit_expense(
    expense_id: str,
    payload: ExpenseUpdateSchema,
    current_user: dict = Depends(get_current_user),
):
    return await expense_service.update_expense(
        current_user["user_id"], expense_id, payload
    )


@router.delete("/{expense_id}")
async def remove_expense(
    expense_id: str, current_user: dict = Depends(get_current_user)
):
    return await expense_service.delete_expense(current_user["user_id"], expense_id)