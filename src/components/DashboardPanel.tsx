import React, { useState } from 'react';
import {
  EmergencyAnalysis,
  EmergencyServiceType,
  ServiceDispatchState,
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
  SendHorizontal,
} from 'lucide-react';
import { playDispatchChime } from '../utils/audioAlerts.ts';
import { getUrgencyBadgeConfig } from '../utils/urgencyConfig.ts';

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
    borderActive: 'border-rose-400 shadow-rose-950/60 ring-rose-500/40',
    bgActive: 'bg-rose-950',
    textActive: 'text-rose-200',
    badgeActive: 'bg-rose-900 text-rose-100 border-rose-400',
  },
  Fire: {
    icon: Flame,
    fullName: 'Fire & Rescue Service',
    code: 'FIRE-RES',
    accentColor: 'amber',
    borderActive: 'border-amber-400 shadow-amber-950/60 ring-amber-500/40',
    bgActive: 'bg-amber-950',
    textActive: 'text-amber-200',
    badgeActive: 'bg-amber-900 text-amber-100 border-amber-400',
  },
  Police: {
    icon: Shield,
    fullName: 'Law Enforcement / Police',
    code: 'POL-TAC',
    accentColor: 'blue',
    borderActive: 'border-blue-400 shadow-blue-950/60 ring-blue-500/40',
    bgActive: 'bg-blue-950',
    textActive: 'text-blue-200',
    badgeActive: 'bg-blue-900 text-blue-100 border-blue-400',
  },
  'Social Support': {
    icon: HeartHandshake,
    fullName: 'Crisis & Social Support',
    code: 'SOC-WLF',
    accentColor: 'purple',
    borderActive: 'border-purple-400 shadow-purple-950/60 ring-purple-500/40',
    bgActive: 'bg-purple-950',
    textActive: 'text-purple-200',
    badgeActive: 'bg-purple-900 text-purple-100 border-purple-400',
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
    <section
      aria-labelledby="dashboard-heading"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur relative"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true"></div>
          <h2
            id="dashboard-heading"
            className="text-sm font-bold tracking-wider uppercase text-slate-100 font-mono"
          >
            Incident Triage &amp; Unit Dispatch Dashboard
          </h2>
        </div>

        {analysis ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-slate-300 font-semibold">STATUS:</span>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                isDispatchConfirmed
                  ? 'bg-emerald-950 text-emerald-200 border-emerald-500'
                  : 'bg-cyan-950 text-cyan-200 border-cyan-500'
              }`}
            >
              {isDispatchConfirmed ? 'DISPATCHED' : 'TRIAGED / PENDING'}
            </span>
          </div>
        ) : (
          <span className="text-xs font-mono text-slate-300">STANDBY FOR CALL</span>
        )}
      </div>

      {/* Main Dashboard Content - with aria-live polite so screen readers announce results */}
      <div aria-live="polite" aria-atomic="false" className="flex-1 flex flex-col">
        {isAnalyzing ? (
          <div
            role="status"
            className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[380px]"
          >
            <div className="relative mb-4">
              <div
                className="w-16 h-16 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin"
                aria-hidden="true"
              ></div>
              <Radio className="w-7 h-7 text-cyan-300 absolute inset-0 m-auto animate-pulse" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-mono font-bold text-cyan-200 uppercase tracking-widest">
              AI CAD Core Processing Transcript...
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mt-1.5 font-sans leading-relaxed">
              Evaluating emergency severity, determining required responders, extracting location, and preparing triage protocol questions.
            </p>
          </div>
        ) : !analysis ? (
          <div
            role="status"
            className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300 border border-dashed border-slate-700 rounded-xl min-h-[380px]"
          >
            <AlertTriangle className="w-10 h-10 text-slate-400 mb-3" aria-hidden="true" />
            <h3 className="text-sm font-mono text-slate-200 font-bold mb-1">
              No Active Emergency Incident Loaded
            </h3>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Click the microphone on the left to capture live caller audio, or click one of the 3 sample call buttons and hit "Analyze Incident Now".
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-0.5">
            {/* Urgency Badge + Emergency Type Banner */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-semibold">
                  <span>INCIDENT CLASSIFICATION</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                  {analysis.emergency_type}
                </h3>
              </div>

              {/* Urgency Badge */}
              {(() => {
                const badge = getUrgencyBadgeConfig(analysis.urgency);
                return (
                  <div
                    data-testid="urgency-badge"
                    data-urgency={analysis.urgency}
                    data-color={badge.colorName}
                    aria-label={badge.ariaLabel}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow-lg ${badge.classes}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} aria-hidden="true"></span>
                    <span>{badge.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Location & People Involved Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Location Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5 text-slate-200 font-mono text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <MapPin className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    INCIDENT LOCATION
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLocation}
                    aria-label="Copy incident location address to clipboard"
                    className="min-h-[32px] px-2 py-1 text-xs text-slate-200 hover:text-cyan-200 flex items-center gap-1 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    {copiedLocation ? <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />}
                    <span>{copiedLocation ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                  {analysis.location || 'Unspecified location'}
                </p>
              </div>

              {/* People Involved Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center mb-1.5 text-slate-200 font-mono text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Users className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    PEOPLE INVOLVED &amp; STATUS
                  </span>
                </div>
                <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                  {analysis.people_involved || 'Unknown number of persons'}
                </p>
              </div>
            </div>

            {/* One-Line Summary Box */}
            <div className="bg-slate-950 border-l-4 border-l-cyan-400 border-y border-r border-slate-800 rounded-r-lg p-3.5 shadow-inner">
              <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider block mb-1 font-bold">
                OPERATIONAL SITUATION SUMMARY
              </span>
              <p className="text-xs text-slate-100 leading-relaxed font-sans font-medium">
                "{analysis.summary}"
              </p>
            </div>

            {/* 4 Services to Alert Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-slate-200 flex items-center gap-1.5 font-semibold">
                  <Radio className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                  <span>FIRST RESPONDER SERVICES DISPATCH ROUTING</span>
                </div>
                <span className="text-xs font-mono text-slate-300 font-medium">
                  {highlightedCount} service{highlightedCount === 1 ? '' : 's'} required
                </span>
              </div>

              <div
                role="region"
                aria-label="First responder services dispatch status"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              >
                {servicesList.map((serviceKey) => {
                  const conf = SERVICE_CONFIG[serviceKey];
                  const state = dispatchState[serviceKey];
                  const isRequired = state?.required ?? false;
                  const isNotified = state?.notified ?? false;
                  const IconComponent = conf.icon;

                  const accessibleStatusText = isNotified
                    ? `${serviceKey}: Notified at ${state.timestamp || 'recorded time'}`
                    : isRequired
                    ? `${serviceKey}: Action required, dispatch pending`
                    : `${serviceKey}: On standby, not required`;

                  return (
                    <div
                      key={serviceKey}
                      data-testid={`service-card-${serviceKey.toLowerCase().replace(/\s+/g, '-')}`}
                      data-service={serviceKey}
                      data-highlighted={isRequired ? 'true' : 'false'}
                      data-notified={isNotified ? 'true' : 'false'}
                      aria-label={accessibleStatusText}
                      className={`rounded-xl border p-3.5 transition-all duration-300 relative overflow-hidden ${
                        isRequired
                          ? `${conf.borderActive} ${conf.bgActive} shadow-lg ring-1`
                          : 'border-slate-700 bg-slate-950 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`p-2 rounded-lg ${
                              isRequired
                                ? `${conf.badgeActive} border`
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                            aria-hidden="true"
                          >
                            <IconComponent className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <h4
                              className={`text-xs font-bold font-mono tracking-wide ${
                                isRequired ? 'text-white' : 'text-slate-200'
                              }`}
                            >
                              {serviceKey.toUpperCase()}
                            </h4>
                            <span className="text-xs text-slate-300 font-sans block mt-0.5">
                              {conf.fullName}
                            </span>
                          </div>
                        </div>

                        {/* Service Status Badge */}
                        <div className="text-right shrink-0">
                          {isNotified ? (
                            <div className="flex flex-col items-end">
                              <span
                                data-testid={`status-${serviceKey.toLowerCase().replace(/\s+/g, '-')}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-200 border border-emerald-400"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                                NOTIFIED
                              </span>
                              <span
                                data-testid={`timestamp-${serviceKey.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-xs font-mono text-emerald-300 mt-1 flex items-center gap-1 font-medium"
                              >
                                <Clock className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                                {state.timestamp || 'Recorded'}
                              </span>
                            </div>
                          ) : isRequired ? (
                            <span
                              data-testid={`status-${serviceKey.toLowerCase().replace(/\s+/g, '-')}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-950 text-rose-200 border border-rose-400 animate-pulse"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
                              DISPATCH REQUIRED
                            </span>
                          ) : (
                            <span
                              data-testid={`status-${serviceKey.toLowerCase().replace(/\s+/g, '-')}`}
                              className="px-2 py-1 rounded text-xs font-mono font-semibold text-slate-300 bg-slate-800 border border-slate-700"
                            >
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
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-300 flex items-center gap-1.5 font-bold">
                    <HelpCircle className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    DISPATCHER TRIAGE PROTOCOL QUESTIONS
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Click or press Space to mark asked
                  </span>
                </div>

                <div role="group" aria-label="Dispatcher triage questions checklist" className="space-y-2">
                  {analysis.suggested_questions.map((q, idx) => {
                    const isChecked = !!checkedQuestions[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="checkbox"
                        aria-checked={isChecked}
                        aria-label={`Protocol question ${idx + 1}: ${q}. ${isChecked ? 'Completed' : 'Not yet asked'}`}
                        onClick={() => handleToggleQuestion(idx)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleQuestion(idx);
                          }
                        }}
                        className={`w-full min-h-[44px] p-2.5 rounded-lg border text-xs text-left cursor-pointer transition-all flex items-start gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                          isChecked
                            ? 'bg-slate-900 border-slate-700 text-slate-400 line-through'
                            : 'bg-slate-900 border-slate-700 text-slate-100 hover:border-cyan-400 hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-400 text-white'
                              : 'border-slate-500 bg-slate-950 text-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                        </span>
                        <span className="flex-1 leading-snug font-medium">{q}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm Dispatch Action Button */}
            <div className="pt-2">
              <button
                type="button"
                data-testid="confirm-dispatch-btn"
                onClick={handleConfirmClick}
                disabled={highlightedCount === 0 || isDispatchConfirmed}
                aria-label={
                  isDispatchConfirmed
                    ? 'All required emergency units have been notified and dispatched'
                    : highlightedCount > 0
                    ? `Confirm dispatch and notify ${highlightedCount} required emergency unit${highlightedCount === 1 ? '' : 's'}`
                    : 'Confirm dispatch disabled, no units required'
                }
                className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-mono text-sm font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 ${
                  isDispatchConfirmed
                    ? 'bg-emerald-950 text-emerald-200 border-2 border-emerald-400 cursor-default'
                    : highlightedCount > 0
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-600 text-white border-2 border-red-300 shadow-red-950/60 hover:scale-[1.01] active:scale-[0.99] ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isDispatchConfirmed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" aria-hidden="true" />
                    <span>ALL REQUIRED UNITS NOTIFIED &amp; DISPATCHED</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal className="w-5 h-5" aria-hidden="true" />
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
    </section>
  );
};
