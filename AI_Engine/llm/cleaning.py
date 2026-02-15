import json
from uuid import UUID
from embeddings import generate_embedding, save_embedding
from rag import retrieve_similar
from llm import generate_cleaning_suggestion
from database import get_session
from models import CleaningResult
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def process_row(tenant_id: str, dataset_id: UUID, row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a data row:
    1. Generate embedding for the row
    2. Retrieve similar context from tenant embeddings (RAG)
    3. Call LLM with context to generate cleaning suggestions
    4. Store results in database
    
    Returns: {id, status, suggestion}
    """
    try:
        # Step 1: Convert row to text representation
        text_representation = json.dumps(row, indent=2)
        logger.info(f"Processing row for tenant {tenant_id}, dataset {dataset_id}")
        
        # Step 2: Generate embedding for this row
        embedding = generate_embedding(text_representation)
        logger.debug(f"Generated embedding with dimension: {len(embedding)}")
        
        # Step 3: Save embedding to database for future RAG queries
        save_embedding(tenant_id, text_representation, embedding)
        
        # Step 4: Retrieve similar context from database (RAG)
        context_docs = retrieve_similar(tenant_id, embedding, top_k=3)
        context = "\n---\n".join(context_docs) if context_docs else "No previous examples available."
        logger.info(f"Retrieved {len(context_docs)} similar documents for context")
        
        # Step 5: Generate cleaning suggestion from LLM with context
        suggestion_text = generate_cleaning_suggestion(context, text_representation)
        logger.debug(f"LLM response received")
        
        # Step 6: Parse suggestion JSON
        suggestion_json = _parse_suggestion(suggestion_text)
        
        # Step 7: Save cleaning result to database
        session = get_session()
        try:
            cleaning_record = CleaningResult(
                tenant_id=tenant_id,
                dataset_id=dataset_id,
                row_data=row,
                ai_suggestion=suggestion_json,
                confidence=suggestion_json.get("confidence", None),
                status="processed"
            )
            session.add(cleaning_record)
            session.commit()
            session.refresh(cleaning_record)
            
            logger.info(f"Cleaning result saved with ID: {cleaning_record.id}")
            return {
                "id": cleaning_record.id,
                "status": cleaning_record.status,
                "suggestion": suggestion_json
            }
        finally:
            session.close()
    
    except Exception as e:
        logger.error(f"Error processing row: {str(e)}", exc_info=True)
        raise

def _parse_suggestion(suggestion_text: str) -> Dict[str, Any]:
    """Parse LLM suggestion text into JSON"""
    try:
        # Try direct JSON parsing
        return json.loads(suggestion_text)
    except json.JSONDecodeError:
        # If not valid JSON, extract JSON from response
        try:
            start = suggestion_text.find('{')
            end = suggestion_text.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = suggestion_text[start:end]
                return json.loads(json_str)
        except Exception:
            pass
        
        # Return raw suggestion if JSON parsing fails
        logger.warning("Could not parse suggestion as JSON, returning as raw text")
        return {"status": "error", "message": "Could not parse LLM response", "raw_response": suggestion_text}
