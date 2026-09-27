import React, { useState, useEffect } from 'react';
import { Workflow, Activity, Send, RefreshCw, CheckCircle2, AlertTriangle, Database, Zap, Lock, Shield, ArrowRight, ExternalLink } from 'lucide-react';
import { N8nWebhookLog } from '../types/jarvis';

interface N8nAutomationHubProps {
  webhookUrl: string;
  onUpdateWebhookUrl: (url: string) => void;
  logs: N8nWebhookLog[];
  onTriggerWebhook: (action: string, query?: string, payload?: any) => Promise<any>;
}

export const N8nAutomationHub: React.FC<N8nAutomationHubProps> = ({
  webhookUrl,
  onUpdateWebhookUrl,
  logs,
  onTriggerWebhook,
}) => {
  const [customQuery, setCustomQuery] = useState('');
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{
    online: boolean;
    latencyMs?: number;
    status?: number;
    error?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const checkPing = async () => {
    setIsPinging(true);
    try {
      const res = await fetch(`/api/jarvis/n8n/ping?url=${encodeURIComponent(webhookUrl)}`);
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setPingResult({ online: false, error: err.message });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    checkPing();
  }, [webhookUrl]);

  const handleSendQuery = async (action: string, queryText: string, extraPayload?: any) => {
    if (!queryText.trim() && action === 'query_personal_data') return;
    setIsSubmitting(true);
    try {
      await onTriggerWebhook(action, queryText, extraPayload);
      if (action === 'query_personal_data') {
        setCustomQuery('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const PRESETS = [
    {
      title: 'Fetch Personal Agenda & Data',
      action: 'get_personal_data',
      query: 'Retrieve calendar, reminders, and unread personal updates',
      desc: 'Calls n8n to sync current schedule and priority items',
      icon: Database,
    },
    {
      title: 'Sync Latest Real-Time Info',
      action: 'get_latest_info',
      query: 'Latest tech news, market indices, and weather briefing',
      desc: 'Retrieves external live intelligence feed into JARVIS',
      icon: Zap,
    },
    {
      title: 'Smart Workspace Telemetry',
      action: 'workspace_sync',
      query: 'Report IoT environment sensor telemetry and device status',
      desc: 'Communicates with local n8n automation triggers',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-5 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Workflow className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-cyan-300 tracking-wider">
                  N8N WORKFLOW & PERSONAL DATA PIPELINE
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  MODE A
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Connected to ElevenLabs Agent (<code>agent_4601m3fc7rbsedsr24vs0e5vpfzt</code>) for dynamic tools and real-time execution.
              </p>
            </div>
          </div>

          {/* Webhook Status Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
              {pingResult?.online ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400">TUNNEL STATUS</div>
                <div className={`text-xs font-bold ${pingResult?.online ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pingResult?.online ? 'TUNNEL ONLINE' : 'CHECKING / STANDBY'}
                  {pingResult?.latencyMs ? ` (${pingResult.latencyMs}ms)` : ''}
                </div>
              </div>
            </div>

            <button
              onClick={checkPing}
              disabled={isPinging}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Ping n8n webhook"
            >
              <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Webhook URL Input Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span className="text-xs font-mono text-slate-400 whitespace-nowrap">WEBHOOK ENDPOINT:</span>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => onUpdateWebhookUrl(e.target.value)}
            placeholder="https://plasma-simply-relish.ngrok-free.dev"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
          />
          <a
            href={webhookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-colors text-xs font-mono flex items-center justify-center gap-1.5"
          >
            <span>Open Tunnel</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Action Dispatchers */}
      <div>
        <h3 className="text-xs font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          DIRECT ACTION & DATA DISPATCHERS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.action}
                className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleSendQuery(preset.action, preset.query)}
                  disabled={isSubmitting}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                >
                  <span>Dispatch Query</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Query Console */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-mono tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          MANAGE PERSONAL DATA / SEND AD-HOC WEBHOOK QUERY
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Type any personal query or instruction. J.A.R.V.I.S. will transmit it to your n8n webhook and update the live feed.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery('query_personal_data', customQuery);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="e.g. Add meeting with Stark R&D at 3 PM, or Fetch my task queue..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={isSubmitting || !customQuery.trim()}
            className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-mono text-xs font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to n8n</span>
          </button>
        </form>
      </div>

      {/* Webhook Activity Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h3 className="text-xs font-mono tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            REAL-TIME PIPELINE LOGS & WEBHOOK RESPONSES ({logs.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-500">LIVE STARK PROTOCOL STREAM</span>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            No pipeline events recorded yet. Say a command or click "Dispatch Query" above to trigger your n8n workflow.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                    <span className="text-cyan-300 font-semibold">{log.action}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>

                {log.payload && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/80 overflow-x-auto">
                    <div className="text-[10px] text-slate-500 mb-0.5">Payload Sent:</div>
                    <pre className="text-[10px] text-slate-300">{JSON.stringify(log.payload, null, 2)}</pre>
                  </div>
                )}

                {log.response && (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded border border-emerald-500/30 overflow-x-auto">
                    <div className="text-[10px] text-emerald-500 mb-0.5">n8n Response:</div>
                    <pre className="text-[10px] text-emerald-200">
                      {typeof log.response === 'string' ? log.response : JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
