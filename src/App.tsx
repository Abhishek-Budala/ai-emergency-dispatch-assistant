import React, { useState, useEffect } from 'react';
import { CadHeader } from './components/CadHeader.tsx';
import { AudioIntakePanel } from './components/AudioIntakePanel.tsx';
import { DashboardPanel } from './components/DashboardPanel.tsx';
import { CaseLogTable } from './components/CaseLogTable.tsx';
import {
  EmergencyAnalysis,
  EmergencyServiceType,
  ServiceDispatchState,
  CaseLogEntry,
} from './types.ts';
import { playUrgentAlertTone, playDispatchChime } from './utils/audioAlerts.ts';

const INITIAL_SEED_CASES: CaseLogEntry[] = [
  {
    id: 'seed-1',
    callNumber: '#CAD-8104',
    timestamp: '13:42:15',
    transcript: 'An elderly passenger collapsed on platform 2 of the railway station. He has no pulse and people are screaming for help.',
    language: 'English',
    analysis: {
      emergency_type: 'Medical Emergency - Cardiac Arrest / Collapse',
      urgency: 'Critical',
      location: 'Platform 2, Central Railway Station',
      people_involved: '1 elderly male patient without pulse, bystanders attempting CPR',
      services_to_alert: ['Ambulance', 'Police'],
      summary: 'Critical cardiac collapse on train platform 2; bystander CPR in progress, immediate paramedic intervention required.',
      suggested_questions: [
        'Is someone performing chest compressions right now?',
        'Is there an Automated External Defibrillator (AED) nearby on the platform?',
        'Can someone flag down station security to direct paramedics?',
      ],
    },
    dispatchedAt: '13:43:02',
    servicesDispatched: ['Ambulance', 'Police'],
    status: 'DISPATCHED',
  },
  {
    id: 'seed-2',
    callNumber: '#CAD-7920',
    timestamp: '11:15:30',
    transcript: 'Thick black smoke and flames coming from a restaurant kitchen on Market Street. Gas cylinders are stored near the back entrance.',
    language: 'English',
    analysis: {
      emergency_type: 'Commercial Structural Fire & Hazardous Materials',
      urgency: 'Critical',
      location: 'Market Street, Central Commercial District',
      people_involved: 'Kitchen staff evacuated, customers exiting, high risk due to pressurized gas cylinders',
      services_to_alert: ['Fire', 'Police', 'Ambulance'],
      summary: 'Active commercial kitchen fire with gas cylinders threatening explosion on high-traffic street.',
      suggested_questions: [
        'Has the building been completely evacuated?',
        'How close are the gas cylinders to the active flames?',
        'Are surrounding storefronts clearing the sidewalks?',
      ],
    },
    dispatchedAt: '11:16:08',
    servicesDispatched: ['Fire', 'Police', 'Ambulance'],
    status: 'DISPATCHED',
  },
];

const DEFAULT_DISPATCH_STATE: Record<EmergencyServiceType, ServiceDispatchState> = {
  Ambulance: { service: 'Ambulance', required: false, notified: false },
  Fire: { service: 'Fire', required: false, notified: false },
  Police: { service: 'Police', required: false, notified: false },
  'Social Support': { service: 'Social Support', required: false, notified: false },
};

