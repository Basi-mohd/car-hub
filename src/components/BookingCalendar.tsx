import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { bookingService, customerService, vehicleService } from '@/lib/services';
import { Booking, Customer, Vehicle } from '@/types';
import { CalendarIcon, Clock, Plus, CreditCard, Wallet, Smartphone, Loader2, UserPlus, Car } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM'
];

const SERVICE_TYPES = [
  { name: 'Basic Wash', price: 25 },
  { name: 'Premium Wash', price: 45 },
  { name: 'Deluxe Wash & Wax', price: 65 },
  { name: 'Interior Detailing', price: 85 },
  { name: 'Full Service', price: 120 },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'mobile-payment', label: 'Mobile Payment', icon: Smartphone },
];

const STATUS_COLORS = {
  'scheduled': 'bg-blue-500',
  'in-progress': 'bg-yellow-500',
  'completed': 'bg-green-500',
  'paid': 'bg-emerald-500',
};

export default function BookingCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerSubmitting, setCustomerSubmitting] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    serviceType: '',
    timeSlot: '',
    paymentMethod: '',
  });

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_plate: '',
  });

  const [vehicleFormData, setVehicleFormData] = useState({
    make: '',
    model: '',
    plate: '',
    year: '',
    color: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [bookingsData, customersData, vehiclesData] = await Promise.all([
          bookingService.getAll(),
          customerService.getAll(),
          vehicleService.getAll()
        ]);
        setBookings(bookingsData);
        setCustomers(customersData);
        setVehicles(vehiclesData);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const dayBookings = bookings.filter(b => 
    new Date(b.date).toDateString() === selectedDate.toDateString()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const customer = customers.find(c => c.id === formData.customerId);
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    const service = SERVICE_TYPES.find(s => s.name === formData.serviceType);
    
    if (!customer || !vehicle || !service) return;

    try {
      setSubmitting(true);
      
      await bookingService.create({
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        customer_name: customer.name,
        vehicle_info: `${vehicle.make} ${vehicle.model} - ${vehicle.plate}`,
        service_type: service.name,
        date: selectedDate.toISOString(),
        time_slot: formData.timeSlot,
        status: formData.paymentMethod ? 'paid' : 'scheduled',
        price: service.price,
        payment_method: formData.paymentMethod as Booking['payment_method'],
      });

      const updatedBookings = await bookingService.getAll();
      setBookings(updatedBookings);
      setIsDialogOpen(false);
      setFormData({ customerId: '', vehicleId: '', serviceType: '', timeSlot: '', paymentMethod: '' });
      
      toast({
        title: 'Booking Created',
        description: `Appointment scheduled for ${customer.name} at ${formData.timeSlot}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create booking',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await bookingService.update(bookingId, { status: newStatus });
      const updatedBookings = await bookingService.getAll();
      setBookings(updatedBookings);
      toast({
        title: 'Status Updated',
        description: 'Booking status has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
        variant: 'destructive',
      });
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setCustomerSubmitting(true);
      
      const newCustomer = await customerService.create(customerFormData);
      setCustomers(prev => [newCustomer, ...prev]);
      
      if (customerFormData.vehicle_make && customerFormData.vehicle_model && customerFormData.vehicle_plate) {
        const newVehicle = await vehicleService.create({
          customer_id: newCustomer.id,
          make: customerFormData.vehicle_make,
          model: customerFormData.vehicle_model,
          plate: customerFormData.vehicle_plate,
        });
        setVehicles(prev => [newVehicle, ...prev]);
        setFormData(prev => ({ ...prev, customerId: newCustomer.id, vehicleId: newVehicle.id }));
      } else {
        setFormData(prev => ({ ...prev, customerId: newCustomer.id }));
      }
      
      setIsCustomerDialogOpen(false);
      setCustomerFormData({
        name: '',
        email: '',
        phone: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate: '',
      });
      
      toast({
        title: 'Customer Added',
        description: 'New customer has been added and selected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create customer',
        variant: 'destructive',
      });
    } finally {
      setCustomerSubmitting(false);
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) return;

    try {
      setVehicleSubmitting(true);
      
      const newVehicle = await vehicleService.create({
        customer_id: formData.customerId,
        make: vehicleFormData.make,
        model: vehicleFormData.model,
        plate: vehicleFormData.plate,
        year: vehicleFormData.year ? parseInt(vehicleFormData.year) : undefined,
        color: vehicleFormData.color || undefined,
      });
      
      setVehicles(prev => [newVehicle, ...prev]);
      setFormData(prev => ({ ...prev, vehicleId: newVehicle.id }));
      setIsVehicleDialogOpen(false);
      setVehicleFormData({
        make: '',
        model: '',
        plate: '',
        year: '',
        color: '',
      });
      
      toast({
        title: 'Vehicle Added',
        description: 'New vehicle has been added and selected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create vehicle',
        variant: 'destructive',
      });
    } finally {
      setVehicleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking Calendar</h2>
          <p className="text-muted-foreground">Schedule and manage Car Hub appointments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Schedule an appointment for {format(selectedDate, 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={formData.customerId} onValueChange={(value) => {
                  if (value === 'add-customer') {
                    setIsCustomerDialogOpen(true);
                  } else {
                    setFormData({ ...formData, customerId: value });
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.vehicle_plate}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-customer" className="text-primary">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add New Customer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.customerId && (
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={formData.vehicleId} onValueChange={(value) => {
                    if (value === 'add-vehicle') {
                      setIsVehicleDialogOpen(true);
                    } else {
                      setFormData({ ...formData, vehicleId: value });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles
                        .filter(v => v.customer_id === formData.customerId)
                        .map(vehicle => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} - {vehicle.plate}
                          </SelectItem>
                        ))}
                      <SelectItem value="add-vehicle" className="text-primary">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Vehicle
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(service => (
                      <SelectItem key={service.name} value={service.name}>
                        {service.name} - ₹{service.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select value={formData.timeSlot} onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method (Optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: formData.paymentMethod === method.value ? '' : method.value })}
                        className={`flex flex-col items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                          formData.paymentMethod === method.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Select if payment is made at booking time</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointments for {format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
            <CardDescription>
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading bookings...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {dayBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookings for this date</p>
                  </div>
                ) : (
                  dayBookings
                    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-16 rounded-full ${STATUS_COLORS[booking.status]}`} />
                          <div>
                            <div className="font-semibold">#{booking.booking_number} · {booking.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{booking.vehicle_info}</div>
                            <div className="text-sm text-muted-foreground">{booking.service_type}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">{booking.time_slot}</span>
                              <span className="text-sm font-medium">₹{booking.price}</span>
                              {booking.payment_method && (
                                <Badge variant="outline" className="text-xs">
                                  {booking.payment_method.replace('-', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value as Booking['status'])}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer to add to your booking
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Full Name</Label>
              <Input
                id="customer-name"
                value={customerFormData.name}
                onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerFormData.email}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customerFormData.phone}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Information
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Make (e.g., Toyota)"
                  value={customerFormData.vehicle_make}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, vehicle_make: e.target.value })}
                  required
                />
                <Input
                  placeholder="Model (e.g., Camry)"
                  value={customerFormData.vehicle_model}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, vehicle_model: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-plate">License Plate</Label>
              <Input
                id="customer-plate"
                value={customerFormData.vehicle_plate}
                onChange={(e) => setCustomerFormData({ ...customerFormData, vehicle_plate: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={customerSubmitting}>
                {customerSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription>
              Add a new vehicle for the selected customer
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Information
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Make (e.g., Toyota)"
                  value={vehicleFormData.make}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, make: e.target.value })}
                  required
                />
                <Input
                  placeholder="Model (e.g., Camry)"
                  value={vehicleFormData.model}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="License Plate"
                  value={vehicleFormData.plate}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, plate: e.target.value.toUpperCase() })}
                  required
                />
                <Input
                  placeholder="Year (optional)"
                  type="number"
                  value={vehicleFormData.year}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, year: e.target.value })}
                />
                <Input
                  placeholder="Color (optional)"
                  value={vehicleFormData.color}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={vehicleSubmitting}>
                {vehicleSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Vehicle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}