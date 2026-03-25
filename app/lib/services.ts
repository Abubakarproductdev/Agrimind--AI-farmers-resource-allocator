
const AGRO_BASE = "http://api.agromonitoring.com/agro/1.0";

const DEFAULT_POLYGON = {
    name: "AgriMind Default Farm",
    geo_json: {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: [
                [
                    [73.0, 31.5],
                    [73.01, 31.5],
                    [73.01, 31.51],
                    [73.0, 31.51],
                    [73.0, 31.5],
                ],
            ],
        },
    },
};

let cachedPolyId: string | null = null;

async function getOrCreatePolygon(apiKey: string): Promise<string> {
    if (cachedPolyId) return cachedPolyId;

    const listRes = await fetch(`${AGRO_BASE}/polygons?appid=${apiKey}`);

    if (listRes.ok) {
        const polygons = await listRes.json();
        if (Array.isArray(polygons) && polygons.length > 0) {
            cachedPolyId = polygons[0].id;
            return cachedPolyId!;
        }
    }

    const createRes = await fetch(`${AGRO_BASE}/polygons?appid=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_POLYGON),
    });

    if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create polygon: ${errorText}`);
    }

    const created = await createRes.json();
    cachedPolyId = created.id;
    return cachedPolyId!;
}

function kelvinToCelsius(k: number): number {
    return Math.round((k - 273.15) * 10) / 10;
}

export interface AgentResults {
    weather_forecast: string;
    irrigation_needed: string;
    pest_risk: string;
    harvest_timing: string;
    medicine_needed: string;
    irrigation_schedule: string;
    fertilizer_plan: string;
    equipment_sharing: string;
    market_prices: string;
    selling_recommendation: string;
    buyer_connections: string;
    transaction_log: {
        agent: string;
        action: string;
        reasoning: string;
        timestamp: string;
    }[];
    raw_analysis?: string;
}

export interface SoilApiResponse {
    moisture: number;
    surfaceTemp: number;
    depthTemp: number;
    timestamp: number;
    agentResults: AgentResults | null;
    agentError: string | null;
}

export async function getSoilData(): Promise<SoilApiResponse> {
    const apiKey = process.env.SOIL_DATA_API;

    if (!apiKey) {
        throw new Error("SOIL_DATA_API key missing");
    }

    const polyId = await getOrCreatePolygon(apiKey);

    const soilRes = await fetch(
        `${AGRO_BASE}/soil?polyid=${polyId}&appid=${apiKey}`,
        { cache: "no-store" }
    );

    if (!soilRes.ok) {
        const errorText = await soilRes.text();
        throw new Error(`Soil API error: ${errorText}`);
    }

    const soilData = await soilRes.json();

    const formattedData = {
        moisture: Math.round(soilData.moisture * 1000) / 10,
        surfaceTemp: kelvinToCelsius(soilData.t0),
        depthTemp: kelvinToCelsius(soilData.t10),
        timestamp: soilData.dt,
    };

    // Send to Python backend and capture agent results
    let agentResults: AgentResults | null = null;
    let agentError: string | null = null;

    try {
        const agentRes = await fetch("http://localhost:8000/run-agents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData),
        });

        if (agentRes.ok) {
            const agentData = await agentRes.json();
            if (agentData.status === "success" && agentData.agent_results) {
                agentResults = agentData.agent_results;
            } else {
                agentError = agentData.error || "Agent analysis failed";
            }
        } else {
            agentError = `Agent backend returned ${agentRes.status}`;
        }
    } catch (err) {
        console.error("Failed to reach agent backend:", err);
        agentError = "Agent backend unavailable (is it running on port 8000?)";
    }

    return {
        ...formattedData,
        agentResults,
        agentError,
    };
}