import os

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI is missing from .env")

DB_NAME = os.getenv("DB_NAME", "expense_tracker_db")

client = AsyncIOMotorClient(
    MONGO_URI,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
)

database = client[DB_NAME]

users_collection = database["users"]
expenses_collection = database["expenses"]
income_collection = database["income"]


async def init_indexes():
    """Create database indexes safely on application startup."""
    await users_collection.create_index("email", unique=True)
    await expenses_collection.create_index("user_id")
    await income_collection.create_index("user_id")


async def ping() -> bool:
    """Check whether MongoDB is reachable."""
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False