import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Shield, Crown, Loader2, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Admin {
  id: string;
  phone: string;
  name: string;
  role: 'admin' | 'superadmin';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'admin' as 'admin' | 'superadmin',
    is_active: true,
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load admins',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      role: 'admin',
      is_active: true,
    });
    setEditingAdmin(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (editingAdmin) {
        const { error } = await supabase
          .from('admins')
          .update({
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAdmin.id);
        
        if (error) throw error;
        
        toast({
          title: 'Admin Updated',
          description: 'Admin information has been updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('admins')
          .insert([{
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            is_active: formData.is_active,
            otp: '123456',
            otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          }]);
        
        if (error) throw error;
        
        toast({
          title: 'Admin Added',
          description: 'New admin has been added successfully.',
        });
      }
      
      await loadAdmins();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save admin',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      phone: admin.phone,
      role: admin.role,
      is_active: admin.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadAdmins();
      toast({
        title: 'Admin Deleted',
        description: 'Admin has been removed from the system.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete admin',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      const { error } = await supabase
        .from('admins')
        .update({ 
          is_active: !admin.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);
      
      if (error) throw error;
      
      await loadAdmins();
      toast({
        title: 'Status Updated',
        description: `Admin ${!admin.is_active ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    return role === 'superadmin' ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return role === 'superadmin' ? 'bg-purple-500' : 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Management</h2>
          <p className="text-muted-foreground">Manage system administrators and their roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Add New Admin'}</DialogTitle>
              <DialogDescription>
                {editingAdmin ? 'Update admin information' : 'Enter admin details and role'}
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
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'superadmin' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="superadmin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Super Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAdmin ? 'Update' : 'Add'} Admin
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin List</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or role..."
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
              <span className="ml-2">Loading admins...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getRoleColor(admin.role)} text-white`}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(admin.role)}
                            {admin.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {admin.is_active ? (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserX className="h-4 w-4 text-red-500" />
                          )}
                          <span className={admin.is_active ? 'text-green-600' : 'text-red-600'}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.last_login ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(admin.last_login).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(admin)}
                            className="h-8 px-2"
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(admin)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(admin.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
