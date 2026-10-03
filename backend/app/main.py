import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request

from app.database.mongodb import init_indexes
from app.routes import (
    ai_routes,
    analytics_routes,
    auth_routes,
    expense_routes,
    income_routes,
)
from app.utils import currency as currency_utils

logger = logging.getLogger("expensy")
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")


async def _rate_refresh_loop():
    """Keep exchange rates warm without blocking anything."""
    while True:
        try:
            if await currency_utils.refresh_rates():
                logger.info("Exchange rates refreshed")
        except Exception as exc:  # pragma: no cover
            logger.warning("Rate refresh skipped: %s", exc)
        await asyncio.sleep(60 * 60 * 6)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup. Nothing here is allowed to take the server down — if Mongo is
    # briefly unreachable the app still boots and reports it on /api/health.
    try:
        await init_indexes()
        logger.info("MongoDB indexes ready")
    except Exception as exc:
        logger.warning("Could not create indexes yet: %s", exc)

    task = asyncio.create_task(_rate_refresh_loop())
    yield

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Expensy API",
    description="Backend for the Expensy personal expense tracker",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(expense_routes.router)
app.include_router(income_routes.router)
app.include_router(analytics_routes.router)
app.include_router(ai_routes.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return JSON on unexpected failures so the frontend never sees raw HTML."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our side. Please try again."},
    )


@app.get("/")
async def root():
    return {"message": "Expensy API is running", "docs": "/docs"}


# @app.get("/api/health")
# async def health():
#     db_ok = await ping()
#     return {
#         "status": "ok" if db_ok else "degraded",
#         "database": "connected" if db_ok else "unreachable",
#     }

@app.get("/api/health")
async def health():
    return {
        "status": "ok"
    }
@app.get("/api/currencies", tags=["Currency"])
async def currencies():
    """Public: the frontend fetches this to build its currency picker."""
    await currency_utils.refresh_rates()
    return {
        "default": currency_utils.DEFAULT_CURRENCY,
        "currencies": currency_utils.list_currencies(),
        "rates": currency_utils.rates_snapshot(),
    }   
