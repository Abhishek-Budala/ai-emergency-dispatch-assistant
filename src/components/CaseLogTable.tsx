import React, { useState } from 'react';
import { CaseLogEntry, UrgencyLevel } from '../types.ts';
import {
  History,
  Clock,
  MapPin,
  ChevronRight,
  Search,
  Trash2,
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
        return 'bg-red-950 text-red-200 border-red-500';
      case 'High':
        return 'bg-orange-950 text-orange-200 border-orange-500';
      case 'Medium':
        return 'bg-yellow-950 text-yellow-200 border-yellow-500';
      case 'Low':
      default:
        return 'bg-emerald-950 text-emerald-200 border-emerald-500';
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
    <section
      aria-labelledby="case-log-heading"
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          <h2
            id="case-log-heading"
            className="text-xs sm:text-sm font-bold font-mono uppercase text-slate-100 tracking-wider"
          >
            CAD Incident Case Log &amp; Audit Trail
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            {cases.length} Recorded
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick search */}
          <div className="relative">
            <label htmlFor="case-log-search" className="sr-only">
              Filter incident cases by keyword
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              id="case-log-search"
              type="text"
              placeholder="Filter cases by keyword..."
              aria-label="Filter incident cases by keyword"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-mono text-slate-100 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 placeholder-slate-400 w-52 transition-colors min-h-[36px]"
            />
          </div>

          {cases.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              aria-label="Clear CAD Case Log history"
              title="Clear CAD Case Log history"
              className="min-h-[36px] min-w-[36px] p-2 rounded hover:bg-slate-800 text-slate-300 hover:text-red-300 border border-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Case Table / List */}
      {filteredCases.length === 0 ? (
        <div role="status" className="py-6 text-center text-xs font-mono text-slate-300">
          No matching incident records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            data-testid="case-log-table"
            className="w-full text-left text-xs font-mono border-collapse"
          >
            <caption className="sr-only">
              Log of recorded and dispatched emergency incident calls
            </caption>
            <thead>
              <tr className="border-b border-slate-700 text-slate-200 text-xs uppercase bg-slate-950">
                <th scope="col" className="py-2.5 px-3 font-bold">Incident Ref</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Timestamp</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Urgency</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Classification</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Location</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Units Dispatched</th>
                <th scope="col" className="py-2.5 px-3 font-bold">Status</th>
                <th scope="col" className="py-2.5 px-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCases.map((entry) => {
                const isActive = entry.id === activeCaseId;
                return (
                  <tr
                    key={entry.id}
                    data-testid="case-log-row"
                    data-call-number={entry.callNumber}
                    data-urgency={entry.analysis.urgency}
                    data-status={entry.status}
                    tabIndex={0}
                    role="button"
                    aria-label={`View incident ${entry.callNumber}, ${entry.analysis.emergency_type}, Urgency: ${entry.analysis.urgency}, Status: ${entry.status}`}
                    onClick={() => onSelectCase(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectCase(entry);
                      }
                    }}
                    className={`cursor-pointer transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset ${
                      isActive ? 'bg-cyan-950 border-l-4 border-l-cyan-400' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-cyan-200">
                      {entry.callNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        {entry.timestamp}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border inline-block ${getUrgencyClasses(
                          entry.analysis.urgency
                        )}`}
                      >
                        {entry.analysis.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-100 font-semibold max-w-[200px] truncate">
                      {entry.analysis.emergency_type}
                    </td>
                    <td className="py-3 px-3 text-slate-200 max-w-[180px] truncate">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        {entry.analysis.location}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {entry.servicesDispatched && entry.servicesDispatched.length > 0 ? (
                          entry.servicesDispatched.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-semibold"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          entry.status === 'DISPATCHED'
                            ? 'bg-emerald-950 text-emerald-200 border-emerald-400'
                            : 'bg-cyan-950 text-cyan-200 border-cyan-400'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(entry);
                        }}
                        aria-label={`View details of incident ${entry.callNumber}`}
                        className="min-h-[32px] px-2 text-cyan-300 hover:text-white inline-flex items-center gap-1 text-xs font-mono font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
