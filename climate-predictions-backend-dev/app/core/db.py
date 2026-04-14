import time

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

from app.core.all_db_models import SQLBase
from app.models.db.climate import ClimateDataFact, ClimateRasters
from app.models.db.materialized_views import ClmValsPerGovOrCountryMonthMatView, ClmValsPerGovOrCountryYearMatView

# Create async engine for async operations
async_engine = create_async_engine(
    settings.DATABASE_URL_ASYNC,
    echo=True,
    future=True
)

# Create sync engine for sync operations
sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=True
)

sync_engine_no_implicit_trans = create_engine(
    settings.DATABASE_URL,
    echo=True,
    isolation_level="AUTOCOMMIT"
)

# Use session maker for async session
AsyncSessionLocal = sessionmaker(
    bind=async_engine,  # Bind the async engine
    class_=AsyncSession,
    expire_on_commit=False
)

# Use session maker for sync session
SyncSessionLocal = sessionmaker(
    bind=sync_engine,  # Bind the sync engine
    # class_=Session,
    # expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

def init_db_sync():
    """
    Initialize the database for sync operations by creating all SQLBase tables if they do not exist.
    This function must be sync when using sync SQLAlchemy.
    """
    # Create schemas if they don't exist
    with sync_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis_raster;"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb;"))

        conn.execute(text("CREATE SCHEMA IF NOT EXISTS dwh;"))

        # Create tables based on SQLBase models
        SQLBase.metadata.create_all(conn)

        # Create hypertable for the climate_data_fact table
        ClimateDataFact.create_hypertable(conn)
        ClimateRasters.create_hypertable(conn)

        conn.commit()

    with sync_engine_no_implicit_trans.connect() as conn:
        ClmValsPerGovOrCountryMonthMatView.create(conn)
        ClmValsPerGovOrCountryYearMatView.create(conn)

    print("Database initialized.")


# Async function to get async session
async def get_db_async() -> AsyncSession:
    """
    Dependency function to get the async database session
    @return: AsyncSession
    """
    async with AsyncSessionLocal() as session:
        yield session

# Sync function to get sync session
def get_db_sync() -> Session:
    """
    Dependency function to get the sync database session
    @return: Session
    """
    return SyncSessionLocal()
