import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface Admin {
  id: string;
  phone: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAdmin = localStorage.getItem('admin');
        if (storedAdmin) {
          const adminData = JSON.parse(storedAdmin);
          setAdmin(adminData);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      console.log('Attempting login with:', { phone, password });

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('phone', phone)
        .eq('password', password)
        .eq('is_active', true)
        .single();

      console.log('Database response:', { data, error });

      if (error) {
        console.error('Database error:', error);
        return { success: false, error: `Database error: ${error.message}` };
      }

      if (!data) {
        console.log('No admin found with provided credentials');
        return { success: false, error: 'Invalid phone number or password' };
      }

      const adminData: Admin = {
        id: data.id,
        phone: data.phone,
        name: data.name,
        role: data.role,
        is_active: data.is_active,
      };

      console.log('Setting admin data:', adminData);

      setAdmin(adminData);
      localStorage.setItem('admin', JSON.stringify(adminData));

      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin');
  };

  const value: AuthContextType = {
    admin,
    loading,
    login,
    logout,
    isAuthenticated: !!admin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
