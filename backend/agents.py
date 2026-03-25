"""
AgriMind Multi-Agent System
Single file with 3 agents (Prediction, Resource, Market), each with 1 tool,
orchestrated by a LangGraph Supervisor.
"""

import os
import json
from datetime import datetime
from dotenv import load_dotenv

# Load .env from the backend directory (or parent)
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

# ─── Transaction Log ─────────────────────────────────────────────────────────

transaction_log = []

def log_transaction(agent: str, action: str, reasoning: str):
    """Record an agent transaction for documentation."""
    transaction_log.append({
        "agent": agent,
        "action": action,
        "reasoning": reasoning,
        "timestamp": datetime.now().isoformat(),
    })

# ─── TOOL 1: Prediction Tool ─────────────────────────────────────────────────

def prediction_tool(soil_data_json: str) -> str:
    """
    Analyze environmental data and generate forecasts for weather,
    pest outbreaks, irrigation needs, and harvest timing.
    Input: JSON string with soil moisture, temperature, humidity, and pest data.
    """
    log_transaction(
        "Prediction Agent",
        "Analyzing environmental sensor data",
        "Received real soil data with appended humidity and pest readings. "
        "Generating weather forecast, irrigation need, pest risk, and harvest timing."
    )
    return f"Environmental data received and analyzed: {soil_data_json}"

# ─── TOOL 2: Resource Negotiation Tool ───────────────────────────────────────

MOCK_FARMERS = [
    {"name": "Farm A - Ahmad Raza", "crop": "Wheat", "water_usage_liters": 1200, "equipment": ["Tractor", "Sprayer"], "location": "Faisalabad North"},
    {"name": "Farm B - Bilal Khan", "crop": "Rice", "water_usage_liters": 2500, "equipment": ["Harvester"], "location": "Faisalabad East"},
    {"name": "Farm C - Chaudhry Farms", "crop": "Cotton", "water_usage_liters": 800, "equipment": ["Tractor", "Seeder"], "location": "Faisalabad South"},
    {"name": "Farm D - Danish Agri", "crop": "Sugarcane", "water_usage_liters": 3000, "equipment": ["Tractor", "Plough"], "location": "Jhang Road"},
    {"name": "Farm E - Ejaz Holdings", "crop": "Maize", "water_usage_liters": 900, "equipment": ["Sprayer", "Cultivator"], "location": "Chiniot"},
    {"name": "Farm F - Farooq Estate", "crop": "Wheat", "water_usage_liters": 1100, "equipment": ["Tractor"], "location": "Sargodha"},
    {"name": "Farm G - Ghulam & Sons", "crop": "Rice", "water_usage_liters": 2200, "equipment": ["Harvester", "Tractor"], "location": "Faisalabad West"},
    {"name": "Farm H - Hassan Farms", "crop": "Cotton", "water_usage_liters": 750, "equipment": ["Seeder"], "location": "Toba Tek Singh"},
    {"name": "Farm I - Iqbal Agro", "crop": "Sugarcane", "water_usage_liters": 2800, "equipment": ["Tractor", "Harvester", "Sprayer"], "location": "Gojra"},
    {"name": "Farm J - Javed Traders", "crop": "Maize", "water_usage_liters": 950, "equipment": ["Cultivator"], "location": "Samundri"},
    {"name": "Farm K - Kamran Agri", "crop": "Wheat", "water_usage_liters": 1050, "equipment": ["Tractor", "Plough"], "location": "Jaranwala"},
    {"name": "Farm L - Latif Farms", "crop": "Rice", "water_usage_liters": 2400, "equipment": ["Harvester"], "location": "Hafizabad"},
    {"name": "Farm M - Malik Estate", "crop": "Vegetables", "water_usage_liters": 600, "equipment": ["Sprayer", "Seeder"], "location": "Faisalabad Central"},
    {"name": "Farm N - Nasir Holdings", "crop": "Cotton", "water_usage_liters": 850, "equipment": ["Tractor"], "location": "Sheikhupura"},
    {"name": "Farm O - Omar Agri", "crop": "Sugarcane", "water_usage_liters": 2700, "equipment": ["Harvester", "Plough"], "location": "Sahiwal"},
]


def resource_negotiation_tool(prediction_report: str) -> str:
    """
    Negotiate irrigation schedules, fertilizer distribution, and equipment sharing
    between farms based on the prediction report and regional farmer data.
    Input: The prediction/forecast report as a string.
    """
    farmers_summary = json.dumps(MOCK_FARMERS, indent=2)
    log_transaction(
        "Resource Agent",
        "Negotiating resource allocation with 15 regional farms",
        "Using prediction forecasts to determine water needs, then negotiating "
        "irrigation schedules and equipment sharing among neighboring farms."
    )
    return (
        f"Prediction report received: {prediction_report}\n\n"
        f"Regional farmer data for negotiation:\n{farmers_summary}"
    )

