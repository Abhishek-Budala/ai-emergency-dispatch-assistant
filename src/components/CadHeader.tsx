import React, { useState, useEffect } from 'react';
import { Radio, Volume2, VolumeX, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

interface CadHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetAll: () => void;
  activeCaseCount: number;
}

export const CadHeader: React.FC<CadHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onResetAll,
  activeCaseCount,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 text-slate-200 px-4 py-2.5 backdrop-blur shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-red-950/70 border border-red-500/40 text-red-400 shadow-inner">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
                AI Emergency Dispatch Assistant
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                  CAD-911
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>LIVE TRIAGE & DISPATCH CONSOLE</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">UNIT ID: OP-410</span>
            </p>
          </div>
        </div>

        {/* Center / Right status & controls */}
        <div className="flex items-center space-x-4">
          {/* Status pill */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-medium">CAD SYSTEM ONLINE</span>
            <span className="text-slate-600">|</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-medium">{activeCaseCount} Cases Logged</span>
          </div>

          {/* Clock */}
          <div className="bg-slate-950/90 border border-cyan-900/40 px-3 py-1.5 rounded font-mono text-cyan-300 text-sm font-semibold tracking-widest shadow-inner">
            {timeStr || '00:00:00'}
            <span className="text-[10px] text-cyan-500/80 ml-1 font-sans">SYS</span>
          </div>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute CAD Audio Signals' : 'Enable CAD Audio Signals'}
            className={`p-2 rounded border text-xs font-mono flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onResetAll}
            title="Reset current intake and dashboard"
            className="p-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-mono flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">NEW CALL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
