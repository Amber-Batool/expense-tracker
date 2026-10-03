from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ExpenseCreateSchema(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    note: Optional[str] = ""
    date: Optional[datetime] = None
    # The currency this amount was entered in. Falls back to the user's
    # base currency when omitted.
    currency: Optional[str] = Field(default=None, max_length=3)


class ExpenseUpdateSchema(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[str] = None
    note: Optional[str] = None
    date: Optional[datetime] = None
    currency: Optional[str] = Field(default=None, max_length=3)


class ExpenseResponseSchema(BaseModel):
    id: str
    title: str
    amount: float
    currency: str
    base_amount: float
    base_currency: str
    category: str
    note: str
    date: datetime