from google import genai
from config import GEMINI_API_KEY, GEMINI_MODEL
import logging

logger = logging.getLogger(__name__)

# Initialize Gemini client (API key from GEMINI_API_KEY environment variable)
client = genai.Client(api_key=GEMINI_API_KEY)

def generate_cleaning_suggestion(context: str, row_data: str) -> str:
    """
    Generate cleaning suggestions using Google Gemini API
    
    Args:
        context: Similar examples from database (RAG context)
        row_data: The data row to clean (JSON formatted)
    
    Returns:
        JSON string with cleaning suggestions
    """
    user_message = f"""You are a data cleaning expert. Analyze the following data row and provide cleaning suggestions.

## Context (similar previous rows):
{context}

## Row to Clean:
{row_data}

Provide your response as a JSON object with EXACTLY this structure (no markdown, just raw JSON):
{{
  "field": "name of the field with issues (if any)",
  "issue_type": "type of issue (missing, invalid_format, inconsistent, etc.)",
  "suggested_fix": "specific suggestion to fix the issue",
  "confidence": 0.85,
  "notes": "any additional notes"
}}

If there are no issues, still return JSON with field "status" set to "clean"."""
    
    try:
        logger.debug(f"Calling Google Gemini API with model: {GEMINI_MODEL}")
        
        response = client.models.generate_content(model=GEMINI_MODEL, contents=user_message)
        response_text = response.text
        
        logger.debug(f"Raw API response: {response_text}")
        logger.info(f"LLM suggestion generated successfully")
        return response_text
    except Exception as e:
        logger.error(f"Error generating LLM suggestion: {e}", exc_info=True)
        return '{"status": "error", "message": "LLM API call failed"}'
