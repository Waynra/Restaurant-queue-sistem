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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      {/* Decorative gradient overlay */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-all duration-500 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Customer Arrival</h2>
          <p className="text-xs text-slate-500">Welcome a new party and assign a table</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="customer-name" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Customer Name
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Enter customer name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={arriveMutation.isPending}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-200"
          />
        </div>

        <div>
          <label htmlFor="party-size" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
              className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-32 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all duration-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              {[2, 4, 6, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPartySize(size.toString())}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                    partySize === size.toString()
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-600'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {arriveMutation.isSuccess && !error && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
            {arriveMutation.data?.message || 'Success!'}
          </div>
        )}

        <button
          type="submit"
          disabled={arriveMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-sky-500/10 hover:shadow-sky-500/25 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
