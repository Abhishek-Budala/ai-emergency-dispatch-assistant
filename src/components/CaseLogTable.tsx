import React, { useState } from 'react';
import { CaseLogEntry, UrgencyLevel } from '../types.ts';
import {
  History,
  Clock,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Search,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface CaseLogTableProps {
  cases: CaseLogEntry[];
  onSelectCase: (entry: CaseLogEntry) => void;
  onClearLogs: () => void;
  activeCaseId?: string;
}

export const CaseLogTable: React.FC<CaseLogTableProps> = ({
  cases,
  onSelectCase,
  onClearLogs,
  activeCaseId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getUrgencyClasses = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'Low':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.callNumber.toLowerCase().includes(query) ||
      c.analysis.emergency_type.toLowerCase().includes(query) ||
      c.analysis.location.toLowerCase().includes(query) ||
      c.analysis.summary.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono uppercase text-slate-200 tracking-wider">
            CAD Incident Case Log & Audit Trail
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {cases.length} Recorded
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter cases by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 rounded pl-7 pr-3 py-1 focus:outline-none focus:border-cyan-500 placeholder-slate-600 w-48 transition-colors"
            />
          </div>

          {cases.length > 0 && (
            <button
              onClick={onClearLogs}
              title="Clear CAD Case Log"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Case Table / List */}
      {filteredCases.length === 0 ? (
        <div className="py-6 text-center text-xs font-mono text-slate-500">
          No matching incident records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3 font-semibold">Incident Ref</th>
                <th className="py-2 px-3 font-semibold">Timestamp</th>
                <th className="py-2 px-3 font-semibold">Urgency</th>
                <th className="py-2 px-3 font-semibold">Classification</th>
                <th className="py-2 px-3 font-semibold">Location</th>
                <th className="py-2 px-3 font-semibold">Units Dispatched</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((entry) => {
                const isActive = entry.id === activeCaseId;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => onSelectCase(entry)}
                    className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${
                      isActive ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-cyan-300">
                      {entry.callNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                      {entry.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${getUrgencyClasses(
                          entry.analysis.urgency
                        )}`}
                      >
                        {entry.analysis.urgency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-semibold max-w-[200px] truncate">
                      {entry.analysis.emergency_type}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-[180px] truncate">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {entry.analysis.location}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {entry.servicesDispatched && entry.servicesDispatched.length > 0 ? (
                          entry.servicesDispatched.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[9px]"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600 text-[10px]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          entry.status === 'DISPATCHED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(entry);
                        }}
                        className="text-cyan-400 hover:text-cyan-200 inline-flex items-center gap-1 text-[11px] font-mono hover:underline"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
