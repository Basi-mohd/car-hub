import { Customer, Booking } from '@/types';
import { supabase } from './supabase';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string): Promise<Customer | undefined> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  },
  
  create: async (customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id: string, updates: Partial<Customer>): Promise<Customer | undefined> => {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  },
  
  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
};

export const bookingService = {
  getAll: async (): Promise<Booking[]> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  getById: async (id: string): Promise<Booking | undefined> => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  },
  
  getByDate: async (date: string): Promise<Booking[]> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString())
      .order('time_slot', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },
  
  create: async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  update: async (id: string, updates: Partial<Booking>): Promise<Booking | undefined> => {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data;
  },
  
  delete: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  getDailySummary: async (date: string) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString());
    
    if (error) throw error;
    
    const dayBookings = data || [];
    
    return {
      date: new Date(date),
      totalBookings: dayBookings.length,
      completedBookings: dayBookings.filter(b => 
        b.status === 'completed' || b.status === 'paid'
      ).length,
      revenue: dayBookings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.price, 0),
    };
  },
};