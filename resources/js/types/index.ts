export interface Customer {
  id: number;
  name: string;
  party_size: number;
  status: 'waiting' | 'seated' | 'completed';
  table_id: number | null;
  arrived_at: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  remaining_seconds: number;
  created_at: string;
}

export interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied';
  active_customer: Customer | null;
}

export interface HistoryRecord {
  id: number;
  customer_id: number;
  customer?: Customer;
  table_id: number | null;
  table?: Table | null;
  action: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}
