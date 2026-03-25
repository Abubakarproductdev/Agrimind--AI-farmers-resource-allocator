import React from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AgentCardProps {
    name: string;
    icon: React.ReactNode;
    status: 'active' | 'processing' | 'degraded';
    description: string;
    metrics: React.ReactNode;
    logs: string[];
}

export default function AgentCard({ name, icon, status, description, metrics, logs }: AgentCardProps) {
    const statusColors = {
        active: 'text-agri-neon border-agri-neon/50 bg-agri-neon/10',
        processing: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
        degraded: 'text-amber-400 border-amber-400/50 bg-amber-400/10'
    };

    const StatusIcon = {
        active: CheckCircle2,
        processing: Activity,
        degraded: AlertCircle
    }[status];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 flex flex-col gap-4 overflow-hidden relative"
        >
            {/* Decorative gradient orb */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${status === 'active' ? 'bg-agri-neon' : status === 'processing' ? 'bg-blue-400' : 'bg-amber-400'
                }`} />

            <div className="flex items-start justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg flex items-center justify-center ${statusColors[status]}`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">{name}</h3>
                        <p className="text-sm text-foreground/60">{description}</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
                    <StatusIcon size={14} className={status === 'processing' ? 'animate-pulse' : ''} />
                    <span className="capitalize">{status}</span>
                </div>
            </div>

            <div className="mt-2 z-10 w-full bg-black/20 rounded-lg p-4 border border-white/5">
                {metrics}
            </div>

            <div className="mt-auto z-10 flex flex-col gap-2 pt-4">
                <h4 className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Recent Activity</h4>
                <div className="bg-black/40 rounded border border-white/5 p-3 h-28 overflow-y-auto font-mono text-xs flex flex-col gap-1.5">
                    {logs.slice(-4).map((log, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                            className="text-foreground/70 flex gap-2"
                        >
                            <span className="text-agri-neon/70">{'>'}</span> {log}
                        </motion.div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-foreground/30 italic">No recent activity...</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
