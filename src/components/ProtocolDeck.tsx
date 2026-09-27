import React from 'react';
import { ShieldAlert, Rocket, Cpu, Lock, Sparkles, Orbit, Compass } from 'lucide-react';
import { StarkProtocol } from '../types/jarvis';

interface ProtocolDeckProps {
  onExecuteProtocol: (protocol: StarkProtocol) => void;
  activeProtocol: string | null;
}

export const STARK_PROTOCOLS: StarkProtocol[] = [
  {
    id: 'diagnostics',
    name: 'Diagnostic Scan',
    code: 'PROT-01',
    description: 'Full armor nanotech and vibranium core integrity check',
    prompt: 'JARVIS, run a complete diagnostic scan on all Mark systems.',
    actionKey: 'DIAGNOSTICS',
    color: 'border-cyan-500/40 text-cyan-300 hover:border-cyan-400',
  },
  {
    id: 'house_party',
    name: 'House Party Protocol',
    code: 'PROT-33',
    description: 'Summon autonomous auxiliary armor units to current coordinates',
    prompt: 'JARVIS, initiate the House Party Protocol.',
    actionKey: 'HOUSE_PARTY',
    color: 'border-amber-500/40 text-amber-300 hover:border-amber-400',
  },
  {
    id: 'lockdown',
    name: 'Workshop Lockdown',
    code: 'PROT-SEC',
    description: 'Seal blast shields, deploy perimeter sentries, lock entrances',
    prompt: 'JARVIS, workshop security lockdown, maximum perimeter alert.',
    actionKey: 'DEFENSE_LOCKDOWN',
    color: 'border-rose-500/40 text-rose-300 hover:border-rose-400',
  },
  {
    id: 'veronica',
    name: 'Veronica Orbital Link',
    code: 'SAT-V8',
    description: 'Establish satellite telemetry link with orbital Hulkbuster cage',
    prompt: 'JARVIS, establish uplink with Veronica in low Earth orbit.',
    actionKey: 'VERONICA_ORBIT',
    color: 'border-sky-500/40 text-sky-300 hover:border-sky-400',
  },
  {
    id: 'flight',
    name: 'Flight Stabilization',
    code: 'AERO-4',
    description: 'Calibrate boot thrusters, supersonic vectoring and altimeter',
    prompt: 'JARVIS, calibrate flight stabilizers for high-altitude supersonic test.',
    actionKey: 'FLIGHT_TELEMETRY',
    color: 'border-indigo-500/40 text-indigo-300 hover:border-indigo-400',
  },
  {
    id: 'clean_slate',
    name: 'Clean Slate Protocol',
    code: 'RESET-0',
    description: 'Disengage offensive systems and reset telemetry logs',
    prompt: 'JARVIS, execute Clean Slate protocol standby.',
    actionKey: 'CLEAN_SLATE',
    color: 'border-slate-500/40 text-slate-300 hover:border-slate-300',
  },
];

export const ProtocolDeck: React.FC<ProtocolDeckProps> = ({
  onExecuteProtocol,
  activeProtocol,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-cyan-400 font-mono">
            STARK INDUSTRIES PROTOCOLS
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-configured executive command directives for J.A.R.V.I.S.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">DIRECT ENCRYPTION 256-BIT</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STARK_PROTOCOLS.map((protocol) => {
          const isActive = activeProtocol === protocol.actionKey;
          return (
            <button
              key={protocol.id}
              onClick={() => onExecuteProtocol(protocol)}
              className={`p-3 rounded-lg border text-left transition-all duration-200 bg-slate-950/70 hover:bg-slate-900/80 flex flex-col justify-between group ${
                isActive
                  ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-cyan-950/30'
                  : protocol.color
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-mono font-bold tracking-wider opacity-80 group-hover:opacity-100">
                  {protocol.code}
                </span>
                {protocol.id === 'house_party' && <Sparkles className="w-3.5 h-3.5 opacity-60" />}
                {protocol.id === 'lockdown' && <ShieldAlert className="w-3.5 h-3.5 opacity-60" />}
                {protocol.id === 'veronica' && <Orbit className="w-3.5 h-3.5 opacity-60" />}
                {protocol.id === 'diagnostics' && <Cpu className="w-3.5 h-3.5 opacity-60" />}
                {protocol.id === 'flight' && <Compass className="w-3.5 h-3.5 opacity-60" />}
                {protocol.id === 'clean_slate' && <Rocket className="w-3.5 h-3.5 opacity-60" />}
              </div>

              <div className="mt-2">
                <div className="text-xs font-semibold font-mono text-slate-200 group-hover:text-white">
                  {protocol.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {protocol.description}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>ENGAGE</span>
                <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                  EXECUTE →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