# ─── TOOL 3: Market Analysis Tool ────────────────────────────────────────────

MOCK_MARKET_DATA = {
    "crops": {
        "Wheat": {"price_per_ton": 95000, "trend": "UP +3.2%", "demand": "HIGH", "best_sell_window": "March-April"},
        "Rice": {"price_per_ton": 120000, "trend": "STABLE +0.5%", "demand": "MODERATE", "best_sell_window": "November-December"},
        "Cotton": {"price_per_ton": 85000, "trend": "DOWN -1.8%", "demand": "LOW", "best_sell_window": "January-February"},
        "Sugarcane": {"price_per_ton": 30000, "trend": "UP +2.1%", "demand": "HIGH", "best_sell_window": "December-March"},
        "Maize": {"price_per_ton": 70000, "trend": "UP +1.5%", "demand": "MODERATE", "best_sell_window": "September-October"},
        "Vegetables": {"price_per_ton": 60000, "trend": "UP +5.0%", "demand": "VERY HIGH", "best_sell_window": "Year-round"},
    },
    "buyers": [
        {"name": "Punjab Grain Corp", "buys": ["Wheat", "Rice", "Maize"], "contact": "+92-300-1234567", "rating": "4.8/5"},
        {"name": "Faisalabad Cotton Exchange", "buys": ["Cotton"], "contact": "+92-321-9876543", "rating": "4.5/5"},
        {"name": "National Sugar Mills", "buys": ["Sugarcane"], "contact": "+92-333-4567890", "rating": "4.7/5"},
        {"name": "AgriFresh Exports", "buys": ["Vegetables", "Rice"], "contact": "+92-345-6789012", "rating": "4.9/5"},
        {"name": "Multan Commodity Market", "buys": ["Wheat", "Cotton", "Maize"], "contact": "+92-312-3456789", "rating": "4.3/5"},
    ],
}


def market_analysis_tool(resource_report: str) -> str:
    """
    Track crop prices and demand, recommend selling times, and connect farmers
    with buyers using current market data.
    Input: The resource allocation report as a string.
    """
    market_summary = json.dumps(MOCK_MARKET_DATA, indent=2)
    log_transaction(
        "Market Agent",
        "Analyzing market conditions and buyer connections",
        "Evaluating current crop prices, demand trends, and optimal selling windows. "
        "Matching farm output with potential buyers."
    )
    return (
        f"Resource report received: {resource_report}\n\n"
        f"Current market data:\n{market_summary}"
    )

# ─── Lazy Initialization ─────────────────────────────────────────────────────

_supervisor_app = None

def _get_supervisor():
    """Lazily initialize the LLM, agents, and supervisor on first use."""
    global _supervisor_app
    if _supervisor_app is not None:
        return _supervisor_app

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
    )

    prediction_agent = create_react_agent(
        model=llm,
        tools=[prediction_tool],
        name="prediction_agent",
        prompt=(
            "You are the Prediction Agent for AgriMind. Your job is to analyze environmental "
            "sensor data and generate forecasts.\n\n"
            "When you receive soil data, use your prediction_tool to analyze it. "
            "Then provide a detailed report covering:\n"
            "1. Weather Forecast (based on soil temperature trends)\n"
            "2. Irrigation Need (does the farm need watering? YES/NO with explanation)\n"
            "3. Pest Risk Level (based on humidity and temperature)\n"
            "4. Harvest Timing (is it time to harvest or wait?)\n"
            "5. Medicine/Treatment Needed (YES/NO with recommendation)\n\n"
            "Be specific and actionable in your analysis. Use the actual sensor values."
        ),
    )

    resource_agent = create_react_agent(
        model=llm,
        tools=[resource_negotiation_tool],
        name="resource_agent",
        prompt=(
            "You are the Resource Allocation Agent for AgriMind. Your job is to negotiate "
            "irrigation schedules, fertilizer distribution, and equipment sharing between farms.\n\n"
            "When you receive a prediction report, use your resource_negotiation_tool to access "
            "regional farmer data and create allocation plans.\n\n"
            "Provide a detailed report covering:\n"
            "1. Irrigation Schedule (which farms get water and when)\n"
            "2. Fertilizer Distribution Plan (based on crop needs and predictions)\n"
            "3. Equipment Sharing (who has available equipment and who needs it)\n\n"
            "Be fair and practical in your negotiations. Consider each farm's needs."
        ),
    )

    market_agent = create_react_agent(
        model=llm,
        tools=[market_analysis_tool],
        name="market_agent",
        prompt=(
            "You are the Market Intelligence Agent for AgriMind. Your job is to track crop "
            "prices, recommend selling times, and connect farmers with buyers.\n\n"
            "When you receive a resource report, use your market_analysis_tool to access "
            "current market data.\n\n"
            "Provide a detailed report covering:\n"
            "1. Current Market Prices (for relevant crops)\n"
            "2. Selling Recommendation (SELL NOW / HOLD / WAIT with reasoning)\n"
            "3. Buyer Connections (matched buyers with contact info)\n\n"
            "Be strategic and data-driven in your recommendations."
        ),
    )

    workflow = create_supervisor(
        [prediction_agent, resource_agent, market_agent],
        model=llm,
        prompt=(
            "You are the AgriMind Supervisor coordinating three specialized agents. "
            "Follow this EXACT sequence:\n\n"
            "1. FIRST: Send the soil/environmental data to prediction_agent for analysis\n"
            "2. SECOND: Send prediction results to resource_agent for resource negotiation\n"
            "3. THIRD: Send resource results to market_agent for market analysis\n\n"
            "After all agents have reported, compile a FINAL SUMMARY in this EXACT JSON format "
            "(output ONLY the JSON, no other text):\n"
            "```json\n"
            "{\n"
            '  "weather_forecast": "brief forecast",\n'
            '  "irrigation_needed": "YES/NO with brief reason",\n'
            '  "pest_risk": "LOW/MEDIUM/HIGH with brief reason",\n'
            '  "harvest_timing": "brief recommendation",\n'
            '  "medicine_needed": "YES/NO with brief reason",\n'
            '  "irrigation_schedule": "brief schedule summary",\n'
            '  "fertilizer_plan": "brief plan",\n'
            '  "equipment_sharing": "brief availability",\n'
            '  "market_prices": "brief price summary",\n'
            '  "selling_recommendation": "SELL/HOLD/WAIT with reason",\n'
            '  "buyer_connections": "matched buyers"\n'
            "}\n"
            "```\n"
        ),
    )

    _supervisor_app = workflow.compile()
    return _supervisor_app

