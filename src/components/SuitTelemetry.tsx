import React from 'react';
import { Shield, Zap, Wind, Flame, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { SuitTelemetryData } from '../types/jarvis';

interface SuitTelemetryProps {
  telemetry: SuitTelemetryData;
  onUpdateMark: (mark: string) => void;
  onTriggerOvercharge: () => void;
  onCalibrateRepulsors: () => void;
}

const MARK_SUITS = ['Mark III', 'Mark VII', 'Mark XLII', 'Mark L', 'Mark LXXXV'];

export const SuitTelemetry: React.FC<SuitTelemetryProps> = ({
  telemetry,
  onUpdateMark,
  onTriggerOvercharge,
  onCalibrateRepulsors,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col gap-4 backdrop-blur-sm shadow-xl">
      {/* Header and Suit Mark Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-cyan-400 font-mono">
            ARMOR TELEMETRY & DIAGNOSTICS
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span>Stark Industries OS v8.4</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Mark Selector Buttons (Clean unboxed segmented control) */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800 rounded-lg">
          {MARK_SUITS.map((mark) => {
            const isActive = telemetry.activeMark === mark;
            return (
              <button
                key={mark}
                onClick={() => onUpdateMark(mark)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mark}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Key Telemetry Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Arc Reactor Power */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>ARC OUTPUT</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-cyan-300 tabular-nums">
              {telemetry.arcOutput.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">GW/s</span>
          </div>
          <div className="w-full bg-slate-800/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                telemetry.arcOutput > 100 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, (telemetry.arcOutput / 150) * 100)}%` }}
            />
          </div>
        </div>

        {/* Nanotech Integrity */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>NANOTECH</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
              {telemetry.nanoIntegrity.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-800/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${telemetry.nanoIntegrity}%` }}
            />
          </div>
        </div>

        {/* Repulsors */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>REPULSORS</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xs font-mono text-slate-300">
              L: <strong className="text-cyan-300">{telemetry.leftRepulsor}%</strong>
            </span>
            <span className="text-xs font-mono text-slate-300">
              R: <strong className="text-cyan-300">{telemetry.rightRepulsor}%</strong>
            </span>
          </div>
          <div className="w-full bg-slate-800/70 h-1.5 rounded-full mt-2 flex gap-1 overflow-hidden">
            <div className="bg-cyan-400 h-full" style={{ width: `${telemetry.leftRepulsor / 2}%` }} />
            <div className="bg-cyan-400 h-full" style={{ width: `${telemetry.rightRepulsor / 2}%` }} />
          </div>
        </div>

        {/* Thrusters / Flight Stabilization */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>THRUSTERS</span>
            <Wind className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-slate-100 tabular-nums">
              {telemetry.thrusterOutput.toFixed(0)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">MACH READY</span>
          </div>
          <div className="w-full bg-slate-800/70 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-400 h-full transition-all duration-300"
              style={{ width: `${telemetry.thrusterOutput}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Telemetry Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>
            CORE TEMP: <span className="text-slate-200">{telemetry.coreTemp.toFixed(1)}°C</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            SECURITY:{' '}
            <span
              className={
                telemetry.securityLevel === 'Lockdown'
                  ? 'text-rose-400 font-bold'
                  : telemetry.securityLevel === 'Alert'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }
            >
              {telemetry.securityLevel.toUpperCase()}
            </span>
          </span>
          {telemetry.protocolActive && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">PROTOCOL: {telemetry.protocolActive}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCalibrateRepulsors}
            className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            Calibrate Repulsors
          </button>
          <button
            onClick={onTriggerOvercharge}
            className="px-3 py-1.5 text-xs font-mono bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800/80 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            Overcharge Core
          </button>
        </div>
      </div>
    </div>
  );
};
