import React, { useState } from 'react';
import { useArriveMutation } from '../hooks/useQueueQuery';
import { Users, Plus, Loader2 } from 'lucide-react';

export default function ArrivalForm() {
  const [name, setName] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [error, setError] = useState<string | null>(null);
  
  const arriveMutation = useArriveMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer name is required');
      return;
    }

    const size = parseInt(partySize, 10);
    if (isNaN(size) || size <= 0) {
      setError('Party size must be at least 1');
      return;
    }

    try {
      await arriveMutation.mutateAsync({ name: name.trim(), party_size: size });
      setName('');
      setPartySize('2');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Customer Arrival</h2>
          <p className="text-xs text-slate-400">Welcome a new party and assign a table</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Customer Name
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Enter customer name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={arriveMutation.isPending}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="party-size" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Party Size (Number of People)
          </label>
          <div className="relative">
            <input
              id="party-size"
              type="number"
              min="1"
              max="20"
              placeholder="e.g. 4"
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              disabled={arriveMutation.isPending}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all duration-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {[2, 4, 6, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size.toString())}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                    partySize === size.toString()
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
            {error}
          </div>
        )}

        {arriveMutation.isSuccess && !error && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
            {arriveMutation.data?.message || 'Success!'}
          </div>
        )}

        <button
          type="submit"
          disabled={arriveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          {arriveMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Welcoming Customer...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Welcome Customer</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