# ─── Main Entry Point ────────────────────────────────────────────────────────

def run_agents(soil_data: dict) -> dict:
    """
    Run the multi-agent network with the given soil data.
    Returns structured results + transaction log.
    """
    global transaction_log
    transaction_log = []  # Reset log for each run

    # Append mock humidity and pest detection to real soil data
    enriched_data = {
        **soil_data,
        "humidity_percent": 65.2,
        "pest_detection": "Aphid activity: LOW, Whitefly: NONE, Bollworm: TRACE",
    }

    user_message = (
        f"New farm sensor data received. Run a complete analysis.\n\n"
        f"LIVE SOIL SENSOR DATA (from Agromonitoring API):\n"
        f"- Soil Moisture: {soil_data.get('moisture', 'N/A')}%\n"
        f"- Surface Temperature: {soil_data.get('surfaceTemp', 'N/A')}°C\n"
        f"- Depth Temperature (10cm): {soil_data.get('depthTemp', 'N/A')}°C\n"
        f"- Reading Timestamp: {soil_data.get('timestamp', 'N/A')}\n"
        f"- Humidity: {enriched_data['humidity_percent']}%\n"
        f"- Pest Detection: {enriched_data['pest_detection']}\n\n"
        f"Full data JSON: {json.dumps(enriched_data)}\n\n"
        f"Run all three agents in sequence: Prediction → Resource → Market, "
        f"then compile the final JSON summary."
    )

    # Get or create the supervisor
    supervisor = _get_supervisor()

    # Run the supervisor
    result = supervisor.invoke({
        "messages": [{"role": "user", "content": user_message}]
    })

    # Extract the final message from the supervisor
    final_message = ""
    if result and "messages" in result:
        for msg in reversed(result["messages"]):
            if hasattr(msg, "content") and msg.content:
                final_message = msg.content
                break

    # Try to parse the structured JSON from the supervisor's response
    structured_result = parse_supervisor_response(final_message)
    structured_result["transaction_log"] = transaction_log

    return structured_result


def parse_supervisor_response(response: str) -> dict:
    """Parse the supervisor's JSON response. Falls back to raw text if parsing fails."""
    default_keys = [
        "weather_forecast", "irrigation_needed", "pest_risk",
        "harvest_timing", "medicine_needed", "irrigation_schedule",
        "fertilizer_plan", "equipment_sharing", "market_prices",
        "selling_recommendation", "buyer_connections",
    ]

    # Try to find JSON in the response
    try:
        # Look for JSON block in markdown code fence
        if "```json" in response:
            json_str = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            json_str = response.split("```")[1].split("```")[0].strip()
        elif "{" in response and "}" in response:
            start = response.index("{")
            end = response.rindex("}") + 1
            json_str = response[start:end]
        else:
            json_str = ""

        if json_str:
            parsed = json.loads(json_str)
            # Ensure all expected keys exist
            for key in default_keys:
                if key not in parsed:
                    parsed[key] = "Analysis pending"
            return parsed
    except (json.JSONDecodeError, ValueError, IndexError):
        pass

    # Fallback: return raw response in a structured format
    return {key: "See raw analysis below" for key in default_keys} | {
        "raw_analysis": response,
    }
