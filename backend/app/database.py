from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from app.config import settings
from app.models import Base

# Enable foreign keys for SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

is_sqlite = "sqlite" in settings.DATABASE_URL
engine_kwargs = {
    "echo": settings.DB_ECHO,
    "pool_pre_ping": True,
}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def db_transaction():
    """Managed transaction block with atomic commit/rollback."""
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def run_schema_migrations():
    """Ensure newly introduced columns are dynamically added to SQLite/Postgres tables."""
    with engine.begin() as conn:
        # Check users table
        try:
            if "sqlite" in settings.DATABASE_URL:
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_user_cols = [r[1] for r in res] if res else []
                if existing_user_cols and "reset_token" not in existing_user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_token VARCHAR"))
                if existing_user_cols and "reset_token_expires_at" not in existing_user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP"))
        except Exception:
            pass

        # Check employees table
        try:
            if "sqlite" in settings.DATABASE_URL:
                res = conn.execute(text("PRAGMA table_info(employees)")).fetchall()
                existing_emp_cols = [r[1] for r in res] if res else []
                if existing_emp_cols and "manager_id" not in existing_emp_cols:
                    conn.execute(text("ALTER TABLE employees ADD COLUMN manager_id VARCHAR"))
                if existing_emp_cols and "employment_type" not in existing_emp_cols:
                    conn.execute(text("ALTER TABLE employees ADD COLUMN employment_type VARCHAR DEFAULT 'full_time'"))
                if existing_emp_cols and "employment_status" not in existing_emp_cols:
                    conn.execute(text("ALTER TABLE employees ADD COLUMN employment_status VARCHAR DEFAULT 'active'"))
        except Exception:
            pass

def init_db():
    Base.metadata.create_all(bind=engine)
    run_schema_migrations()

