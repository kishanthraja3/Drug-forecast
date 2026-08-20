import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env file
load_dotenv()

db_host = os.getenv("DATABRICKS_SERVER_HOSTNAME")
db_http_path = os.getenv("DATABRICKS_HTTP_PATH")
db_token = os.getenv("DATABRICKS_TOKEN")
db_catalog = os.getenv("DATABRICKS_CATALOG", "drug_forecasting")
db_app_schema = os.getenv("DATABRICKS_APP_SCHEMA", "app")
db_gold_schema = os.getenv("DATABRICKS_GOLD_SCHEMA", "gold")

# Flag to indicate if we're using Databricks
IS_DATABRICKS = bool(db_host and db_http_path and db_token)

if IS_DATABRICKS:
    # App tables (organizations, users, forecasts) live in the 'app' schema
    DATABASE_URL = (
        f"databricks://token:{db_token}@{db_host}"
        f"?http_path={db_http_path}"
        f"&catalog={db_catalog}"
        f"&schema={db_app_schema}"
    )
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:8483@localhost:5432/pharmalaunch")
    # Fix postgresql:// URI format if needed
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection to SQL engine
connect_args = {"_disable_pandas": True} if IS_DATABRICKS else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from sqlalchemy import func

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_next_id(db, model):
    """
    Returns the next auto-incrementing ID for a model by querying MAX(id) + 1.
    This resolves identity/lastrowid retrieval issues in Databricks.
    """
    try:
        max_id = db.query(func.max(model.id)).scalar()
        return (max_id or 0) + 1
    except Exception:
        import random
        return random.randint(100000, 999999)
