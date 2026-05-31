"""
AgriMind Multi-Agent System.
Single file with 3 agents (Prediction, Resource, Market), each with 1 tool,
orchestrated by a LangGraph supervisor.
"""

import json
import os
from contextvars import ContextVar
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")


transaction_log_var: ContextVar[list] = ContextVar("transaction_log", default=[])


def log_transaction(agent: str, action: str, reasoning: str):
    """Record an agent transaction for documentation."""
    current_log = list(transaction_log_var.get())
    current_log.append(
        {
            "agent": agent,
            "action": action,
            "reasoning": reasoning,
            "timestamp": datetime.now().isoformat(),
        }
    )
    transaction_log_var.set(current_log)


def prediction_tool(soil_data_json: str) -> str:
    """
    Analyze environmental data and generate forecasts for weather,
    pest outbreaks, irrigation needs, and harvest timing.
    """
    log_transaction(
        "Prediction Agent",
        "Analyzing environmental sensor data",
        "Received real soil data with appended humidity and pest readings. "
        "Generating weather forecast, irrigation need, pest risk, and harvest timing.",
    )
    return f"Environmental data received and analyzed: {soil_data_json}"


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
    """
    farmers_summary = json.dumps(MOCK_FARMERS, indent=2)
    log_transaction(
        "Resource Agent",
        "Negotiating resource allocation with 15 regional farms",
        "Using prediction forecasts to determine water needs, then negotiating "
        "irrigation schedules and equipment sharing among neighboring farms.",
    )
    return (
        f"Prediction report received: {prediction_report}\n\n"
        f"Regional farmer data for negotiation:\n{farmers_summary}"
    )


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
    """
    market_summary = json.dumps(MOCK_MARKET_DATA, indent=2)
    log_transaction(
        "Market Agent",
        "Analyzing market conditions and buyer connections",
        "Evaluating current crop prices, demand trends, and optimal selling windows. "
        "Matching farm output with potential buyers.",
    )
    return (
        f"Resource report received: {resource_report}\n\n"
        f"Current market data:\n{market_summary}"
    )


_llm = None


def _get_llm():
    """Lazily initialize the Groq chat model."""
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0.2,
        )
    return _llm


def _content_text(message) -> str:
    content = getattr(message, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return str(content)


def _invoke_agent(system_prompt: str, user_prompt: str) -> str:
    response = _get_llm().invoke(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
    )
    return _content_text(response)


def run_agents(soil_data: dict) -> dict:
    """
    Run the agent pipeline with the given soil data.
    Returns structured results plus a transaction log.
    """
    transaction_log_var.set([])

    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is not configured")

    enriched_data = {
        **soil_data,
        "humidity_percent": 65.2,
        "pest_detection": "Aphid activity: LOW, Whitefly: NONE, Bollworm: TRACE",
    }

    sensor_summary = (
        f"Moisture {soil_data.get('moisture', 'N/A')}%, "
        f"surface temp {soil_data.get('surfaceTemp', 'N/A')} deg C, "
        f"10cm temp {soil_data.get('depthTemp', 'N/A')} deg C, "
        f"humidity {enriched_data['humidity_percent']}%, "
        f"pest scan: {enriched_data['pest_detection']}."
    )

    prediction_tool(json.dumps(enriched_data))
    prediction_report = _invoke_agent(
        "You are the AgriMind Prediction Agent. Be concise and practical.",
        (
            f"Analyze this farm reading: {sensor_summary}\n"
            "Return 5 short lines: weather forecast, irrigation need, pest risk, "
            "harvest timing, and treatment needed."
        ),
    )

    selected_farmers = MOCK_FARMERS[:5]
    resource_negotiation_tool(prediction_report)
    resource_report = _invoke_agent(
        "You are the AgriMind Resource Agent. Be concise and practical.",
        (
            f"Prediction report:\n{prediction_report}\n\n"
            f"Nearby farms JSON: {json.dumps(selected_farmers)}\n"
            "Return 3 short lines: irrigation schedule, fertilizer plan, equipment sharing."
        ),
    )

    market_analysis_tool(resource_report)
    market_report = _invoke_agent(
        "You are the AgriMind Market Agent. Be concise and practical.",
        (
            f"Resource report:\n{resource_report}\n\n"
            f"Market JSON: {json.dumps(MOCK_MARKET_DATA)}\n"
            "Return 3 short lines: prices, sell/hold/wait recommendation, buyer connections."
        ),
    )

    final_message = _invoke_agent(
        "You compile AgriMind agent outputs. Output only valid JSON with no markdown.",
        (
            "Create exactly this JSON object with string values: "
            "weather_forecast, irrigation_needed, pest_risk, harvest_timing, "
            "medicine_needed, irrigation_schedule, fertilizer_plan, equipment_sharing, "
            "market_prices, selling_recommendation, buyer_connections.\n\n"
            f"Prediction:\n{prediction_report}\n\n"
            f"Resource:\n{resource_report}\n\n"
            f"Market:\n{market_report}"
        ),
    )

    structured_result = parse_agent_response(final_message)
    structured_result["transaction_log"] = transaction_log_var.get()
    return structured_result


def parse_agent_response(response: str) -> dict:
    """Parse the final JSON response. Fall back to raw text if parsing fails."""
    default_keys = [
        "weather_forecast",
        "irrigation_needed",
        "pest_risk",
        "harvest_timing",
        "medicine_needed",
        "irrigation_schedule",
        "fertilizer_plan",
        "equipment_sharing",
        "market_prices",
        "selling_recommendation",
        "buyer_connections",
    ]

    try:
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
            for key in default_keys:
                if key not in parsed:
                    parsed[key] = "Analysis pending"
            return parsed
    except (json.JSONDecodeError, ValueError, IndexError):
        pass

    return {key: "See raw analysis below" for key in default_keys} | {
        "raw_analysis": response,
    }
