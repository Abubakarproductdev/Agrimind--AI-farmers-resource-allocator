"""
AgriMind Multi-Agent Backend
FastAPI application that receives soil data from the Next.js frontend
and runs it through the LangGraph multi-agent network.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

logger = logging.getLogger("agrimind.backend")


class SoilInput(BaseModel):
    moisture: float
    surfaceTemp: float
    depthTemp: float
    timestamp: int


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan startup and shutdown events."""
    groq_key = os.getenv("GROQ_API_KEY")

    logger.info("AgriMind backend starting")
    if groq_key:
        logger.info("GROQ_API_KEY detected")
    else:
        logger.warning("GROQ_API_KEY is not configured; agent execution will fail")

    yield

    logger.info("AgriMind backend shutting down")


app = FastAPI(
    title="AgriMind Multi-Agent Backend",
    description="LangGraph multi-agent network for agricultural intelligence",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_run_agents():
    try:
        from .agents import run_agents
    except ImportError:
        from agents import run_agents

    return run_agents


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "AgriMind Multi-Agent Backend",
        "status": "running",
        "agents": ["Prediction", "Resource", "Market"],
        "llm": "llama-3.3-70b-versatile (Groq)",
    }


@app.get("/health")
async def health():
    """Minimal health endpoint for upstream checks."""
    return {"status": "ok"}


@app.post("/run-agents")
async def run_agents_endpoint(data: SoilInput):
    """Receive soil data from the frontend and run the multi-agent network."""
    soil_dict = {
        "moisture": data.moisture,
        "surfaceTemp": data.surfaceTemp,
        "depthTemp": data.depthTemp,
        "timestamp": data.timestamp,
    }

    logger.info("Received soil data request at timestamp=%s", data.timestamp)

    try:
        run_agents = _load_run_agents()
        result = run_agents(soil_dict)
    except Exception as exc:
        logger.exception("Agent network error")
        raise HTTPException(
            status_code=500,
            detail="Agent execution failed. Check backend logs for details.",
        ) from exc

    return {
        "status": "success",
        "soil_data_received": soil_dict,
        "agent_results": result,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
