"use client";

import React, { useCallback, useEffect, useState } from 'react';
import {
    ArrowRight,
    Bot,
    ChevronRight,
    CloudRain,
    Droplets,
    FileText,
    LineChart,
    Loader2,
    RefreshCw,
    Sprout,
    Wifi,
    WifiOff,
    X,
} from 'lucide-react';
import AgentCard from './AgentCard';

interface TransactionEntry {
    agent: string;
    action: string;
    reasoning: string;
    timestamp: string;
}

interface AgentResults {
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
    transaction_log: TransactionEntry[];
    raw_analysis?: string;
}

interface SoilData {
    moisture: number;
    surfaceTemp: number;
    depthTemp: number;
    timestamp: number;
    agentResults: AgentResults | null;
    agentError: string | null;
}

const EMPTY_VALUE = 'N/A';

function formatTemperature(value: number | null | undefined): string {
    return typeof value === 'number' ? `${value} deg C` : EMPTY_VALUE;
}

function previewValue(value: string | undefined, maxLength: number): string {
    if (!value) {
        return EMPTY_VALUE;
    }

    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleTimeString();
}

async function getErrorMessage(response: Response): Promise<string> {
    try {
        const errorData = (await response.json()) as { error?: string };
        return errorData.error || `API error: ${response.status}`;
    } catch {
        return `API error: ${response.status}`;
    }
}

