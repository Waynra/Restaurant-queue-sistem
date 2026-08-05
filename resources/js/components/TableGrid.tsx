import React, { useState, useEffect } from 'react';
import { Table, Customer } from '../types';
import { useServeMutation, useSeatMutation } from '../hooks/useQueueQuery';
import { UserCheck, Flame, Coffee, UserMinus, ShieldAlert } from 'lucide-react';

interface TableCardProps {
  table: Table;
  now: number;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, table: Table) => void;
  onServe: (customerId: number) => void;
  isServePending: boolean;
}

function TableCard({ table, now, onDragOver, onDrop, onServe, isServePending }: TableCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCustomer = table.active_customer;
  const isOccupied = table.status === 'occupied' && activeCustomer;

  // Calculate live countdown timer
  let remainingMs = 0;
  let formattedTime = '';
  let statusColor = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 shadow-emerald-500/5';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (isOccupied && activeCustomer.ended_at) {
    const endedAt = new Date(activeCustomer.ended_at).getTime();
    remainingMs = Math.max(0, endedAt - now);

    const totalSeconds = Math.floor(remainingMs / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    formattedTime = `${m}m ${s}s`;

    // Yellow if less than 5 minutes (300,000 ms) left, otherwise Red
    if (remainingMs <= 300000) {
      statusColor = 'border-amber-200 bg-amber-50/40 text-amber-700 shadow-sm';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    } else {
      statusColor = 'border-rose-200 bg-rose-50/40 text-rose-700 shadow-sm';
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else {
    statusColor = 'border-emerald-200 bg-emerald-50/40 text-emerald-700 shadow-sm';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, table);
  };

  return (
    <div
      onDragOver={(e) => {
        onDragOver(e);
        e.preventDefault();
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-56 ${statusColor} ${
        isDragOver ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-50 scale-[1.02]' : ''
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{table.name}</h3>
            <p className="text-xs text-slate-500 font-medium">Capacity: {table.capacity} Seats</p>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {isOccupied ? (remainingMs <= 300000 ? 'Almost Free' : 'Occupied') : 'Available'}
          </span>
        </div>

        {isOccupied ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                <Coffee className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{activeCustomer.name}</p>
                <p className="text-xs text-slate-500">Party of {activeCustomer.party_size}</p>
              </div>
            </div>

            {/* Live Progress Bar */}
            {activeCustomer.started_at && activeCustomer.ended_at && (
              <div className="w-full">
                <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-1">
                  <span>Progress</span>
                  <span className="font-semibold text-slate-600">{formattedTime} left</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      remainingMs <= 300000 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (remainingMs /
                          (new Date(activeCustomer.ended_at).getTime() -
                            new Date(activeCustomer.started_at).getTime())) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 group-hover:border-slate-300 transition-all duration-300">
            <UserCheck className="w-6 h-6 mb-1 text-slate-400 group-hover:text-slate-500" />
            <p className="text-xs">Drag queue customer here</p>
          </div>
        )}
      </div>

      {isOccupied && (
        <button
          onClick={() => onServe(activeCustomer.id)}
          disabled={isServePending}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-xl shadow-sm transition-all duration-200 text-xs disabled:opacity-50"
        >
          <UserMinus className="w-4 h-4" />
          <span>Complete Meal</span>
        </button>
      )}
    </div>
  );
}

interface TableGridProps {
  tables: Table[];
  onManualSeatError: (message: string) => void;
}

export default function TableGrid({ tables, onManualSeatError }: TableGridProps) {
  const [now, setNow] = useState(Date.now());
  const serveMutation = useServeMutation();
  const seatMutation = useSeatMutation();

  // Tick the clock every second to update countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, table: Table) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;

      const customer: Customer = JSON.parse(dataStr);
      
      // Perform frontend validation
      if (customer.party_size > table.capacity) {
        onManualSeatError(`Cannot seat party of ${customer.party_size} at ${table.name} (Max capacity: ${table.capacity})`);
        return;
      }

      await seatMutation.mutateAsync({
        customer_id: customer.id,
        table_id: table.id,
      });
    } catch (err: any) {
      onManualSeatError(err.message || 'Failed to seat customer');
    }
  };

  const handleServe = async (customerId: number) => {
    try {
      await serveMutation.mutateAsync(customerId);
    } catch (err: any) {
      onManualSeatError(err.message || 'Failed to complete customer');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>Restaurant Floor</span>
            <Flame className="w-5 h-5 text-sky-500" />
          </h2>
          <p className="text-xs text-slate-500">Interactive live dining status & layout</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            now={now}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onServe={handleServe}
            isServePending={serveMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}
