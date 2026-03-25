"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sprout, CloudRain, Droplets, LineChart, Wifi, WifiOff, RefreshCw, Loader2, FileText, X, ChevronRight, ArrowRight } from 'lucide-react';
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

export default function Dashboard() {
    const [isOffline, setIsOffline] = useState(false);
    const [soilData, setSoilData] = useState<SoilData | null>(null);
    const [soilLoading, setSoilLoading] = useState(true);
    const [soilError, setSoilError] = useState<string | null>(null);
    const [showTransactions, setShowTransactions] = useState(false);
    const [agentRunning, setAgentRunning] = useState(false);

    // Fetch real soil data + agent results from our API
    const fetchSoilData = useCallback(async () => {
        try {
            setSoilLoading(true);
            setSoilError(null);
            setAgentRunning(true);
            const res = await fetch('/api/soil');
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `API error: ${res.status}`);
            }
            const data = await res.json();
            setSoilData(data);
        } catch (err) {
            console.error('Failed to fetch soil data:', err);
            setSoilError(err instanceof Error ? err.message : 'Failed to fetch soil data');
        } finally {
            setSoilLoading(false);
            setAgentRunning(false);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchSoilData();
    }, [fetchSoilData]);

    const agentResults = soilData?.agentResults ?? null;
    const transactionLog = agentResults?.transaction_log ?? [];

    // Determine statuses
    const sensorStatus = isOffline
        ? 'degraded' as const
        : soilLoading
            ? 'processing' as const
            : soilError
                ? 'degraded' as const
                : 'active' as const;

    const agentStatus = (hasData: boolean) =>
        isOffline ? 'degraded' as const
            : agentRunning ? 'processing' as const
                : hasData ? 'active' as const
                    : 'degraded' as const;

    // Build sensor logs
    const sensorLogs = soilError
        ? [`[ERROR] ${soilError}`, `[INFO] Retrying...`]
        : soilData
            ? [
                `[LIVE] Soil moisture: ${soilData.moisture}%`,
                `[LIVE] Surface temp: ${soilData.surfaceTemp}°C`,
                `[LIVE] Depth temp (10cm): ${soilData.depthTemp}°C`,
                `[INFO] Mock humidity appended: 65.2%`,
                `[INFO] Mock pest scan appended: Aphid LOW`,
            ]
            : [`[INFO] Fetching sensor data...`];

    // Build agent-specific logs
    const predictionLogs = agentResults
        ? [
            `[✓] Weather: ${agentResults.weather_forecast?.slice(0, 60)}...`,
            `[✓] Irrigation: ${agentResults.irrigation_needed}`,
            `[✓] Pest risk: ${agentResults.pest_risk}`,
            `[✓] Medicine: ${agentResults.medicine_needed}`,
        ]
        : agentRunning
            ? [`[INFO] Running prediction analysis...`, `[INFO] Analyzing sensor data with LLM...`]
            : soilData?.agentError
                ? [`[ERROR] ${soilData.agentError}`]
                : [`[INFO] Waiting for data...`];

    const resourceLogs = agentResults
        ? [
            `[✓] Irrigation: ${agentResults.irrigation_schedule?.slice(0, 60)}...`,
            `[✓] Fertilizer: ${agentResults.fertilizer_plan?.slice(0, 60)}...`,
            `[✓] Equipment: ${agentResults.equipment_sharing?.slice(0, 60)}...`,
        ]
        : agentRunning
            ? [`[INFO] Negotiating with 15 regional farms...`]
            : [`[INFO] Waiting for prediction data...`];

    const marketLogs = agentResults
        ? [
            `[✓] Prices: ${agentResults.market_prices?.slice(0, 60)}...`,
            `[✓] Action: ${agentResults.selling_recommendation}`,
            `[✓] Buyers: ${agentResults.buyer_connections?.slice(0, 60)}...`,
        ]
        : agentRunning
            ? [`[INFO] Analyzing market trends...`]
            : [`[INFO] Waiting for resource data...`];

    return (
        <div className="min-h-screen p-6 flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header */}
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
                    {/* Transaction Log Button */}
                    <button
                        onClick={() => setShowTransactions(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30"
                    >
                        <FileText size={18} />
                        Agent Transactions
                        {transactionLog.length > 0 && (
                            <span className="bg-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded-full text-xs font-bold">{transactionLog.length}</span>
                        )}
                    </button>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchSoilData}
                        disabled={soilLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30 disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={soilLoading ? 'animate-spin' : ''} />
                        {soilLoading ? 'Running...' : 'Re-run Agents'}
                    </button>

                    {/* Network Status */}
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-1">Network</span>
                        <button
                            onClick={() => setIsOffline(!isOffline)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isOffline ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                                : 'bg-agri-green/20 text-agri-neon border border-agri-green/50 hover:bg-agri-green/30'
                                }`}
                        >
                            {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
                            {isOffline ? 'Offline' : 'Live'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Agent Flow Indicator */}
            {agentRunning && (
                <div className="flex items-center justify-center gap-3 glass-panel p-4 rounded-xl">
                    <Loader2 size={20} className="animate-spin text-agri-neon" />
                    <span className="text-sm text-foreground/70 font-medium">
                        Running agent pipeline:
                    </span>
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

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

                {/* Sensor Agent Card */}
                <AgentCard
                    name="Sensor Agent"
                    description="Monitors environmental data & publishes to swarm"
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
                                    <span className="text-lg font-mono">{soilData ? `${soilData.moisture}%` : '—'}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Surface Temp</span>
                                {soilLoading ? (
                                    <Loader2 size={18} className="animate-spin text-foreground/40 mt-1" />
                                ) : (
                                    <span className="text-lg font-mono">{soilData ? `${soilData.surfaceTemp}°C` : '—'}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Depth (10cm)</span>
                                {soilLoading ? (
                                    <Loader2 size={18} className="animate-spin text-foreground/40 mt-1" />
                                ) : (
                                    <span className="text-lg font-mono">{soilData ? `${soilData.depthTemp}°C` : '—'}</span>
                                )}
                            </div>
                        </div>
                    }
                />

                {/* Prediction Agent Card */}
                <AgentCard
                    name="Prediction Agent"
                    description="Analyzes data for weather & harvest forecasts"
                    icon={<CloudRain size={24} />}
                    status={agentStatus(!!agentResults?.weather_forecast)}
                    logs={predictionLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Irrigation Need</span>
                                <span className="text-lg font-mono text-agri-neon">
                                    {agentResults?.irrigation_needed?.slice(0, 20) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Pest Risk</span>
                                <span className="text-lg font-mono">
                                    {agentResults?.pest_risk?.slice(0, 20) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                        </div>
                    }
                />

                {/* Resource Agent Card */}
                <AgentCard
                    name="Resource Agent"
                    description="Negotiates schedules & equipment sharing"
                    icon={<Droplets size={24} />}
                    status={agentStatus(!!agentResults?.irrigation_schedule)}
                    logs={resourceLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Irrigation Plan</span>
                                <span className="text-sm font-mono">
                                    {agentResults?.irrigation_schedule?.slice(0, 30) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Equipment</span>
                                <span className="text-sm font-mono">
                                    {agentResults?.equipment_sharing?.slice(0, 30) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                        </div>
                    }
                />

                {/* Market Agent Card */}
                <AgentCard
                    name="Market Agent"
                    description="Tracks prices & recommends selling times"
                    icon={<LineChart size={24} />}
                    status={agentStatus(!!agentResults?.market_prices)}
                    logs={marketLogs}
                    metrics={
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Market Prices</span>
                                <span className="text-sm font-mono text-agri-neon">
                                    {agentResults?.market_prices?.slice(0, 30) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-foreground/50">Sell Action</span>
                                <span className="text-lg font-mono">
                                    {agentResults?.selling_recommendation?.slice(0, 20) ?? (agentRunning ? '...' : '—')}
                                </span>
                            </div>
                        </div>
                    }
                />

            </div>

            {/* ─── Transaction Log Modal ────────────────────────────────── */}
            {showTransactions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl max-h-[80vh] glass-panel rounded-2xl flex flex-col overflow-hidden border border-purple-500/30">
                        {/* Modal Header */}
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

                        {/* Transaction Entries */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                            {transactionLog.length === 0 ? (
                                <div className="text-center text-foreground/40 py-12">
                                    <FileText size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg">No transactions yet</p>
                                    <p className="text-sm mt-1">Run the agent pipeline to see transaction logs here.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Flow visualization */}
                                    <div className="flex items-center justify-center gap-2 mb-2 text-xs font-mono text-foreground/50">
                                        <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Prediction</span>
                                        <ChevronRight size={14} />
                                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resource</span>
                                        <ChevronRight size={14} />
                                        <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Market</span>
                                    </div>

                                    {transactionLog.map((entry, i) => {
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
                                                key={i}
                                                className={`rounded-xl border p-4 flex flex-col gap-2 ${colors[entry.agent] || 'border-white/10 bg-white/5'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[entry.agent] || 'bg-white/10 text-foreground/70'}`}>
                                                        {entry.agent}
                                                    </span>
                                                    <span className="text-xs text-foreground/40 font-mono">
                                                        {new Date(entry.timestamp).toLocaleTimeString()}
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
