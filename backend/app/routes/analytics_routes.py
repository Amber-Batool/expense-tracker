from fastapi import APIRouter, Depends, Query

from app.services import analytics_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
async def summary(current_user: dict = Depends(get_current_user)):
    return await analytics_service.get_summary(current_user["user_id"])


@router.get("/category-breakdown")
async def category_breakdown(current_user: dict = Depends(get_current_user)):
    return await analytics_service.get_category_breakdown(current_user["user_id"])


@router.get("/monthly-trend")
async def monthly_trend(
    months: int = Query(12, ge=1, le=36),
    current_user: dict = Depends(get_current_user),
):
    return await analytics_service.get_monthly_trend(current_user["user_id"], months)


@router.get("/daily-trend")
async def daily_trend(
    days: int = Query(30, ge=7, le=120),
    current_user: dict = Depends(get_current_user),
):
    return await analytics_service.get_daily_trend(current_user["user_id"], days)