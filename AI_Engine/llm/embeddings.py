from sentence_transformers import SentenceTransformer
import numpy as np
from config import HF_EMBEDDING_MODEL
from database import get_session
from models import TenantEmbedding
from typing import List
import logging

logger = logging.getLogger(__name__)

# Load embedding model once (lightweight, ~80MB)
model = SentenceTransformer(HF_EMBEDDING_MODEL)

def generate_embedding(text: str) -> List[float]:
    """Generate embedding vector for given text using sentence-transformers"""
    try:
        embedding = model.encode(text)
        return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
    except Exception as e:
        logger.error(f"Error generating embedding: {e}", exc_info=True)
        raise

def save_embedding(tenant_id: str, content: str, embedding: List[float]) -> TenantEmbedding:
    """Save embedding to database"""
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
