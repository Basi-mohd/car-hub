export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_plate: string;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  service_type: string;
  date: string;
  time_slot: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'paid';
  price: number;
  payment_method?: 'cash' | 'credit-card' | 'mobile-payment';
}

export interface DailySummary {
  date: Date;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
}
