from fastapi import APIRouter, Depends

from app.services import ai_insights_service
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/ai", tags=["Insights"])


@router.get("/insights")
async def insights(current_user: dict = Depends(get_current_user)):
    """Full insight payload: health score, ranked insights, forecast, budgets."""
    return await ai_insights_service.generate_insights(current_user["user_id"])


@router.get("/health-score")
async def health_score(current_user: dict = Depends(get_current_user)):
    """Just the score — cheap enough to poll from a widget."""
    data = await ai_insights_service.generate_insights(current_user["user_id"])
    return {
        "health": data["health"],
        "currency": data["currency"],
        "totals": data["totals"],
    }


@router.get("/forecast")
async def forecast(current_user: dict = Depends(get_current_user)):
    data = await ai_insights_service.generate_insights(current_user["user_id"])
    return {
        "forecast": data["forecast"],
        "currency": data["currency"],
        "budget_suggestions": data["budget_suggestions"],
    }