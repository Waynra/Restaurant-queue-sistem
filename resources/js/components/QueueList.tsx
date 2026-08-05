import React from 'react';
import { Customer } from '../types';
import { GripVertical, Clock, ArrowDownWideNarrow, UserCheck } from 'lucide-react';

interface QueueListProps {
  queue: Customer[];
}

export default function QueueList({ queue }: QueueListProps) {
  const handleDragStart = (e: React.DragEvent, customer: Customer) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(customer));
    e.dataTransfer.effectAllowed = 'move';
  };

  const formatArrivedTime = (isoString: string) => {
    const arrived = new Date(isoString);
    const h = arrived.getHours().toString().padStart(2, '0');
    const m = arrived.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <ArrowDownWideNarrow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Waiting Queue</h2>
            <p className="text-xs text-slate-400">Prioritized: Largest party first</p>
          </div>
        </div>
        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
          {queue.length} Waiting
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10 border border-dashed border-slate-800/50 rounded-xl bg-slate-950/10">
          <UserCheck className="w-8 h-8 mb-2 text-slate-600" />
          <p className="text-sm font-medium">Queue is empty</p>
          <p className="text-xs text-slate-500 mt-1">No customers currently waiting</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {queue.map((customer, index) => (
            <div
              key={customer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, customer)}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl hover:bg-slate-950 cursor-grab active:cursor-grabbing transition-all duration-200 group relative overflow-hidden"
            >
              {/* Priority rank indicator */}
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors" />

              <div className="flex items-center gap-3 pl-1">
                <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">{customer.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>Arrived at {formatArrivedTime(customer.arrived_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Party of {customer.party_size}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
