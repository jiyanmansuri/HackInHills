"""
Database Connection Manager.
Supports Supabase / PostgreSQL with automatic zero-setup fallback to SQLite.
"""

import logging
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import DATABASE_URI, DB_TYPE

logger = logging.getLogger(__name__)

# Base model for declarative tables
Base = declarative_base()

# Configure engine with dialect-specific optimizations
connect_args = {}
if DB_TYPE == "sqlite":
    connect_args["check_same_thread"] = False
    connect_args["timeout"] = 30
    engine = create_engine(DATABASE_URI, connect_args=connect_args, echo=False)

    # Enable WAL mode and foreign key constraints for SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

else:
    # PostgreSQL / Supabase
    engine = create_engine(
        DATABASE_URI,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_engine():
    """Return the active SQLAlchemy engine."""
    return engine


@contextmanager
def get_session():
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session rollback due to exception: {e}")
        raise
    finally:
        session.close()


def init_db():
    """Create all tables and seed initial contract specs if needed."""
    from backend.database.schema import ContractSpec
    from backend.config import CONTRACT_SPECS

    logger.info(f"Initializing database ({DB_TYPE}) at {DATABASE_URI}...")
    Base.metadata.create_all(bind=engine)

    # Seed contract specs if not present
    with get_session() as session:
        existing = session.query(ContractSpec).count()
        if existing == 0:
            logger.info("Seeding contracts_spec table from configuration...")
            for symbol, spec in CONTRACT_SPECS.items():
                record = ContractSpec(
                    symbol=symbol,
                    name=spec["name"],
                    contract_size_g=spec["contract_size_g"],
                    quotation_base_g=spec["quotation_base_g"],
                    purity=spec["purity"],
                    tick_size=spec["tick_size"],
                    trading_unit=spec["trading_unit"],
                    quote_unit=spec["quote_unit"],
                    description=spec.get("description", "")
                )
                session.add(record)
            session.commit()
            logger.info(f"Successfully seeded {len(CONTRACT_SPECS)} contract specs.")
