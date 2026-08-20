import json
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, TypeDecorator, BigInteger, Identity
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class JSONString(TypeDecorator):
    """
    Custom SQLAlchemy type that stores Python dicts/lists as JSON strings.
    Works transparently with both SQLite (native JSON) and Databricks (STRING columns).
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Convert Python dict/list to JSON string before writing to DB."""
        if value is not None:
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        """Convert JSON string back to Python dict/list when reading from DB."""
        if value is not None and isinstance(value, str):
            return json.loads(value)
        return value


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(BigInteger, Identity(), primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, Identity(), primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False, default="pbkdf2_sha256")
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="launch_director") # launch_director, forecast_analyst, commercial_associate, management_viewer
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class AnalogProduct(Base):
    """
    Stores all 150 historical benchmark analog products in the database.
    """
    __tablename__ = "analog_products"

    id = Column(BigInteger, Identity(), primary_key=True)
    product_id = Column(String(100), unique=True, index=True, nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    active_ingredient = Column(String(100), nullable=True)
    pharmacological_class = Column(String(150), nullable=True)
    mechanism_of_action = Column(Text, nullable=True)
    route_of_administration = Column(String(50), nullable=True)
    target_population = Column(String(50), nullable=True)
    addressable_population = Column(Float, nullable=True)
    competition_level = Column(Float, nullable=True)
    relative_price_index = Column(Float, nullable=True)
    market_access_level = Column(Float, nullable=True)
    clinical_evidence_strength = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserForecastInput(Base):
    """
    Stores user-entered input parameters.
    """
    __tablename__ = "user_forecast_inputs"

    id = Column(BigInteger, Identity(), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    
    # Core User Identification Inputs
    product_id = Column(String(50), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    
    # Key Numeric User Inputs
    addressable_population = Column(Float, nullable=False)
    estimated_penetration = Column(Float, nullable=False)
    top_k = Column(Integer, nullable=False, default=3)
    w_analog = Column(Float, nullable=False, default=0.10)
    
    # Full Dictionary of User Input Attributes (stored as JSON string)
    user_inputs_json = Column(JSONString, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ForecastRecord(Base):
    """
    Stores complete forecast outputs, Bass parameters (p, q, m), 
    analogs used, 52-week trajectory points, 12-month points, and explanations.
    """
    __tablename__ = "forecast_records"

    id = Column(BigInteger, Identity(), primary_key=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)

    product_id = Column(String(50), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    addressable_population = Column(Float, nullable=False)
    estimated_penetration = Column(Float, nullable=False)

    # Bass Model Calculated Parameters
    p_hat = Column(Float, nullable=False)
    q_hat = Column(Float, nullable=False)
    m_hat = Column(Float, nullable=False)

    # Summary Prescription Totals
    base_52w_rx = Column(Float, nullable=False)
    bull_52w_rx = Column(Float, nullable=False)
    bear_52w_rx = Column(Float, nullable=False)

    top_k = Column(Integer, nullable=False)
    w_analog = Column(Float, nullable=False)

    # Complete JSON Data Blobs (stored as JSON strings for Databricks compatibility)
    input_json = Column(JSONString, nullable=False)
    bass_params_json = Column(JSONString, nullable=False)
    analogs_used_json = Column(JSONString, nullable=False)
    weekly_forecast_json = Column(JSONString, nullable=False)
    monthly_forecast_json = Column(JSONString, nullable=False)
    explanations_json = Column(JSONString, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
