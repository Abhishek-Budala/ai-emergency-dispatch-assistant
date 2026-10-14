import React, { useState } from 'react';
import {
  EmergencyAnalysis,
  EmergencyServiceType,
  ServiceDispatchState,
  UrgencyLevel,
} from '../types.ts';
import {
  Ambulance,
  Flame,
  Shield,
  HeartHandshake,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  HelpCircle,
  Check,
  Copy,
  ChevronRight,
  SendHorizontal,
} from 'lucide-react';
import { playDispatchChime } from '../utils/audioAlerts.ts';

interface DashboardPanelProps {
  analysis: EmergencyAnalysis | null;
  dispatchState: Record<EmergencyServiceType, ServiceDispatchState>;
  onConfirmDispatch: () => void;
  isDispatchConfirmed: boolean;
  soundEnabled: boolean;
  isAnalyzing: boolean;
}

const SERVICE_CONFIG: Record<
  EmergencyServiceType,
  {
    icon: React.ElementType;
    fullName: string;
    code: string;
    accentColor: string;
    borderActive: string;
    bgActive: string;
    textActive: string;
    badgeActive: string;
  }
> = {
  Ambulance: {
    icon: Ambulance,
    fullName: 'Medical EMS / Ambulance',
    code: 'EMS-MED',
    accentColor: 'rose',
    borderActive: 'border-rose-500 shadow-rose-950/60 ring-rose-500/30',
    bgActive: 'bg-rose-950/50',
    textActive: 'text-rose-400',
    badgeActive: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  Fire: {
    icon: Flame,
    fullName: 'Fire & Rescue Service',
    code: 'FIRE-RES',
    accentColor: 'amber',
    borderActive: 'border-amber-500 shadow-amber-950/60 ring-amber-500/30',
    bgActive: 'bg-amber-950/50',
    textActive: 'text-amber-400',
    badgeActive: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  Police: {
    icon: Shield,
    fullName: 'Law Enforcement / Police',
    code: 'POL-TAC',
    accentColor: 'blue',
    borderActive: 'border-blue-500 shadow-blue-950/60 ring-blue-500/30',
    bgActive: 'bg-blue-950/50',
    textActive: 'text-blue-400',
    badgeActive: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  'Social Support': {
    icon: HeartHandshake,
    fullName: 'Crisis & Social Support',
    code: 'SOC-WLF',
    accentColor: 'purple',
    borderActive: 'border-purple-500 shadow-purple-950/60 ring-purple-500/30',
    bgActive: 'bg-purple-950/50',
    textActive: 'text-purple-400',
    badgeActive: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
};

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  analysis,
  dispatchState,
  onConfirmDispatch,
  isDispatchConfirmed,
  soundEnabled,
  isAnalyzing,
}) => {
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [copiedLocation, setCopiedLocation] = useState(false);

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical':
        return {
          label: 'CRITICAL SEVERITY',
          classes: 'bg-red-950/90 text-red-300 border-red-500 ring-2 ring-red-500/40 shadow-red-900/50 animate-pulse',
          dot: 'bg-red-400 animate-ping',
        };
      case 'High':
        return {
          label: 'HIGH PRIORITY',
          classes: 'bg-orange-950/90 text-orange-300 border-orange-500 ring-1 ring-orange-500/40 shadow-orange-900/40',
          dot: 'bg-orange-400',
        };
      case 'Medium':
        return {
          label: 'MEDIUM URGENCY',
          classes: 'bg-yellow-950/90 text-yellow-300 border-yellow-500 ring-1 ring-yellow-500/40 shadow-yellow-900/40',
          dot: 'bg-yellow-400',
        };
      case 'Low':
      default:
        return {
          label: 'LOW / ROUTINE',
          classes: 'bg-emerald-950/90 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500/40',
          dot: 'bg-emerald-400',
        };
    }
  };

  const handleToggleQuestion = (index: number) => {
    setCheckedQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleCopyLocation = () => {
    if (!analysis?.location) return;
    navigator.clipboard.writeText(analysis.location);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2000);
  };

  const handleConfirmClick = () => {
    playDispatchChime(soundEnabled);
    onConfirmDispatch();
  };

  const servicesList: EmergencyServiceType[] = [
    'Ambulance',
    'Fire',
    'Police',
    'Social Support',
  ];

  const highlightedCount = servicesList.filter((s) => dispatchState[s]?.required).length;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur relative">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200 font-mono">
            Incident Triage & Unit Dispatch Dashboard
          </h2>
        </div>

        {analysis ? (
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-slate-400">STATUS:</span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isDispatchConfirmed
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-500'
              }`}
            >
              {isDispatchConfirmed ? 'DISPATCHED' : 'TRIAGED / PENDING'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-slate-500">STANDBY FOR CALL</span>
        )}
      </div>

      {/* Main Dashboard Content */}
      {isAnalyzing ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[380px]">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin"></div>
            <Radio className="w-7 h-7 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h3 className="text-sm font-mono font-bold text-cyan-300 uppercase tracking-widest">
            AI CAD Core Processing Transcript...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 font-sans">
            Evaluating emergency severity, determining required responders, extracting location, and preparing triage protocol questions.
          </p>
        </div>
      ) : !analysis ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl min-h-[380px]">
          <AlertTriangle className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-mono text-slate-300 font-semibold mb-1">
            No Active Emergency Incident Loaded
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            Click the microphone on the left to capture live caller audio, or click one of the 3 sample call buttons and hit "Analyze Incident Now".
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-0.5">
          {/* Urgency Badge + Emergency Type Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
            <div className="flex-1 min-w-[200px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>INCIDENT CLASSIFICATION</span>
              </div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                {analysis.emergency_type}
              </h3>
            </div>

            {/* Urgency Badge */}
            {(() => {
              const badge = getUrgencyBadge(analysis.urgency);
              return (
                <div
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow-lg ${badge.classes}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                  <span>{badge.label}</span>
                </div>
              );
            })()}
          </div>

          {/* Location & People Involved Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5 text-slate-400 font-mono text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <MapPin className="w-3.5 h-3.5" />
                  INCIDENT LOCATION
                </span>
                <button
                  onClick={handleCopyLocation}
                  className="text-[10px] hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  title="Copy location"
                >
                  {copiedLocation ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedLocation ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                {analysis.location || 'Unspecified location'}
              </p>
            </div>

            {/* People Involved Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center mb-1.5 text-slate-400 font-mono text-xs">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Users className="w-3.5 h-3.5" />
                  PEOPLE INVOLVED & STATUS
                </span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                {analysis.people_involved || 'Unknown number of persons'}
              </p>
            </div>
          </div>

          {/* One-Line Summary Box */}
          <div className="bg-slate-950/90 border-l-4 border-l-cyan-500 border-y border-r border-slate-800 rounded-r-lg p-3 shadow-inner">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
              OPERATIONAL SITUATION SUMMARY
            </span>
            <p className="text-xs text-slate-200 leading-snug font-sans">
              "{analysis.summary}"
            </p>
          </div>

          {/* 4 Services to Alert Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>FIRST RESPONDER SERVICES DISPATCH ROUTING</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {highlightedCount} service{highlightedCount === 1 ? '' : 's'} required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {servicesList.map((serviceKey) => {
                const conf = SERVICE_CONFIG[serviceKey];
                const state = dispatchState[serviceKey];
                const isRequired = state?.required ?? false;
                const isNotified = state?.notified ?? false;
                const IconComponent = conf.icon;

                return (
                  <div
                    key={serviceKey}
                    className={`rounded-xl border p-3.5 transition-all duration-300 relative overflow-hidden ${
                      isRequired
                        ? `${conf.borderActive} ${conf.bgActive} shadow-lg ring-1`
                        : 'border-slate-800 bg-slate-950/40 opacity-50 grayscale'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`p-2 rounded-lg ${
                            isRequired
                              ? `${conf.badgeActive} border`
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4
                            className={`text-xs font-bold font-mono tracking-wide ${
                              isRequired ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            {serviceKey.toUpperCase()}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-sans block">
                            {conf.fullName}
                          </span>
                        </div>
                      </div>

                      {/* Service Status Badge */}
                      <div className="text-right">
                        {isNotified ? (
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              NOTIFIED
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400/80 mt-0.5 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {state.timestamp || 'Recorded'}
                            </span>
                          </div>
                        ) : isRequired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                            DISPATCH REQUIRED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 bg-slate-900 border border-slate-800">
                            STANDBY
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Questions for Dispatcher */}
          {analysis.suggested_questions && analysis.suggested_questions.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 font-semibold">
                  <HelpCircle className="w-3.5 h-3.5" />
                  DISPATCHER TRIAGE PROTOCOL QUESTIONS
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Ask caller to confirm
                </span>
              </div>

              <div className="space-y-1.5">
                {analysis.suggested_questions.map((q, idx) => {
                  const isChecked = !!checkedQuestions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => handleToggleQuestion(idx)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-900/90 border-slate-800/80 text-slate-200 hover:border-cyan-700/60'
                      }`}
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-700 bg-slate-950 text-transparent hover:border-slate-500'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                      <span className="flex-1 leading-snug">{q}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confirm Dispatch Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmClick}
              disabled={highlightedCount === 0 || isDispatchConfirmed}
              className={`w-full py-3.5 px-4 rounded-xl font-mono text-sm font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl ${
                isDispatchConfirmed
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 cursor-default'
                  : highlightedCount > 0
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white border border-red-400 shadow-red-950/60 hover:scale-[1.01] active:scale-[0.99] animate-pulse ring-2 ring-red-500/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isDispatchConfirmed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>ALL REQUIRED UNITS NOTIFIED & DISPATCHED</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-5 h-5" />
                  <span>
                    CONFIRM DISPATCH ({highlightedCount} UNIT{highlightedCount === 1 ? '' : 'S'})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
