import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { customerService, vehicleService } from '@/lib/services';
import { Customer, Vehicle } from '@/types';
import { Plus, Search, Edit, Trash2, Car, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerForVehicle, setSelectedCustomerForVehicle] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [vehicleDrafts, setVehicleDrafts] = useState<Array<{ make: string; model: string; plate: string; year: string; color: string }>>([
    { make: '', model: '', plate: '', year: '', color: '' }
  ]);
  const [vehicleModalFormData, setVehicleModalFormData] = useState({
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
        const [customersData, vehiclesData] = await Promise.all([
          customerService.getAll(),
          vehicleService.getAll()
        ]);
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
    });
    setVehicleDrafts([{ make: '', model: '', plate: '', year: '', color: '' }]);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      let customerId: string;
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, formData);
        customerId = editingCustomer.id;
        toast({
          title: 'Customer Updated',
          description: 'Customer information has been updated successfully.',
        });
      } else {
        const newCustomer = await customerService.create(formData);
        customerId = newCustomer.id;
        toast({
          title: 'Customer Added',
          description: 'New customer has been added successfully.',
        });
      }
      
      for (const v of vehicleDrafts) {
        if (v.make && v.model && v.plate) {
          await vehicleService.create({
            customer_id: customerId,
            make: v.make,
            model: v.model,
            plate: v.plate,
            year: v.year ? parseInt(v.year) : undefined,
            color: v.color || undefined,
          });
        }
      }
      
      const [updatedCustomers, updatedVehicles] = await Promise.all([
        customerService.getAll(),
        vehicleService.getAll()
      ]);
      setCustomers(updatedCustomers);
      setVehicles(updatedVehicles);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save customer',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await customerService.delete(id);
      const [updatedCustomers, updatedVehicles] = await Promise.all([
        customerService.getAll(),
        vehicleService.getAll()
      ]);
      setCustomers(updatedCustomers);
      setVehicles(updatedVehicles);
      toast({
        title: 'Customer Deleted',
        description: 'Customer has been removed from the system.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      await vehicleService.delete(vehicleId);
      const updatedVehicles = await vehicleService.getAll();
      setVehicles(updatedVehicles);
      toast({
        title: 'Vehicle Deleted',
        description: 'Vehicle has been removed from the system.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete vehicle',
        variant: 'destructive',
      });
    }
  };

  const handleAddVehicle = (customer: Customer) => {
    setSelectedCustomerForVehicle(customer);
    setVehicleModalFormData({ make: '', model: '', plate: '', year: '', color: '' });
    setIsVehicleDialogOpen(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomerForVehicle) return;

    try {
      setVehicleSubmitting(true);
      
      await vehicleService.create({
        customer_id: selectedCustomerForVehicle.id,
        make: vehicleModalFormData.make,
        model: vehicleModalFormData.model,
        plate: vehicleModalFormData.plate,
        year: vehicleModalFormData.year ? parseInt(vehicleModalFormData.year) : undefined,
        color: vehicleModalFormData.color || undefined,
      });
      
      const updatedVehicles = await vehicleService.getAll();
      setVehicles(updatedVehicles);
      setIsVehicleDialogOpen(false);
      setSelectedCustomerForVehicle(null);
      setVehicleModalFormData({ make: '', model: '', plate: '', year: '', color: '' });
      
      toast({
        title: 'Vehicle Added',
        description: 'New vehicle has been added successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add vehicle',
        variant: 'destructive',
      });
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const customerVehicles = vehicles.filter(v => v.customer_id === customer.id);
    const vehiclePlates = customerVehicles.map(v => v.plate).join(' ');
    
    return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehiclePlates.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage your Car Hub customers and their vehicles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? 'Update customer information' : 'Enter customer and vehicle details'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicles (Optional)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setVehicleDrafts((prev) => [...prev, { make: '', model: '', plate: '', year: '', color: '' }])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Row
                  </Button>
                </Label>

                <div className="space-y-3">
                  {vehicleDrafts.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        placeholder="Make"
                        value={v.make}
                        onChange={(e) => setVehicleDrafts((prev) => prev.map((row, i) => i === idx ? { ...row, make: e.target.value } : row))}
                        className="col-span-3"
                      />
                      <Input
                        placeholder="Model"
                        value={v.model}
                        onChange={(e) => setVehicleDrafts((prev) => prev.map((row, i) => i === idx ? { ...row, model: e.target.value } : row))}
                        className="col-span-3"
                      />
                      <Input
                        placeholder="Plate"
                        value={v.plate}
                        onChange={(e) => setVehicleDrafts((prev) => prev.map((row, i) => i === idx ? { ...row, plate: e.target.value.toUpperCase() } : row))}
                        className="col-span-3"
                      />
                      <Input
                        placeholder="Year"
                        type="number"
                        value={v.year}
                        onChange={(e) => setVehicleDrafts((prev) => prev.map((row, i) => i === idx ? { ...row, year: e.target.value } : row))}
                        className="col-span-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1"
                        onClick={() => setVehicleDrafts((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading customers...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const customerVehicles = vehicles.filter(v => v.customer_id === customer.id);
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.email}</div>
                            <div className="text-muted-foreground">{customer.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Vehicles ({customerVehicles.length})</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddVehicle(customer)}
                                className="h-6 px-2 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Vehicle
                              </Button>
                            </div>
                            {customerVehicles.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No vehicles</span>
                            ) : (
                              <div className="space-y-1">
                                {customerVehicles.map((vehicle) => (
                                  <div key={vehicle.id} className="flex items-center justify-between p-2 border rounded text-xs">
                                    <div>
                                      <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                                      <div className="text-muted-foreground">{vehicle.plate}</div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4"
                                      onClick={() => handleDeleteVehicle(vehicle.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(customer)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Vehicle</DialogTitle>
            <DialogDescription>
              Add a new vehicle for {selectedCustomerForVehicle?.name}
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
                  value={vehicleModalFormData.make}
                  onChange={(e) => setVehicleModalFormData({ ...vehicleModalFormData, make: e.target.value })}
                  required
                />
                <Input
                  placeholder="Model (e.g., Camry)"
                  value={vehicleModalFormData.model}
                  onChange={(e) => setVehicleModalFormData({ ...vehicleModalFormData, model: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="License Plate"
                  value={vehicleModalFormData.plate}
                  onChange={(e) => setVehicleModalFormData({ ...vehicleModalFormData, plate: e.target.value.toUpperCase() })}
                  required
                />
                <Input
                  placeholder="Year (optional)"
                  type="number"
                  value={vehicleModalFormData.year}
                  onChange={(e) => setVehicleModalFormData({ ...vehicleModalFormData, year: e.target.value })}
                />
                <Input
                  placeholder="Color (optional)"
                  value={vehicleModalFormData.color}
                  onChange={(e) => setVehicleModalFormData({ ...vehicleModalFormData, color: e.target.value })}
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
