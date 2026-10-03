from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class IncomeCreateSchema(BaseModel):
    source: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    note: Optional[str] = ""
    date: Optional[datetime] = None
    currency: Optional[str] = Field(default=None, max_length=3)


class IncomeUpdateSchema(BaseModel):
    source: Optional[str] = Field(default=None, min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)
    note: Optional[str] = None
    date: Optional[datetime] = None
    currency: Optional[str] = Field(default=None, max_length=3)


class IncomeResponseSchema(BaseModel):
    id: str
    source: str
    amount: float
    currency: str
    base_amount: float
    base_currency: str
    note: str
    date: datetime