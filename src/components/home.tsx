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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Car Wash Manager
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[750px] h-auto p-1">
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
            <TabsTrigger value="admins" className="flex items-center gap-2 py-3">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admins</span>
            </TabsTrigger>
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

          <TabsContent value="admins" className="space-y-4">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </div>
  );
}