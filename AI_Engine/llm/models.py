from sqlalchemy import Column, String, Integer, Float, TIMESTAMP, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Index
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects.postgresql import DOUBLE_PRECISION
from sqlalchemy_utils import UUIDType

Base = declarative_base()

# ------------------------------
# Tenant Embeddings Table
# ------------------------------
class TenantEmbedding(Base):
    __tablename__ = "tenant_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(255), nullable=False)
    content = Column(String, nullable=False)           # The row text or context
    embedding = Column(ARRAY(Float), nullable=False)   # Store embeddings as array
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index("idx_tenant_embeddings_tenant", "tenant_id"),
    )


# ------------------------------
# Cleaning Results Table
# ------------------------------
class CleaningResult(Base):
    __tablename__ = "cleaning_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(String(255), nullable=False)
    dataset_id = Column(UUIDType(binary=False), nullable=False)
    row_data = Column(JSON, nullable=False)           # Original row JSON
    ai_suggestion = Column(JSON, nullable=False)     # LLM-generated cleaning suggestion
    confidence = Column(Float, nullable=True)        # Optional confidence score
    status = Column(String(50), default="processed")
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        Index("idx_cleaning_results_tenant_dataset", "tenant_id", "dataset_id"),
    )
