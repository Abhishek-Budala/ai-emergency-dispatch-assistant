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
    <header
      role="banner"
      className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 backdrop-blur shadow-md"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left branding */}
        <div className="flex items-center space-x-3">
          <div
            className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-red-950 border border-red-500 text-red-300 shadow-inner"
            aria-hidden="true"
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-wider uppercase text-white font-mono flex items-center gap-2">
                AI Emergency Dispatch Assistant
                <span className="text-xs bg-red-950 text-red-200 border border-red-500 px-2 py-0.5 rounded font-mono font-semibold">
                  CAD-911
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>LIVE TRIAGE &amp; DISPATCH CONSOLE</span>
              <span className="text-slate-400" aria-hidden="true">•</span>
              <span className="text-slate-300">UNIT ID: OP-410</span>
            </p>
          </div>
        </div>

        {/* Center / Right status & controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Status pill */}
          <div
            className="hidden sm:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded text-xs font-mono"
            role="status"
            aria-label={`CAD system online. ${activeCaseCount} cases recorded.`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
            <span className="text-slate-100 font-medium">CAD ONLINE</span>
            <span className="text-slate-400" aria-hidden="true">|</span>
            <Activity className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
            <span className="text-cyan-200 font-medium">{activeCaseCount} Cases</span>
          </div>

          {/* Clock */}
          <div
            className="bg-slate-950 border border-cyan-800 px-3 py-2 rounded font-mono text-cyan-200 text-sm font-semibold tracking-widest shadow-inner min-h-[44px] flex items-center"
            aria-label={`System Time: ${timeStr || 'Loading clock'}`}
          >
            <span>{timeStr || '00:00:00'}</span>
            <span className="text-xs text-cyan-400 ml-1.5 font-sans font-normal" aria-hidden="true">SYS</span>
          </div>

          {/* Sound toggle button */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute CAD audio signals' : 'Enable CAD audio signals'}
            aria-pressed={soundEnabled}
            className={`min-h-[44px] px-3 py-2 rounded border text-xs font-mono font-medium flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              soundEnabled
                ? 'bg-slate-800 border-slate-600 text-emerald-300 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            <span className="hidden md:inline">{soundEnabled ? 'AUDIO ON' : 'MUTED'}</span>
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={onResetAll}
            aria-label="Start new emergency call and reset console"
            className="min-h-[44px] px-3 py-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition-colors text-xs font-mono font-semibold flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <RefreshCw className="w-4 h-4 text-cyan-300" aria-hidden="true" />
            <span className="hidden md:inline">NEW CALL</span>
          </button>
        </div>
      </div>
    </header>
  );
};
