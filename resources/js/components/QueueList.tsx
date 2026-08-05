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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
            <ArrowDownWideNarrow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Waiting Queue</h2>
            <p className="text-xs text-slate-500">Prioritized: Largest party first</p>
          </div>
        </div>
        <span className="bg-sky-500/10 text-sky-600 border border-sky-500/20 text-xs font-bold px-2.5 py-1 rounded-full">
          {queue.length} Waiting
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
          <UserCheck className="w-8 h-8 mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Queue is empty</p>
          <p className="text-xs text-slate-500 mt-1">No customers currently waiting</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {queue.map((customer, index) => (
            <div
              key={customer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, customer)}
              className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl hover:bg-white cursor-grab active:cursor-grabbing transition-all duration-200 group relative overflow-hidden"
            >
              {/* Priority rank indicator */}
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/30 group-hover:bg-sky-500 transition-colors" />

              <div className="flex items-center gap-3 pl-1">
                <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">{customer.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Arrived at {formatArrivedTime(customer.arrived_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 border border-sky-500/20">
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
