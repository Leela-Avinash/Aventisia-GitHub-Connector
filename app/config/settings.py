import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_API_BASE = "https://api.github.com"

# GitHub OAuth App credentials (loaded from .env or environment variables)
GITHUB_CLIENT_ID = os.environ.get("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.environ.get("GITHUB_CLIENT_SECRET", "")
