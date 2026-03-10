import httpx
import asyncio
from config import GEMINI_API_KEY, GEMINI_MODEL
from tenacity import retry, stop_after_attempt, wait_exponential
from concurrency import with_concurrency_limit
import logging
import json

logger = logging.getLogger(__name__)

# Gemini API endpoint
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Global async client
_http_client = None

def get_http_client() -> httpx.AsyncClient: 
    """Get or create HTTP client"""
    global _http_client
    if _http_client is None:    
        _http_client = httpx.AsyncClient(timeout=60.0)
    return _http_client

async def close_http_client():
    """Close HTTP client"""
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def generate_cleaning_suggestion(context: str, row_data: str) -> str:
    """
    Generate cleaning suggestions using Google Gemini API (async with retry)
    
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
    
    # Use concurrency limit to prevent rate limiting
    async def _call_gemini():
        try:
            logger.debug(f"Calling Google Gemini API with model: {GEMINI_MODEL}")
            
            client = get_http_client()
            
            # Prepare request
            url = f"{GEMINI_API_URL}/{GEMINI_MODEL}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            }
            
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": user_message
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 2048
                }
            }
            
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            # Extract text from response
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate:
                    for part in candidate["content"].get("parts", []):
                        if "text" in part:
                            response_text = part["text"]
                            logger.debug(f"Raw API response: {response_text}")
                            logger.info("LLM suggestion generated successfully")
                            return response_text
            
            error_msg = "No valid response from Gemini"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini API HTTP error: {e.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}", exc_info=True)
            raise
    
    try:
        return await with_concurrency_limit(_call_gemini())
    except Exception as e:
        logger.error(f"Failed to generate LLM suggestion after retries: {e}")
        return json.dumps({
            "status": "error",
            "message": "LLM API call failed",
            "details": str(e)
        })
