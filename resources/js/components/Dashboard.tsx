import React, { useState } from 'react';
import { useRestaurantStatus } from '../hooks/useQueueQuery';
import ArrivalForm from './ArrivalForm';
import TableGrid from './TableGrid';
import QueueList from './QueueList';
import HistorySection from './HistorySection';
import { UtensilsCrossed, RefreshCw, AlertTriangle, Play, ShieldAlert, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useRestaurantStatus();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-slate-900">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
          <UtensilsCrossed className="w-6 h-6 text-sky-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-600">Loading system status...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl max-w-md text-center space-y-3 shadow-md">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Failed to load system</h2>
          <p className="text-xs text-slate-500">There was an error communicating with the Laravel backend. Make sure your server is running and the database is configured.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.98]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalTables = data.tables.length;
  const occupiedTables = data.tables.filter((t) => t.status === 'occupied').length;
  const availableTables = totalTables - occupiedTables;
  const waitingCount = data.waiting_queue.length;

  const totalCapacity = data.tables.reduce((sum, t) => sum + t.capacity, 0);
  const seatedPeople = data.tables.reduce((sum, t) => {
    return sum + (t.status === 'occupied' && t.active_customer ? t.active_customer.party_size : 0);
  }, 0);
  const capacityPercent = Math.round((seatedPeople / totalCapacity) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-x-hidden">
      {/* Premium Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-sky-600 text-white rounded-xl shadow-lg shadow-sky-500/20">
            <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                Gourmet Queue
              </h1>
              <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20">
                <Sparkles className="w-2.5 h-2.5" /> LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Restaurant Queue & Table Management System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden sm:inline">Server Sync Status: <strong className="text-emerald-500 font-semibold">Active</strong></span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4.5 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Occupancy Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{capacityPercent}%</span>
              <span className="text-[10px] text-slate-500 font-medium">({seatedPeople}/{totalCapacity} guests)</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, capacityPercent)}%` }} 
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4.5 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Waiting Queue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-sky-500">{waitingCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">parties waiting</span>
            </div>
            <p className="text-[9px] text-slate-400">Prioritized by party size</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4.5 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Seated</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-500">{occupiedTables}</span>
              <span className="text-[10px] text-slate-500 font-medium">/ {totalTables} tables</span>
            </div>
            <p className="text-[9px] text-slate-400">Eating duration counts live</p>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4.5 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Available Tables</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-500">{availableTables}</span>
              <span className="text-[10px] text-slate-500 font-medium">tables ready</span>
            </div>
            <p className="text-[9px] text-slate-400">Click & drag to seat manually</p>
          </div>
        </div>

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          {/* Floor & History (Left 7 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            <TableGrid 
              tables={data.tables} 
              onManualSeatError={triggerToast} 
            />
            <HistorySection />
          </div>

          {/* Queues & Arrivals (Right 3 Columns) */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-[90px]">
            <ArrivalForm />
            <QueueList queue={data.waiting_queue} />
          </div>
        </div>
      </main>

      {/* Premium Toast Notification System */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3.5 rounded-2xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-1 bg-rose-500/10 rounded-lg text-rose-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Seating Error</h4>
            <p className="text-[11px] text-rose-700 mt-1 font-medium leading-relaxed">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
