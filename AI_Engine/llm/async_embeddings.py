from sentence_transformers import SentenceTransformer
import numpy as np
import asyncio
from concurrent.futures import ThreadPoolExecutor
from config import HF_EMBEDDING_MODEL
from models import TenantEmbedding
from typing import List
import logging

logger = logging.getLogger(__name__)

# Load embedding model once (lightweight, ~80MB)
model = SentenceTransformer(HF_EMBEDDING_MODEL)

# Thread pool for CPU-bound embedding operations
_executor = ThreadPoolExecutor(max_workers=2)

def _generate_embedding_sync(text: str) -> List[float]:
    """Synchronous embedding generation (CPU-bound)"""
    try:
        embedding = model.encode(text)
        return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
    except Exception as e:
        logger.error(f"Error generating embedding: {e}", exc_info=True)
        raise

async def generate_embedding_async(text: str) -> List[float]:
    """
    Async embedding generation using thread pool
    This prevents blocking the event loop during CPU-intensive operations
    """
    try:
        loop = asyncio.get_event_loop()
        embedding = await loop.run_in_executor(_executor, _generate_embedding_sync, text)
        return embedding
    except Exception as e:
        logger.error(f"Error generating async embedding: {e}", exc_info=True)
        raise

# Keep sync version for backward compatibility
def generate_embedding(text: str) -> List[float]:
    """Synchronous embedding generation (deprecated, use async version)"""
    return _generate_embedding_sync(text)

async def save_embedding_async(tenant_id: str, content: str, embedding: List[float]) -> TenantEmbedding:
    """Save embedding to database (async placeholder)"""
    # For now, we'll keep this synchronous since sqlalchemy-utils doesn't have async support
    # In production, you'd use SQLAlchemy async session
    from database import get_session
    session = get_session()
    try:
        embedding_record = TenantEmbedding(
            tenant_id=tenant_id,
            content=content,
            embedding=embedding
        )
        session.add(embedding_record)
        session.commit()
        session.refresh(embedding_record)
        return embedding_record
    finally:
        session.close()

def save_embedding(tenant_id: str, content: str, embedding: List[float]) -> TenantEmbedding:
    """Synchronous embedding save (backward compatible)"""
    from database import get_session
    session = get_session()
    try:
        embedding_record = TenantEmbedding(
            tenant_id=tenant_id,
            content=content,
            embedding=embedding
        )
        session.add(embedding_record)
        session.commit()
        session.refresh(embedding_record)
        return embedding_record
    finally:
        session.close()
