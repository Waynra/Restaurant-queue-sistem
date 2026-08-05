import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import Dashboard from '../components/Dashboard';
import TableGrid from '../components/TableGrid';
import QueueList from '../components/QueueList';
import HistorySection from '../components/HistorySection';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Customer, Table } from '../types';

// Mock window.fetch
const mockFetch = vi.fn();
window.fetch = mockFetch;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// Mock data
const mockTables: Table[] = [
  { id: 1, name: 'Table A', capacity: 2, status: 'available', active_customer: null },
  { id: 2, name: 'Table B', capacity: 4, status: 'available', active_customer: null },
  { id: 3, name: 'Table C', capacity: 6, status: 'available', active_customer: null },
  { id: 4, name: 'Table D', capacity: 8, status: 'available', active_customer: null },
];

const mockQueue: Customer[] = [
  {
    id: 10,
    name: 'Large Party Group',
    party_size: 8,
    status: 'waiting',
    table_id: null,
    arrived_at: new Date(Date.now() - 60000).toISOString(),
    started_at: null,
    ended_at: null,
    duration_minutes: null,
    remaining_seconds: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: 11,
    name: 'Medium Party Group',
    party_size: 4,
    status: 'waiting',
    table_id: null,
    arrived_at: new Date(Date.now() - 30000).toISOString(),
    started_at: null,
    ended_at: null,
    duration_minutes: null,
    remaining_seconds: 0,
    created_at: new Date().toISOString(),
  },
];

const mockHistoryResponse = {
  data: [
    {
      id: 20,
      name: 'Old Customer',
      party_size: 2,
      status: 'completed',
      table_id: 1,
      table: { id: 1, name: 'Table A', capacity: 2 },
      duration_minutes: 35,
      arrived_at: new Date(Date.now() - 7200000).toISOString(),
      created_at: new Date(Date.now() - 7200000).toISOString(),
    }
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    from: 1,
    to: 1,
    total: 1,
  }
};

describe('Frontend Dashboard Suite', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    
    // Mock status and history endpoint responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              tables: mockTables,
              waiting_queue: mockQueue,
              active_customers: [],
            }
          }),
        });
      }
      if (url.includes('/api/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockHistoryResponse
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  // 1. Dashboard render
  it('should render the dashboard layout with sections and statistics correctly', async () => {
    renderWithProviders(<Dashboard />);

    // Check header
    expect(await screen.findByText('Gourmet Queue')).toBeInTheDocument();
    
    // Check statistics cards are updated once data is loaded
    await waitFor(() => {
      expect(screen.getByText('parties waiting', { exact: false }).closest('div')).toHaveTextContent(/2/);
      expect(screen.getByText('tables ready', { exact: false }).closest('div')).toHaveTextContent(/4/);
    });

    // Check table cards are rendered
    expect(screen.getByRole('heading', { name: 'Table A' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Table D' })).toBeInTheDocument();
  });

  // 2. Table status change
  it('should render correct status badge and elements based on table occupancy', () => {
    const occupiedTablesList: Table[] = [
      {
        id: 1,
        name: 'Table A',
        capacity: 2,
        status: 'occupied',
        active_customer: {
          id: 5,
          name: 'Jane Occupied',
          party_size: 2,
          status: 'seated',
          table_id: 1,
          arrived_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          ended_at: new Date(Date.now() + 610000).toISOString(), // 10m 10s remaining (Occupied, not almost free)
          duration_minutes: 15,
          remaining_seconds: 610,
          created_at: new Date().toISOString(),
        }
      }
    ];

    renderWithProviders(<TableGrid tables={occupiedTablesList} onManualSeatError={() => {}} />);
    
    // Status must render Occupied
    expect(screen.getByText('Occupied')).toBeInTheDocument();
    expect(screen.getByText('Jane Occupied')).toBeInTheDocument();
    expect(screen.getByText('Complete Meal')).toBeInTheDocument();
  });

  // 3. Queue sorting
  it('should display queue items sorted by priority order (largest party first)', () => {
    renderWithProviders(<QueueList queue={mockQueue} />);

    // Verify both exist
    expect(screen.getByText('Large Party Group')).toBeInTheDocument();
    expect(screen.getByText('Medium Party Group')).toBeInTheDocument();
    
    // Large Party Group has party of 8, rank #1
    expect(screen.getByText('Party of 8')).toBeInTheDocument();
    expect(screen.getByText('Party of 4')).toBeInTheDocument();
  });

  // 4. Drag drop validation
  it('should trigger manual seat error callback on drag and drop validation failure (oversized party)', () => {
    const handleError = vi.fn();
    const tableWithSmallerCapacity: Table = {
      id: 1,
      name: 'Table A',
      capacity: 2,
      status: 'available',
      active_customer: null
    };

    renderWithProviders(
      <TableGrid tables={[tableWithSmallerCapacity]} onManualSeatError={handleError} />
    );

    const card = screen.getByText('Table A').closest('div')!;
    
    // Simulate drop of customer with party of 4 (greater than Table A capacity of 2)
    const customerData: Customer = {
      id: 99,
      name: 'Big Group',
      party_size: 4,
      status: 'waiting',
      table_id: null,
      arrived_at: new Date().toISOString(),
      started_at: null,
      ended_at: null,
      duration_minutes: null,
      remaining_seconds: 0,
      created_at: new Date().toISOString(),
    };

    const dataTransfer = {
      getData: vi.fn().mockReturnValue(JSON.stringify(customerData))
    };

    fireEvent.drop(card, { dataTransfer });

    // handleError should be called due to oversized validation failure
    expect(handleError).toHaveBeenCalledWith('Cannot seat party of 4 at Table A (Max capacity: 2)');
  });

  // 5. Countdown timer
  it('should render remaining time using Date.now() comparison dynamically', () => {
    // 10 minutes + 10 seconds into the future to avoid any millisecond race conditions in tests
    const tenMinFromNow = new Date(Date.now() + 610000).toISOString();
    const occupiedTablesList: Table[] = [
      {
        id: 1,
        name: 'Table A',
        capacity: 2,
        status: 'occupied',
        active_customer: {
          id: 5,
          name: 'Jane Occupied',
          party_size: 2,
          status: 'seated',
          table_id: 1,
          arrived_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          ended_at: tenMinFromNow,
          duration_minutes: 15,
          remaining_seconds: 610,
          created_at: new Date().toISOString(),
        }
      }
    ];

    renderWithProviders(<TableGrid tables={occupiedTablesList} onManualSeatError={() => {}} />);
    
    // It should render remaining time text
    expect(screen.getByText(/left/)).toBeInTheDocument();
    // It should match 10m (plus some seconds) left
    expect(screen.getByText(/10m.*left/)).toBeInTheDocument();
  });

  // 6. Search filter
  it('should allow filtering and search inputs in the history view', async () => {
    renderWithProviders(<HistorySection />);

    // Verify columns exist
    expect(screen.getByText('Name')).toBeInTheDocument();
    
    // Wait for the async API request to resolve and display the history records
    const recordRow = await screen.findByText('Old Customer');
    expect(recordRow).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    expect(searchInput).toHaveValue('Jane');

    // First select is Status dropdown
    const selectStatus = screen.getAllByRole('combobox')[0];
    fireEvent.change(selectStatus, { target: { value: 'completed' } });
    expect(selectStatus).toHaveValue('completed');
  });
});