export default function Dashboard() {
    const [isOffline, setIsOffline] = useState(false);
    const [soilData, setSoilData] = useState<SoilData | null>(null);
    const [soilLoading, setSoilLoading] = useState(true);
    const [soilError, setSoilError] = useState<string | null>(null);
    const [showTransactions, setShowTransactions] = useState(false);
    const [agentRunning, setAgentRunning] = useState(false);

    const fetchSoilData = useCallback(async () => {
        try {
            setSoilLoading(true);
            setSoilError(null);
            setAgentRunning(true);

            const response = await fetch('/api/soil');
            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            const data = (await response.json()) as SoilData;
            setSoilData(data);
        } catch (err) {
            console.error('Failed to fetch soil data:', err);
            setSoilData(null);
            setSoilError(err instanceof Error ? err.message : 'Failed to fetch soil data');
        } finally {
            setSoilLoading(false);
            setAgentRunning(false);
        }
    }, []);

    useEffect(() => {
        fetchSoilData();
    }, [fetchSoilData]);

    const agentResults = soilData?.agentResults ?? null;
    const transactionLog = agentResults?.transaction_log ?? [];

    const sensorStatus = isOffline
        ? 'degraded' as const
        : soilLoading
            ? 'processing' as const
            : soilError
                ? 'degraded' as const
                : 'active' as const;

    const agentStatus = (hasData: boolean) =>
        isOffline
            ? 'degraded' as const
            : agentRunning
                ? 'processing' as const
                : hasData
                    ? 'active' as const
                    : 'degraded' as const;

    const sensorLogs = soilError
        ? [`[ERROR] ${soilError}`, `[INFO] Retrying...`]
        : soilData
            ? [
                `[LIVE] Soil moisture: ${soilData.moisture}%`,
                `[LIVE] Surface temp: ${formatTemperature(soilData.surfaceTemp)}`,
                `[LIVE] Depth temp (10cm): ${formatTemperature(soilData.depthTemp)}`,
                `[INFO] Mock humidity appended: 65.2%`,
                `[INFO] Mock pest scan appended: Aphid LOW`,
            ]
            : [`[INFO] Fetching sensor data...`];

    const predictionLogs = agentResults
        ? [
            `[OK] Weather: ${previewValue(agentResults.weather_forecast, 60)}`,
            `[OK] Irrigation: ${previewValue(agentResults.irrigation_needed, 60)}`,
            `[OK] Pest risk: ${previewValue(agentResults.pest_risk, 60)}`,
            `[OK] Medicine: ${previewValue(agentResults.medicine_needed, 60)}`,
        ]
        : agentRunning
            ? [`[INFO] Running prediction analysis...`, `[INFO] Analyzing sensor data with LLM...`]
            : soilData?.agentError
                ? [`[ERROR] ${soilData.agentError}`]
                : [`[INFO] Waiting for data...`];

    const resourceLogs = agentResults
        ? [
            `[OK] Irrigation: ${previewValue(agentResults.irrigation_schedule, 60)}`,
            `[OK] Fertilizer: ${previewValue(agentResults.fertilizer_plan, 60)}`,
            `[OK] Equipment: ${previewValue(agentResults.equipment_sharing, 60)}`,
        ]
        : agentRunning
            ? [`[INFO] Negotiating with 15 regional farms...`]
            : [`[INFO] Waiting for prediction data...`];

    const marketLogs = agentResults
        ? [
            `[OK] Prices: ${previewValue(agentResults.market_prices, 60)}`,
            `[OK] Action: ${previewValue(agentResults.selling_recommendation, 60)}`,
            `[OK] Buyers: ${previewValue(agentResults.buyer_connections, 60)}`,
        ]
        : agentRunning
            ? [`[INFO] Analyzing market trends...`]
            : [`[INFO] Waiting for resource data...`];

    return (
        <div className="min-h-screen p-6 flex flex-col gap-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 glass-panel rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-agri-neon/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/2" />

                <div className="flex items-center gap-4">
                    <div className="p-4 bg-agri-green/20 rounded-xl border border-agri-green/30">
                        <Sprout size={32} className="text-agri-neon" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-glow">AgriMind Swarm</h1>
                        <p className="text-sm text-foreground/70">Collaborative Farm Intelligence Network</p>
                    </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <button
                        onClick={() => setShowTransactions(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30"
                    >
                        <FileText size={18} />
                        Agent Transactions
                        {transactionLog.length > 0 && (
                            <span className="bg-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                {transactionLog.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={fetchSoilData}
                        disabled={soilLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={soilLoading ? 'animate-spin' : ''} />
                        {soilLoading ? 'Running...' : 'Re-run Agents'}
                    </button>

                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Network</span>
                        <button
                            onClick={() => setIsOffline(!isOffline)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                isOffline
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                                    : 'bg-agri-green/20 text-agri-neon border border-agri-green/50 hover:bg-agri-green/30'
                            }`}
                        >
                            {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
                            {isOffline ? 'Offline' : 'Live'}
                        </button>
                    </div>
                </div>
            </header>

            {agentRunning && (
                <div className="flex items-center justify-center gap-3 glass-panel p-4 rounded-xl">
                    <Loader2 size={20} className="animate-spin text-agri-neon" />
                    <span className="text-sm text-foreground/70 font-medium">Running agent pipeline:</span>
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <span className="text-blue-400">Sensor Data</span>
                        <ArrowRight size={14} className="text-foreground/40" />
                        <span className="text-cyan-400">Prediction</span>
                        <ArrowRight size={14} className="text-foreground/40" />
                        <span className="text-emerald-400">Resource</span>
                        <ArrowRight size={14} className="text-foreground/40" />
                        <span className="text-purple-400">Market</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                <AgentCard
                    name="Sensor Agent"
                    description="Monitors environmental data and publishes to swarm"
                    icon={<Bot size={24} />}
                    status={sensorStatus}
                    logs={sensorLogs}
                    metrics={
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Moisture</span>
                                {soilLoading ? (
                                    <Loader2 size={18} className="animate-spin text-foreground/40 mt-1" />
                                ) : (
                                    <span className="text-lg font-mono">{soilData ? `${soilData.moisture}%` : EMPTY_VALUE}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Surface Temp</span>
                                {soilLoading ? (
                                    <Loader2 size={18} className="animate-spin text-foreground/40 mt-1" />
                                ) : (
                                    <span className="text-lg font-mono">{soilData ? formatTemperature(soilData.surfaceTemp) : EMPTY_VALUE}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Depth (10cm)</span>
                                {soilLoading ? (
                                    <Loader2 size={18} className="animate-spin text-foreground/40 mt-1" />
                                ) : (
                                    <span className="text-lg font-mono">{soilData ? formatTemperature(soilData.depthTemp) : EMPTY_VALUE}</span>
                                )}
                            </div>
                        </div>
                    }
                />

                <AgentCard
                    name="Prediction Agent"
                    description="Analyzes data for weather and harvest forecasts"
                    icon={<CloudRain size={24} />}
                    status={agentStatus(!!agentResults?.weather_forecast)}
                    logs={predictionLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Irrigation Need</span>
                                <span className="text-lg font-mono text-agri-neon">
                                    {agentResults?.irrigation_needed?.slice(0, 20) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Pest Risk</span>
                                <span className="text-lg font-mono">
                                    {agentResults?.pest_risk?.slice(0, 20) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                        </div>
                    }
                />

                <AgentCard
                    name="Resource Agent"
                    description="Negotiates schedules and equipment sharing"
                    icon={<Droplets size={24} />}
                    status={agentStatus(!!agentResults?.irrigation_schedule)}
                    logs={resourceLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Irrigation Plan</span>
                                <span className="text-sm font-mono">
                                    {agentResults?.irrigation_schedule?.slice(0, 30) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Equipment</span>
                                <span className="text-sm font-mono">
                                    {agentResults?.equipment_sharing?.slice(0, 30) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                        </div>
                    }
                />

                <AgentCard
                    name="Market Agent"
                    description="Tracks prices and recommends selling times"
                    icon={<LineChart size={24} />}
                    status={agentStatus(!!agentResults?.market_prices)}
                    logs={marketLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Market Prices</span>
                                <span className="text-sm font-mono text-agri-neon">
                                    {agentResults?.market_prices?.slice(0, 30) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Sell Action</span>
                                <span className="text-lg font-mono">
                                    {agentResults?.selling_recommendation?.slice(0, 20) ?? (agentRunning ? '...' : EMPTY_VALUE)}
                                </span>
                            </div>
                        </div>
                    }
                />
            </div>

            {showTransactions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl max-h-[80vh] glass-panel rounded-2xl flex flex-col overflow-hidden border border-purple-500/30">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                                    <FileText size={20} className="text-purple-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Agent Transaction Log</h2>
                                    <p className="text-xs text-foreground/50">Decisions and reasoning from the agent pipeline</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTransactions(false)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                            {transactionLog.length === 0 ? (
                                <div className="text-center text-foreground/40 py-12">
                                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">No transactions yet</p>
                                    <p className="text-sm mt-1">Run the agent pipeline to see transaction logs here.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-2 mb-2 text-xs font-mono text-foreground/50">
                                        <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Prediction</span>
                                        <ChevronRight size={14} />
                                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resource</span>
                                        <ChevronRight size={14} />
                                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Market</span>
                                    </div>

                                    {transactionLog.map((entry, index) => {
                                        const colors: Record<string, string> = {
                                            'Prediction Agent': 'border-cyan-500/30 bg-cyan-500/5',
                                            'Resource Agent': 'border-emerald-500/30 bg-emerald-500/5',
                                            'Market Agent': 'border-purple-500/30 bg-purple-500/5',
                                        };
                                        const badgeColors: Record<string, string> = {
                                            'Prediction Agent': 'bg-cyan-500/20 text-cyan-300',
                                            'Resource Agent': 'bg-emerald-500/20 text-emerald-300',
                                            'Market Agent': 'bg-purple-500/20 text-purple-300',
                                        };

                                        return (
                                            <div
                                                key={`${entry.agent}-${entry.timestamp}-${index}`}
                                                className={`rounded-xl border p-4 flex flex-col gap-2 ${colors[entry.agent] || 'border-white/10 bg-white/5'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[entry.agent] || 'bg-white/10 text-foreground/70'}`}>
                                                        {entry.agent}
                                                    </span>
                                                    <span className="text-xs text-foreground/40 font-mono">
                                                        {formatTimestamp(entry.timestamp)}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-semibold text-foreground/90">{entry.action}</div>
                                                <div className="text-xs text-foreground/60 leading-relaxed">{entry.reasoning}</div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
