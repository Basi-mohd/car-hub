import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import Dashboard from '@/components/Dashboard';
import CustomerManagement from '@/components/CustomerManagement';
import BookingCalendar from '@/components/BookingCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, Calendar, Sparkles, LogOut, Table as TableIcon, Shield } from 'lucide-react';
import AllBookings from '@/components/AllBookings';
import AdminManagement from '@/components/AdminManagement';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { admin, logout } = useAuth();

  const handleTabChange = (value: string) => {
    if (value === 'admins' && admin?.role !== 'superadmin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab(value);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                <img src="/logo-notext.png" alt="Care Hub Logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Care Hub Manager
                </h1>
                <p className="text-sm text-muted-foreground">Professional management system</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{admin?.name}</p>
                <p className="text-xs text-muted-foreground">{admin?.role}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className={`grid w-full ${admin?.role === 'superadmin' ? 'grid-cols-5' : 'grid-cols-4'} lg:w-[750px] h-auto p-1`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 py-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2 py-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="all-bookings" className="flex items-center gap-2 py-3">
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">All Bookings</span>
            </TabsTrigger>
            {admin?.role === 'superadmin' && (
              <TabsTrigger value="admins" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admins</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Dashboard />
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <BookingCalendar />
          </TabsContent>

          <TabsContent value="all-bookings" className="space-y-4">
            <AllBookings />
          </TabsContent>

          {admin?.role === 'superadmin' && (
            <TabsContent value="admins" className="space-y-4">
              <AdminManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}