import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { bookingService } from '@/lib/services';
import { Calendar, DollarSign, TrendingUp, Users, Clock, Loader2 } from 'lucide-react';
import { format, eachDayOfInterval, subDays, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Booking, DailySummary } from '@/types';

export default function Dashboard() {
  const [selectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [allBookings, dailySummary] = await Promise.all([
          bookingService.getAll(),
          bookingService.getDailySummary(selectedDate.toISOString().split('T')[0])
        ]);
        setBookings(allBookings);
        setSummary(dailySummary);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const todayBookings = bookings.filter(b => 
    new Date(b.date).toDateString() === selectedDate.toDateString()
  );

  const scheduledCount = todayBookings.filter(b => b.status === 'scheduled').length;
  const inProgressCount = todayBookings.filter(b => b.status === 'in-progress').length;
  const completedCount = todayBookings.filter(b => b.status === 'completed').length;
  const paidCount = todayBookings.filter(b => b.status === 'paid').length;

  const totalRevenue = bookings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.price, 0);

  const upcomingBookings = todayBookings
    .filter(b => b.status === 'scheduled')
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    .slice(0, 5);

  const paidBookings = bookings.filter(b => b.status === 'paid');
  const todayRevenue = paidBookings
    .filter(b => new Date(b.date).toDateString() === selectedDate.toDateString())
    .reduce((sum, b) => sum + b.price, 0);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthlyRevenue = paidBookings
    .filter(b => new Date(b.date) >= monthStart && new Date(b.date) <= monthEnd)
    .reduce((sum, b) => sum + b.price, 0);
  const monthlyCount = paidBookings
    .filter(b => new Date(b.date) >= monthStart && new Date(b.date) <= monthEnd).length;

  const last14Days = eachDayOfInterval({ start: subDays(selectedDate, 13), end: selectedDate });
  const last14Series = last14Days.map(d => {
    const value = paidBookings
      .filter(b => isSameDay(new Date(b.date), d))
      .reduce((sum, b) => sum + b.price, 0);
    return { date: d, value };
  });
  const maxSeriesValue = Math.max(1, ...last14Series.map(p => p.value));

  const recentPayments = [...paidBookings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview for {format(selectedDate, 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} completed & paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.revenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              From {paidCount} paid service{paidCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${todayRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    From paid bookings today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${monthlyRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    {monthlyCount} paid bookings this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    All time earnings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{paidBookings.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Total completed & paid
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>14-Day Revenue Trend</CardTitle>
                <CardDescription>Daily revenue from paid bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 h-32">
                  {last14Series.map(p => (
                    <div key={p.date.toISOString()} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${Math.max(4, Math.round((p.value / maxSeriesValue) * 100))}%` }}
                        title={`$${p.value} on ${format(p.date, 'MM/dd')}`}
                      />
                      <div className="text-[10px] text-muted-foreground">{format(p.date, 'd')}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest paid bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet</TableCell>
                      </TableRow>
                    ) : (
                      recentPayments.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="font-medium">{p.customer_name}</TableCell>
                          <TableCell>{p.service_type}</TableCell>
                          <TableCell>
                            {p.payment_method ? (
                              <Badge variant="outline" className="text-xs">{p.payment_method.replace('-', ' ')}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">${p.price}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Status</CardTitle>
                <CardDescription>Breakdown of booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Scheduled</span>
                    </div>
                    <span className="text-2xl font-bold">{scheduledCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <span className="text-2xl font-bold">{inProgressCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <span className="text-2xl font-bold">{completedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">Paid</span>
                    </div>
                    <span className="text-2xl font-bold">{paidCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Next scheduled services</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No upcoming appointments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{booking.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {booking.service_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{booking.time_slot}</div>
                          <div className="text-sm text-muted-foreground">${booking.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
