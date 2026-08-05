import { create } from 'zustand';

interface QueueState {
  // History search and filters
  historySearch: string;
  historyStatusFilter: string;
  historyPartySizeFilter: string;
  historyPage: number;
  historySortBy: string;
  historySortOrder: 'asc' | 'desc';
  
  // Setters
  setHistorySearch: (search: string) => void;
  setHistoryStatusFilter: (status: string) => void;
  setHistoryPartySizeFilter: (size: string) => void;
  setHistoryPage: (page: number) => void;
  setHistorySort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  historySearch: '',
  historyStatusFilter: '',
  historyPartySizeFilter: '',
  historyPage: 1,
  historySortBy: 'date',
  historySortOrder: 'desc',

  setHistorySearch: (search) => set({ historySearch: search, historyPage: 1 }),
  setHistoryStatusFilter: (status) => set({ historyStatusFilter: status, historyPage: 1 }),
  setHistoryPartySizeFilter: (size) => set({ historyPartySizeFilter: size, historyPage: 1 }),
  setHistoryPage: (page) => set({ historyPage: page }),
  setHistorySort: (sortBy, sortOrder) => set({ historySortBy: sortBy, historySortOrder: sortOrder }),
  resetFilters: () => set({
    historySearch: '',
    historyStatusFilter: '',
    historyPartySizeFilter: '',
    historyPage: 1,
    historySortBy: 'date',
    historySortOrder: 'desc',
  }),
}));
