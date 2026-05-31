const AGRO_BASE = process.env.AGRO_API_BASE_URL ?? "http://api.agromonitoring.com/agro/1.0";
const AGENT_BACKEND_BASE =
    process.env.AGENT_BACKEND_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_POLYGON_NAME = "AgriMind Default Farm";
const DEFAULT_AGENT_ERROR =
    "Agent analysis is temporarily unavailable. Please make sure the backend service is running.";

const DEFAULT_POLYGON = {
    name: DEFAULT_POLYGON_NAME,
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

async function fetchWithTimeout(
    input: string,
    init: RequestInit = {},
    timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
            cache: init.cache ?? "no-store",
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
    const text = await response.text();

    if (!text) {
        return null;
    }

    return JSON.parse(text) as T;
}

async function getOrCreatePolygon(apiKey: string): Promise<string> {
    if (cachedPolyId) return cachedPolyId;

    const configuredPolygonId = process.env.AGRO_POLYGON_ID?.trim();
    if (configuredPolygonId) {
        cachedPolyId = configuredPolygonId;
        return cachedPolyId;
    }

    const listRes = await fetchWithTimeout(`${AGRO_BASE}/polygons?appid=${apiKey}`);

    if (listRes.ok) {
        const polygons = await parseJsonResponse<Array<{ id?: string; name?: string }>>(listRes);
        if (Array.isArray(polygons) && polygons.length > 0) {
            const matchingPolygon =
                polygons.find((polygon) => polygon.name === DEFAULT_POLYGON_NAME && polygon.id) ??
                polygons.find((polygon) => polygon.id);

            if (matchingPolygon?.id) {
                cachedPolyId = matchingPolygon.id;
                return cachedPolyId;
            }
        }
    }

    const createRes = await fetchWithTimeout(`${AGRO_BASE}/polygons?appid=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_POLYGON),
    });

    if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create polygon: ${errorText}`);
    }

    const created = await parseJsonResponse<{ id?: string }>(createRes);
    if (!created?.id) {
        throw new Error("Polygon created without an id");
    }

    cachedPolyId = created.id;
    return cachedPolyId;
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

    const soilRes = await fetchWithTimeout(`${AGRO_BASE}/soil?polyid=${polyId}&appid=${apiKey}`);

    if (!soilRes.ok) {
        const errorText = await soilRes.text();
        throw new Error(`Soil API error: ${errorText}`);
    }

    const soilData = await parseJsonResponse<{
        moisture?: number;
        t0?: number;
        t10?: number;
        dt?: number;
    }>(soilRes);

    if (
        !soilData ||
        typeof soilData.moisture !== "number" ||
        typeof soilData.t0 !== "number" ||
        typeof soilData.t10 !== "number" ||
        typeof soilData.dt !== "number"
    ) {
        throw new Error("Soil API returned an unexpected payload");
    }

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
        const agentRes = await fetchWithTimeout(`${AGENT_BACKEND_BASE}/run-agents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData),
        });

        if (agentRes.ok) {
            const agentData = await parseJsonResponse<{
                status?: string;
                agent_results?: AgentResults;
                error?: string;
            }>(agentRes);

            if (!agentData) {
                agentError = "Agent backend returned an empty response";
            } else if (agentData.status === "success" && agentData.agent_results) {
                agentResults = agentData.agent_results;
            } else {
                agentError = agentData.error || "Agent analysis failed";
            }
        } else {
            agentError = `Agent backend returned ${agentRes.status}`;
        }
    } catch (err) {
        console.error("Failed to reach agent backend:", err);
        agentError =
            err instanceof Error && err.name === "AbortError"
                ? "Agent backend timed out before returning a result"
                : DEFAULT_AGENT_ERROR;
    }

    return {
        ...formattedData,
        agentResults,
        agentError,
    };
}
