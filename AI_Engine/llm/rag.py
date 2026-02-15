from database import get_session
from models import TenantEmbedding
from typing import List
import numpy as np
import logging

logger = logging.getLogger(__name__)

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Compute cosine similarity between two vectors"""
    arr1 = np.array(vec1)
    arr2 = np.array(vec2)
    
    # Normalize vectors
    arr1_norm = arr1 / (np.linalg.norm(arr1) + 1e-8)
    arr2_norm = arr2 / (np.linalg.norm(arr2) + 1e-8)
    
    return float(np.dot(arr1_norm, arr2_norm))

def retrieve_similar(tenant_id: str, embedding: List[float], top_k: int = 3) -> List[str]:
    """Retrieve similar embeddings from database using cosine similarity"""
    session = get_session()
    try:
        # Get all embeddings for the tenant
        all_embeddings = session.query(
            TenantEmbedding.content,
            TenantEmbedding.embedding
        ).filter(
            TenantEmbedding.tenant_id == tenant_id
        ).all()
        
        if not all_embeddings:
            logger.warning(f"No embeddings found for tenant: {tenant_id}")
            return []
        
        # Compute similarities and sort
        similarities = []
        for content, db_embedding in all_embeddings:
            similarity = compute_cosine_similarity(embedding, db_embedding)
            similarities.append((content, similarity))
        
        # Sort by similarity (descending) and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [content for content, _ in similarities[:top_k]]
        
    except Exception as e:
        logger.error(f"Error retrieving similar embeddings: {e}", exc_info=True)
        return []
    finally:
        session.close()