export default function App() {
  const [analysis, setAnalysis] = useState<EmergencyAnalysis | null>(null);
  const [dispatchState, setDispatchState] = useState<
    Record<EmergencyServiceType, ServiceDispatchState>
  >(DEFAULT_DISPATCH_STATE);
  const [isDispatchConfirmed, setIsDispatchConfirmed] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentCallNumber, setCurrentCallNumber] = useState<string>('#CAD-9101');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('English');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cases, setCases] = useState<CaseLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('cad_case_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load cases from localStorage:', e);
    }
    return INITIAL_SEED_CASES;
  });

  // Save cases to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cad_case_logs', JSON.stringify(cases));
    } catch (e) {
      console.warn('Failed to write cases to localStorage:', e);
    }
  }, [cases]);

  const generateCallNumber = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `#CAD-${num}`;
  };

  const handleAnalyze = async (transcript: string, language: string) => {
    setIsAnalyzing(true);
    setCurrentTranscript(transcript);
    setCurrentLanguage(language);
    setIsDispatchConfirmed(false);

    try {
      const res = await fetch('/api/analyze-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const data: EmergencyAnalysis = await res.json();
      setAnalysis(data);

      // Map required services
      const newDispatchState: Record<EmergencyServiceType, ServiceDispatchState> = {
        Ambulance: {
          service: 'Ambulance',
          required: data.services_to_alert.includes('Ambulance'),
          notified: false,
        },
        Fire: {
          service: 'Fire',
          required: data.services_to_alert.includes('Fire'),
          notified: false,
        },
        Police: {
          service: 'Police',
          required: data.services_to_alert.includes('Police'),
          notified: false,
        },
        'Social Support': {
          service: 'Social Support',
          required: data.services_to_alert.includes('Social Support'),
          notified: false,
        },
      };

      setDispatchState(newDispatchState);
      const callNum = generateCallNumber();
      setCurrentCallNumber(callNum);

      // Play alert sound for priority
      playUrgentAlertTone(data.urgency, soundEnabled);
    } catch (error: any) {
      console.error('Failed to triage call:', error);
      alert(`Emergency Analysis Error: ${error?.message || 'Server request failed'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmDispatch = () => {
    if (!analysis) return;

    const timeNow = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const updatedState = { ...dispatchState };
    const dispatchedServices: EmergencyServiceType[] = [];

    (Object.keys(updatedState) as EmergencyServiceType[]).forEach((key) => {
      if (updatedState[key].required) {
        updatedState[key] = {
          ...updatedState[key],
          notified: true,
          timestamp: timeNow,
        };
        dispatchedServices.push(key);
      }
    });

    setDispatchState(updatedState);
    setIsDispatchConfirmed(true);
    playDispatchChime(soundEnabled);

    // Create log entry
    const newCase: CaseLogEntry = {
      id: `case-${Date.now()}`,
      callNumber: currentCallNumber,
      timestamp: timeNow,
      transcript: currentTranscript,
      language: currentLanguage,
      analysis,
      dispatchedAt: timeNow,
      servicesDispatched: dispatchedServices,
      status: 'DISPATCHED',
    };

    setCases((prev) => [newCase, ...prev]);
  };

  const handleSelectCase = (entry: CaseLogEntry) => {
    setAnalysis(entry.analysis);
    setCurrentCallNumber(entry.callNumber);
    setCurrentTranscript(entry.transcript);
    setCurrentLanguage(entry.language);
    setIsDispatchConfirmed(entry.status === 'DISPATCHED');

    // Restore service states
    const restoredState: Record<EmergencyServiceType, ServiceDispatchState> = {
      Ambulance: {
        service: 'Ambulance',
        required: entry.analysis.services_to_alert.includes('Ambulance'),
        notified: entry.servicesDispatched.includes('Ambulance'),
        timestamp: entry.dispatchedAt,
      },
      Fire: {
        service: 'Fire',
        required: entry.analysis.services_to_alert.includes('Fire'),
        notified: entry.servicesDispatched.includes('Fire'),
        timestamp: entry.dispatchedAt,
      },
      Police: {
        service: 'Police',
        required: entry.analysis.services_to_alert.includes('Police'),
        notified: entry.servicesDispatched.includes('Police'),
        timestamp: entry.dispatchedAt,
      },
      'Social Support': {
        service: 'Social Support',
        required: entry.analysis.services_to_alert.includes('Social Support'),
        notified: entry.servicesDispatched.includes('Social Support'),
        timestamp: entry.dispatchedAt,
      },
    };

    setDispatchState(restoredState);
  };

  const handleResetAll = () => {
    setAnalysis(null);
    setDispatchState(DEFAULT_DISPATCH_STATE);
    setIsDispatchConfirmed(false);
    setCurrentCallNumber(generateCallNumber());
    setCurrentTranscript('');
  };

  const handleClearLogs = () => {
    if (confirm('Clear CAD Case Log history? This cannot be undone.')) {
      setCases([]);
      try {
        localStorage.removeItem('cad_case_logs');
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* CAD Top Header */}
      <CadHeader
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onResetAll={handleResetAll}
        activeCaseCount={cases.length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-5">
        {/* Two-Column Split Layout for Laptop/Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Audio & Transcript Intake */}
          <div className="lg:col-span-5 flex flex-col">
            <AudioIntakePanel
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              soundEnabled={soundEnabled}
            />
          </div>

          {/* Right Column: Emergency Triage Dashboard */}
          <div className="lg:col-span-7 flex flex-col">
            <DashboardPanel
              analysis={analysis}
              dispatchState={dispatchState}
              onConfirmDispatch={handleConfirmDispatch}
              isDispatchConfirmed={isDispatchConfirmed}
              soundEnabled={soundEnabled}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>

        {/* Bottom Section: Historical Case Log */}
        <div className="w-full">
          <CaseLogTable
            cases={cases}
            onSelectCase={handleSelectCase}
            onClearLogs={handleClearLogs}
            activeCaseId={cases.find((c) => c.callNumber === currentCallNumber)?.id}
          />
        </div>
      </main>

      {/* Footer System Status */}
      <footer className="bg-slate-950 border-t border-slate-900 py-2.5 px-4 text-center text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>DISPATCH WORKSTATION ONLINE</span>
          <span className="text-slate-700">|</span>
          <span>MODEL: GEMINI-3.8-FLASH</span>
        </div>
        <div>
          <span>FIRST RESPONDER DISPATCH INTERFACE • PROTOCOL CAD-911/112</span>
        </div>
      </footer>
    </div>
  );
}
