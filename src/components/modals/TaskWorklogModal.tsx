'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { X, Clock } from 'lucide-react';

interface TaskWorklogModalProps {
  task: Task | null;
  projectName?: string;
  onClose: () => void;
}

export const TaskWorklogModal: React.FC<TaskWorklogModalProps> = ({
  task,
  projectName,
  onClose,
}) => {
  if (!task) return null;

  const worklogs = task.worklogs || [];

  // Compute total duration in seconds from all worklogs
  const totalSeconds = worklogs.reduce((acc, wl) => acc + (wl.durationSeconds || 0), 0);
  const totalHours = totalSeconds > 0 ? totalSeconds / 3600 : task.loggedHours;

  const formatSessionDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0m 0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-start justify-between bg-zinc-50/70">
          <div className="space-y-1 pr-4">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-700">
                Task Worklog & Sessions
              </span>
              {projectName && (
                <span className="text-xs font-semibold text-zinc-500">
                  • Project: {projectName}
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-zinc-900 leading-snug">{task.title}</h3>
            <p className="text-xs text-zinc-500">
              Complete history of all live timer START & STOP sessions recorded for this task.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-5 overflow-y-auto flex-1">
          {worklogs.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-700">No session logs recorded yet</p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Click the START button on this task to start tracking live work hours. Each session will be logged here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="py-3 px-3.5">#</th>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Start Time</th>
                    <th className="py-3 px-3.5">Stop Time</th>
                    <th className="py-3 px-3.5">Duration</th>
                    <th className="py-3 px-3.5">Logged By</th>
                    <th className="py-3 px-3.5">Notes / Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {worklogs.map((log, index) => (
                    <tr key={log.id || index} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-[11px] text-zinc-400 font-semibold">
                        {worklogs.length - index}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-zinc-800">
                        {log.date ? formatDate(log.date) : 'Today'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-emerald-700 font-semibold">
                        {log.startTime || '--:--'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-rose-700 font-semibold">
                        {log.endTime || '--:--'}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-zinc-900 bg-brand-50/30">
                        {formatSessionDuration(log.durationSeconds)}
                      </td>
                      <td className="py-3 px-3.5 text-zinc-600 font-medium">
                        {log.userName}
                      </td>
                      <td className="py-3 px-3.5 text-zinc-500 max-w-[180px] truncate" title={log.notes}>
                        {log.notes || 'Live task work session'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Last Row: Sum of All Time */}
                <tfoot className="bg-zinc-100 border-t-2 border-zinc-300 font-extrabold text-zinc-900">
                  <tr>
                    <td colSpan={4} className="py-3.5 px-3.5 text-right uppercase tracking-wider text-[11px]">
                      Total Time Taken Across All Sessions:
                    </td>
                    <td className="py-3.5 px-3.5 font-mono text-sm text-brand-600 font-black">
                      {formatSessionDuration(totalSeconds)} ({totalHours.toFixed(2)} hrs)
                    </td>
                    <td colSpan={2} className="py-3.5 px-3.5 text-zinc-500 font-normal text-[11px]">
                      Est. Target: {task.estimatedHours}h
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Total Sessions: <strong className="text-zinc-800">{worklogs.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Close Worklog
          </button>
        </div>

      </div>
    </div>
  );
};
