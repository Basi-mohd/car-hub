import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { bookingService } from '@/lib/services';
import { Booking } from '@/types';
import { CreditCard, Wallet, Smartphone, IndianRupee, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'mobile-payment', label: 'Mobile Payment', icon: Smartphone },
];

export default function PaymentProcessing() {
  const [bookings, setBookings] = useState<Booking[]>(bookingService.getAll());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const pendingPayments = bookings.filter(b => b.status === 'completed');
  const paidBookings = bookings.filter(b => b.status === 'paid');

  const handleProcessPayment = () => {
    if (!selectedBooking || !paymentMethod) return;

    bookingService.update(selectedBooking.id, {
      status: 'paid',
      paymentMethod: paymentMethod as Booking['paymentMethod'],
    });

    setBookings(bookingService.getAll());
    setIsDialogOpen(false);
    setSelectedBooking(null);
    setPaymentMethod('');

    toast({
      title: 'Payment Processed',
      description: `Payment of ₹${selectedBooking.price} received via ${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}`,
    });
  };

  const openPaymentDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment Processing</h2>
        <p className="text-muted-foreground">Process payments and view transaction history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              ₹{pendingPayments.reduce((sum, b) => sum + b.price, 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              ₹{paidBookings.reduce((sum, b) => sum + b.price, 0)} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{bookings.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.price, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>Completed services awaiting payment</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending payments</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.customerName}</TableCell>
                    <TableCell>{booking.serviceType}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{booking.date.toLocaleDateString()}</div>
                        <div className="text-muted-foreground">{booking.timeSlot}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-lg">₹{booking.price}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => openPaymentDialog(booking)}>
                        Process Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent completed transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {paidBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment history yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidBookings.slice(0, 10).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.customerName}</TableCell>
                    <TableCell>{booking.serviceType}</TableCell>
                    <TableCell>{booking.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {booking.paymentMethod?.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">₹{booking.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete payment for {selectedBooking?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service</span>
                <span className="font-medium">{selectedBooking?.serviceType}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Amount Due</span>
                <span className="text-2xl font-bold">₹{selectedBooking?.price}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                        paymentMethod === method.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessPayment} disabled={!paymentMethod}>
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
