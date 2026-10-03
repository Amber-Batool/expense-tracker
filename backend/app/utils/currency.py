"""
Multi-currency support.

Every amount is stored twice on a transaction:
  - `amount`      : what the user actually typed, in `currency`
  - `base_amount` : the same value converted to the user's base currency

Totals and analytics always sum `base_amount`, so a user can log a coffee in
TRY, rent in PKR and a subscription in USD and still get one honest balance.

Rates below are approximate "units per 1 USD" and are only a fallback. If you
set EXCHANGE_RATE_API_URL in .env the app will refresh them on startup and then
once every 12 hours. No API key is needed for the default open endpoint.
"""

from __future__ import annotations

import asyncio
import os
from datetime import datetime, timedelta, timezone

import httpx

# --------------------------------------------------------------------------
# Supported currencies
# --------------------------------------------------------------------------

CURRENCIES: dict[str, dict] = {
    "PKR": {"name": "Pakistani Rupee", "symbol": "Rs", "locale": "en-PK", "flag": "🇵🇰"},
    "USD": {"name": "US Dollar", "symbol": "$", "locale": "en-US", "flag": "🇺🇸"},
    "EUR": {"name": "Euro", "symbol": "€", "locale": "de-DE", "flag": "🇪🇺"},
    "GBP": {"name": "British Pound", "symbol": "£", "locale": "en-GB", "flag": "🇬🇧"},
    "TRY": {"name": "Turkish Lira", "symbol": "₺", "locale": "tr-TR", "flag": "🇹🇷"},
    "KRW": {"name": "South Korean Won", "symbol": "₩", "locale": "ko-KR", "flag": "🇰🇷"},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "locale": "en-IN", "flag": "🇮🇳"},
    "JPY": {"name": "Japanese Yen", "symbol": "¥", "locale": "ja-JP", "flag": "🇯🇵"},
    "MYR": {"name": "Malaysian Ringgit", "symbol": "RM", "locale": "ms-MY", "flag": "🇲🇾"},
    "CNY": {"name": "Chinese Yuan", "symbol": "¥", "locale": "zh-CN", "flag": "🇨🇳"},
    "AED": {"name": "UAE Dirham", "symbol": "د.إ", "locale": "ar-AE", "flag": "🇦🇪"},
    "SAR": {"name": "Saudi Riyal", "symbol": "﷼", "locale": "ar-SA", "flag": "🇸🇦"},
    "BDT": {"name": "Bangladeshi Taka", "symbol": "৳", "locale": "bn-BD", "flag": "🇧🇩"},
    "IDR": {"name": "Indonesian Rupiah", "symbol": "Rp", "locale": "id-ID", "flag": "🇮🇩"},
    "THB": {"name": "Thai Baht", "symbol": "฿", "locale": "th-TH", "flag": "🇹🇭"},
    "PHP": {"name": "Philippine Peso", "symbol": "₱", "locale": "en-PH", "flag": "🇵🇭"},
    "SGD": {"name": "Singapore Dollar", "symbol": "S$", "locale": "en-SG", "flag": "🇸🇬"},
    "CAD": {"name": "Canadian Dollar", "symbol": "C$", "locale": "en-CA", "flag": "🇨🇦"},
    "AUD": {"name": "Australian Dollar", "symbol": "A$", "locale": "en-AU", "flag": "🇦🇺"},
    "EGP": {"name": "Egyptian Pound", "symbol": "E£", "locale": "ar-EG", "flag": "🇪🇬"},
    "ZAR": {"name": "South African Rand", "symbol": "R", "locale": "en-ZA", "flag": "🇿🇦"},
    "NGN": {"name": "Nigerian Naira", "symbol": "₦", "locale": "en-NG", "flag": "🇳🇬"},
    "BRL": {"name": "Brazilian Real", "symbol": "R$", "locale": "pt-BR", "flag": "🇧🇷"},
    "RUB": {"name": "Russian Ruble", "symbol": "₽", "locale": "ru-RU", "flag": "🇷🇺"},
}

DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "PKR")

# Currencies that are conventionally written without decimals.
ZERO_DECIMAL = {"JPY", "KRW", "IDR"}

# Units per 1 USD. Fallback only — refreshed at runtime when the API is reachable.
_RATES: dict[str, float] = {
    "USD": 1.0,
    "PKR": 278.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "TRY": 34.0,
    "KRW": 1360.0,
    "INR": 84.0,
    "JPY": 152.0,
    "MYR": 4.45,
    "CNY": 7.15,
    "AED": 3.67,
    "SAR": 3.75,
    "BDT": 120.0,
    "IDR": 15800.0,
    "THB": 34.5,
    "PHP": 58.0,
    "SGD": 1.34,
    "CAD": 1.39,
    "AUD": 1.53,
    "EGP": 49.0,
    "ZAR": 17.8,
    "NGN": 1650.0,
    "BRL": 5.8,
    "RUB": 97.0,
}

_rates_fetched_at: datetime | None = None
_RATE_TTL = timedelta(hours=12)
_lock = asyncio.Lock()

RATE_API_URL = os.getenv(
    "EXCHANGE_RATE_API_URL",
    "https://open.er-api.com/v6/latest/USD",
)


def is_supported(code: str | None) -> bool:
    return bool(code) and code.upper() in CURRENCIES


def normalise(code: str | None) -> str:
    """Return a valid, upper-case currency code, falling back to the default."""
    if code and code.upper() in CURRENCIES:
        return code.upper()
    return DEFAULT_CURRENCY


def list_currencies() -> list[dict]:
    """Everything the frontend needs to render a currency picker."""
    return [
        {
            "code": code,
            "name": meta["name"],
            "symbol": meta["symbol"],
            "locale": meta["locale"],
            "flag": meta["flag"],
            "decimals": 0 if code in ZERO_DECIMAL else 2,
            "rate_per_usd": _RATES.get(code, 1.0),
        }
        for code, meta in CURRENCIES.items()
    ]


def convert(amount: float, from_code: str, to_code: str) -> float:
    """Convert between any two supported currencies, via USD."""
    src = normalise(from_code)
    dst = normalise(to_code)
    if src == dst:
        return round(float(amount), 2)

    src_rate = _RATES.get(src)
    dst_rate = _RATES.get(dst)
    if not src_rate or not dst_rate:
        return round(float(amount), 2)

    usd = float(amount) / src_rate
    return round(usd * dst_rate, 2)


async def refresh_rates() -> bool:
    """
    Pull fresh rates. Returns True when the table was updated.

    Never raises: if the network is down the app keeps running on the
    built-in fallback table.
    """
    global _rates_fetched_at

    async with _lock:
        if _rates_fetched_at and datetime.now(timezone.utc) - _rates_fetched_at < _RATE_TTL:
            return False

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(RATE_API_URL)
                response.raise_for_status()
                payload = response.json()

            rates = payload.get("rates") or payload.get("conversion_rates") or {}
            updated = {
                code: float(rates[code])
                for code in CURRENCIES
                if code in rates and float(rates[code]) > 0
            }

            if len(updated) >= 5:
                _RATES.update(updated)
                _RATES["USD"] = 1.0
                _rates_fetched_at = datetime.now(timezone.utc)
                return True
        except Exception:
            # Offline, rate-limited, or the shape changed — fallback table stands.
            pass

        return False


def rates_snapshot() -> dict:
    return {
        "base": "USD",
        "updated_at": _rates_fetched_at.isoformat() if _rates_fetched_at else None,
        "live": _rates_fetched_at is not None,
        "rates": dict(_RATES),
    }