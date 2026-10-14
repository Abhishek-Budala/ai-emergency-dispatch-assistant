import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Globe,
  Send,
  RotateCcw,
  Sparkles,
  AlertCircle,
  FileText,
  Volume2,
  Copy,
  Check,
} from 'lucide-react';
import { LanguageOption } from '../types.ts';
import { playRadioClick } from '../utils/audioAlerts.ts';

// Web Speech API typing declarations
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionLike, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionLike, ev: SpeechRecognitionEventLike) => any) | null;
  onerror: ((this: SpeechRecognitionLike, ev: any) => any) | null;
  onend: ((this: SpeechRecognitionLike, ev: Event) => any) | null;
}

interface AudioIntakePanelProps {
  onAnalyze: (transcript: string, language: string) => void;
  isAnalyzing: boolean;
  soundEnabled: boolean;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English (US/IN)', recognitionCode: 'en-US' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు (Telugu)', recognitionCode: 'te-IN' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी (Hindi)', recognitionCode: 'hi-IN' },
];

const SAMPLE_CALLS = [
  {
    title: 'Medical / Collapse',
    text: "A man collapsed near the bus stand. He's not responding and a crowd is gathering.",
    tag: 'Bus Stand',
  },
  {
    title: 'Structural Fire',
    text: "There is smoke coming from the third floor of the building near Brodipet main road, and people are shouting from the windows.",
    tag: 'Brodipet Main Rd',
  },
  {
    title: 'Highway Crash',
    text: "Two bikes and a lorry crashed near the highway toll gate. One person is bleeding badly and the road is blocked.",
    tag: 'Highway Toll',
  },
];

