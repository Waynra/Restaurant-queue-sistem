import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer, Table, PaginatedResponse } from '../types';

// Helper to fetch status
const fetchStatus = async (): Promise<{
  tables: Table[];
  waiting_queue: Customer[];
  active_customers: Customer[];
}> => {
  const response = await fetch('/api/status');
  if (!response.ok) {
    throw new Error('Failed to fetch restaurant status');
  }
  const result = await response.json();
  return result.data;
};

// Helper to fetch history
const fetchHistory = async (params: {
  search: string;
  status: string;
  party_size: string;
  page: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}): Promise<PaginatedResponse<Customer>> => {
  const queryParams = new URLSearchParams({
    search: params.search,
    status: params.status,
    party_size: params.party_size,
    page: params.page.toString(),
    sort_by: params.sort_by,
    sort_order: params.sort_order,
  });
  
  const response = await fetch(`/api/history?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch history logs');
  }
  const result = await response.json();
  return result.data;
};

export const useRestaurantStatus = () => {
  return useQuery({
    queryKey: ['restaurant-status'],
    queryFn: fetchStatus,
    refetchInterval: 5000, // auto refetch every 5s
  });
};

export const useHistoryQuery = (filters: {
  search: string;
  status: string;
  party_size: string;
  page: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}) => {
  return useQuery({
    queryKey: ['history', filters],
    queryFn: () => fetchHistory(filters),
  });
};

export const useArriveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; party_size: number }) => {
      const response = await fetch('/api/arrive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Validation error');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-status'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
};

export const useServeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customerId: number) => {
      const response = await fetch(`/api/serve/${customerId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error serving customer');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-status'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
};

export const useSeatMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { customer_id: number; table_id: number }) => {
      const response = await fetch('/api/seat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Error seating customer');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-status'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
};
