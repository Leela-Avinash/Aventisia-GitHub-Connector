import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, repos, issues, commits, pulls

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

# ── App ──────────────────────────────────────────────────────────
app = FastAPI(
    title="GitHub Cloud Connector",
    description="A REST API connector to interact with the GitHub API.",
    version="1.0.0",
)

# Allow CORS for frontend integration later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(repos.router)
app.include_router(issues.router)
app.include_router(commits.router)
app.include_router(pulls.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "GitHub Cloud Connector is running."}
