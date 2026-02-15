import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the parent directory (AI_Engine root)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Also try loading from current directory if not found
if not env_path.exists():
    load_dotenv()

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "clean_stream")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Google Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Embedding Configuration
HF_EMBEDDING_MODEL = os.getenv("HF_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Validate GEMINI_API_KEY is set
if not GEMINI_API_KEY:
    import warnings
    warnings.warn(
        "⚠️ Google Gemini API key (GEMINI_API_KEY) is not properly configured. "
        "Please set GEMINI_API_KEY environment variable with your Gemini API key. "
        "Get one at: https://aistudio.google.com/app/apikey "
        "The LLM API calls may fail without proper authentication."
    )