export const AudioIntakePanel: React.FC<AudioIntakePanelProps> = ({
  onAnalyze,
  isAnalyzing,
  soundEnabled,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LANGUAGES[0]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [backupText, setBackupText] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check speech recognition capability
  const isSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  // Clean up silence timer
  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopRecognition = (triggerAnalyze = false) => {
    resetSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.debug('Recognition stop error:', e);
      }
    }
    setIsRecording(false);
    playRadioClick(soundEnabled);

    if (triggerAnalyze) {
      const textToAnalyze = (finalTranscriptRef.current || liveTranscript || backupText).trim();
      if (textToAnalyze) {
        onAnalyze(textToAnalyze, selectedLanguage.label);
      }
    }
  };

  const startRecognition = () => {
    setMicError(null);
    playRadioClick(soundEnabled);

    if (!isSpeechSupported) {
      setMicError('Speech recognition is not supported in this browser. Please use the backup text box or sample calls.');
      return;
    }

    try {
      const SpeechClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition: SpeechRecognitionLike = new SpeechClass();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage.recognitionCode;

      recognition.onstart = () => {
        setIsRecording(true);
        setMicError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interimText = '';
        let currentFinal = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            currentFinal += (currentFinal ? ' ' : '') + item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        finalTranscriptRef.current = currentFinal;
        const combined = currentFinal + (interimText ? ` [${interimText}]` : '');
        setLiveTranscript(combined);
        setBackupText(currentFinal || interimText);

        // Auto silence detection: if user pauses speaking for 3.5s, auto-stop and analyze
        resetSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          if (finalTranscriptRef.current.trim().length > 0) {
            stopRecognition(true);
          }
        }, 3500);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission was denied. Please allow microphone access in your browser settings, or use text input.');
        } else if (event.error === 'no-speech') {
          // Normal timeout if caller didn't say anything
        } else {
          setMicError(`Audio recognition: ${event.error || 'Failed to capture voice'}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Speech initialization error:', err);
      setMicError(err?.message || 'Unable to start speech intake.');
      setIsRecording(false);
    }
  };

  const handleToggleMic = () => {
    if (isRecording) {
      stopRecognition(true);
    } else {
      // Clear previous live transcript on new recording start
      setLiveTranscript('');
      finalTranscriptRef.current = '';
      startRecognition();
    }
  };

  const handleFillSample = (sampleText: string) => {
    playRadioClick(soundEnabled);
    setBackupText(sampleText);
    setLiveTranscript(sampleText);
    finalTranscriptRef.current = sampleText;
  };

  const handleManualAnalyze = () => {
    const textToSend = backupText.trim() || liveTranscript.replace(/\[.*?\]/g, '').trim();
    if (!textToSend) {
      setMicError('Please record speech or enter call details in the text box first.');
      return;
    }
    setMicError(null);
    if (isRecording) {
      stopRecognition(false);
    }
    onAnalyze(textToSend, selectedLanguage.label);
  };

  const handleClearAll = () => {
    resetSilenceTimer();
    if (isRecording) {
      stopRecognition(false);
    }
    setLiveTranscript('');
    setBackupText('');
    finalTranscriptRef.current = '';
    setMicError(null);
  };

  const handleCopyTranscript = () => {
    const text = backupText || liveTranscript;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur">
      {/* Panel Title */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200 font-mono">
            Caller Audio & Triage Intake
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
          CHANNEL 1 (INBOUND)
        </span>
      </div>

      {/* Language Selector */}
      <div className="mb-5">
        <label className="text-xs font-mono text-slate-400 flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            SELECT CALLER LANGUAGE
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Multilingual Engine</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLanguage(lang);
                  if (isRecording) {
                    stopRecognition(false);
                  }
                }}
                className={`py-2 px-3 rounded-lg border text-left transition-all font-mono text-xs flex flex-col items-start ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="font-bold">{lang.label}</span>
                <span className="text-[10px] opacity-75 font-sans mt-0.5">{lang.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Large Microphone Intake Center */}
      <div className="flex flex-col items-center justify-center p-5 mb-5 rounded-xl bg-slate-950/80 border border-slate-800 relative overflow-hidden">
        {/* Subtle background radar circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className={`w-48 h-48 rounded-full border border-cyan-500/40 ${isRecording ? 'animate-ping' : ''}`}></div>
          <div className="w-32 h-32 rounded-full border border-cyan-500/30"></div>
        </div>

        {/* Large Mic Button */}
        <div className="relative z-10 flex flex-col items-center">
          <button
            onClick={handleToggleMic}
            disabled={isAnalyzing}
            className={`group relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 transform active:scale-95 shadow-2xl ${
              isRecording
                ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-600/50 ring-4 ring-red-500/40 animate-pulse'
                : 'bg-gradient-to-tr from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/30 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 transition-transform group-hover:scale-110" />
            ) : (
              <Mic className="w-10 h-10 transition-transform group-hover:scale-110" />
            )}
          </button>

          {/* Recording Status & Timer */}
          <div className="mt-3 text-center">
            {isRecording ? (
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-400 font-mono font-bold text-xs tracking-wider uppercase">
                  RECORDING LIVE ({recordingSeconds}s)
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-mono text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                CLICK TO START VOICE INTAKE
              </span>
            )}
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              {isRecording
                ? 'Speaking will stream text live. Click again or pause to analyze.'
                : `Listening mode: ${selectedLanguage.label} (${selectedLanguage.recognitionCode})`}
            </p>
          </div>
        </div>
      </div>

      {/* Mic Error Banner if any */}
      {micError && (
        <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Notice: </span>
            {micError}
          </div>
        </div>
      )}

      {/* Live Transcript Box */}
      <div className="mb-4 flex-1 min-h-[110px] flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE VOICE TRANSCRIPT
          </label>
          {liveTranscript && (
            <button
              onClick={handleCopyTranscript}
              className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        <div className="flex-1 w-full p-3 rounded-lg bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-200 overflow-y-auto max-h-32 min-h-[85px] relative focus-within:border-cyan-500/50">
          {liveTranscript ? (
            <p className="whitespace-pre-wrap leading-relaxed text-slate-100">
              {liveTranscript}
              {isRecording && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse"></span>}
            </p>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              {isRecording
                ? 'Speak now... caller words will appear here in real time.'
                : 'Audio transcript stream is waiting. Click microphone above to begin.'}
            </div>
          )}
        </div>
      </div>

      {/* Backup Text Box Input */}
      <div className="mb-4">
        <label className="text-xs font-mono text-slate-400 flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            DISPATCHER BACKUP / MANUAL INPUT
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {backupText.length} chars
          </span>
        </label>
        <textarea
          value={backupText}
          onChange={(e) => {
            setBackupText(e.target.value);
            if (!liveTranscript) setLiveTranscript(e.target.value);
          }}
          placeholder="Type or edit call transcript manually if audio is noisy or caller is hard to hear..."
          rows={3}
          className="w-full p-3 rounded-lg bg-slate-950/90 border border-slate-800 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors resize-none"
        />
      </div>

      {/* Sample Calls Buttons */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">
            SAMPLE EMERGENCY CALLS (ONE-CLICK SIMULATION)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_CALLS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleFillSample(sample.text)}
              className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-cyan-600/50 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[11px] font-bold font-mono text-cyan-400 group-hover:text-cyan-300">
                  Call #{idx + 1}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                  {sample.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug group-hover:text-slate-200">
                "{sample.text}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons: Clear & Analyze */}
      <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleClearAll}
          title="Clear intake text and transcript"
          className="px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          onClick={handleManualAnalyze}
          disabled={isAnalyzing || (!backupText.trim() && !liveTranscript.trim())}
          className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            isAnalyzing
              ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 cursor-wait'
              : !backupText.trim() && !liveTranscript.trim()
              ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 hover:shadow-cyan-500/25 border border-cyan-400 active:scale-[0.99]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
              <span>TRIAGING WITH GEMINI AI...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ANALYZE INCIDENT NOW</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
