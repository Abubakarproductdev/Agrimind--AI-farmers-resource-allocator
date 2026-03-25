"""
AgriMind Multi-Agent Backend
FastAPI application that receives soil data from the Next.js frontend
and runs it through the LangGraph multi-agent network.
"""
print("Hello from Python!")

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


# --- Pydantic Models ---

class SoilInput(BaseModel):
    moisture: float
    surfaceTemp: float
    depthTemp: float
    timestamp: int


# --- App Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    print("\n🌾 AgriMind Multi-Agent Backend Starting...")
    print(f"   LLM Model: llama-3.3-70b-versatile (via Groq)")

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("   ⚠️  WARNING: GROQ_API_KEY not found in .env — agents will fail!")
    else:
        print(f"   ✅ GROQ_API_KEY loaded ({groq_key[:8]}...)")

    print("   🤖 Agents: Prediction | Resource | Market")
    print("   🔗 Supervisor: Sequential flow (Prediction → Resource → Market)")
    print()
    yield
    print("\n🛑 AgriMind Backend shutting down.")


# --- FastAPI App ---

app = FastAPI(
    title="AgriMind Multi-Agent Backend",
    description="LangGraph multi-agent network for agricultural intelligence",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "AgriMind Multi-Agent Backend",
        "status": "running",
        "agents": ["Prediction", "Resource", "Market"],
        "llm": "llama-3.3-70b-versatile (Groq)",
    }


@app.post("/run-agents")
async def run_agents_endpoint(data: SoilInput):
    """
    Receive soil data from the frontend and run the multi-agent network.

    Flow:
    1. Pack soil data into a dict
    2. Run the LangGraph supervisor (Prediction → Resource → Market)
    3. Return structured analysis + transaction log
    """
    print(f"\n📡 Received soil data from frontend:")
    print(f"   Moisture: {data.moisture}%")
    print(f"   Surface Temp: {data.surfaceTemp}°C")
    print(f"   Depth Temp: {data.depthTemp}°C")
    print(f"   Timestamp: {data.timestamp}")

    soil_dict = {
        "moisture": data.moisture,
        "surfaceTemp": data.surfaceTemp,
        "depthTemp": data.depthTemp,
        "timestamp": data.timestamp,
    }

    try:
        # Import here to avoid circular / startup issues
        from agents import run_agents

        # Run the multi-agent network
        result = run_agents(soil_dict)

        return {
            "status": "success",
            "soil_data_received": soil_dict,
            "agent_results": result,
        }

    except Exception as e:
        print(f"\n❌ Agent network error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "soil_data_received": soil_dict,
            "agent_results": None,
            "error": str(e),
        }
        
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)