export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  description?: string;
  is_enquiry?: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  plate: string;
  year?: number;
  color?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_number: number;
  customer_id: string;
  vehicle_id: string;
  customer_name: string;
  vehicle_info: string;
  service_type: string;
  date: string;
  time_slot: string;
  status: 'in-progress' | 'completed' | 'paid';
  price: number;
  payment_method?: 'cash' | 'bank' | 'mobile-payment';
}

export interface DailySummary {
  date: Date;
  totalBookings: number;
  completedBookings: number;
  revenue: number;
}
