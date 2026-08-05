import React from 'react';
import { useHistoryQuery } from '../hooks/useQueueQuery';
import { useQueueStore } from '../store/useQueueStore';
import { 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar,
  X 
} from 'lucide-react';

export default function HistorySection() {
  const {
    historySearch,
    historyStatusFilter,
    historyPartySizeFilter,
    historyPage,
    historySortBy,
    historySortOrder,
    setHistorySearch,
    setHistoryStatusFilter,
    setHistoryPartySizeFilter,
    setHistoryPage,
    setHistorySort,
    resetFilters
  } = useQueueStore();

  const { data, isLoading, error, refetch, isFetching } = useHistoryQuery({
    search: historySearch,
    status: historyStatusFilter,
    party_size: historyPartySizeFilter,
    page: historyPage,
    sort_by: historySortBy,
    sort_order: historySortOrder,
  });

  const handleSort = (column: string) => {
    if (historySortBy === column) {
      // Toggle order
      setHistorySort(column, historySortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to desc for date, asc for others
      setHistorySort(column, column === 'date' ? 'desc' : 'asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setHistoryPage(newPage);
  };

  const renderSortIcon = (column: string) => {
    if (historySortBy === column) {
      return (
        <span className="ml-1 text-indigo-400">
          {historySortOrder === 'asc' ? '▲' : '▼'}
        </span>
      );
    }
    return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-slate-500 hover:text-slate-300" />;
  };

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'seated':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const hasActiveFilters = historySearch || historyStatusFilter || historyPartySizeFilter;

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Customer Log History</span>
            <Calendar className="w-5 h-5 text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-400">View and audit historical dining transactions</p>
        </div>

        {/* Filters Header Actions */}
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-4 border border-slate-800/50 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={historyStatusFilter}
            onChange={(e) => setHistoryStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="waiting">Waiting</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <select
            value={historyPartySizeFilter}
            onChange={(e) => setHistoryPartySizeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Party Sizes</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
              <option key={size} value={size}>Party of {size}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/20">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider">
              <th onClick={() => handleSort('name')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Name {renderSortIcon('name')}</span>
              </th>
              <th onClick={() => handleSort('party')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Party {renderSortIcon('party')}</span>
              </th>
              <th onClick={() => handleSort('table')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Table {renderSortIcon('table')}</span>
              </th>
              <th onClick={() => handleSort('duration')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Duration {renderSortIcon('duration')}</span>
              </th>
              <th onClick={() => handleSort('status')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Status {renderSortIcon('status')}</span>
              </th>
              <th onClick={() => handleSort('date')} className="px-4 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                <span className="flex items-center">Date {renderSortIcon('date')}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium bg-slate-950/5">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Loading logs...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rose-400 font-medium bg-rose-500/5 border border-dashed border-rose-500/20">
                  Failed to load logs.
                </td>
              </tr>
            ) : !data || data.data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-medium">
                  No records found matching filters.
                </td>
              </tr>
            ) : (
              data.data.map((record) => (
                <tr key={record.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-200">{record.name}</td>
                  <td className="px-4 py-3 text-slate-300">{record.party_size} people</td>
                  <td className="px-4 py-3 text-slate-350 font-semibold">{record.table_id ? record.table?.name || `Table ID: ${record.table_id}` : '-'}</td>
                  <td className="px-4 py-3 text-slate-400">{record.duration_minutes ? `${record.duration_minutes} min` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-medium">{formatDateTime(record.arrived_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data && data.meta && data.meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400 font-medium">
            Showing <strong className="text-slate-300">{data.meta.from || 0}</strong> to{' '}
            <strong className="text-slate-300">{data.meta.to || 0}</strong> of{' '}
            <strong className="text-slate-300">{data.meta.total}</strong> results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(historyPage - 1)}
              disabled={historyPage === 1}
              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-300 font-bold px-3">
              Page {data.meta.current_page} of {data.meta.last_page}
            </div>
            <button
              onClick={() => handlePageChange(historyPage + 1)}
              disabled={historyPage === data.meta.last_page}
              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
