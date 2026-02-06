import React, { useState } from 'react';
import { Plus, User, Phone, Home, Droplets, IndianRupee, Pencil, Trash2, Check, X } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Tenant } from '@/types/tenant';

interface TenantFormData {
  name: string;
  roomNumber: string;
  mobileNumber: string;
  monthlyRent: string;
  waterBill: string;
}

const emptyFormData: TenantFormData = {
  name: '',
  roomNumber: '',
  mobileNumber: '',
  monthlyRent: '',
  waterBill: '',
};

function TenantForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  submitLabel = 'Add Tenant' 
}: { 
  initialData?: Tenant;
  onSubmit: (data: TenantFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [formData, setFormData] = useState<TenantFormData>(
    initialData 
      ? {
          name: initialData.name,
          roomNumber: initialData.roomNumber,
          mobileNumber: initialData.mobileNumber,
          monthlyRent: String(initialData.monthlyRent),
          waterBill: String(initialData.waterBill),
        }
      : emptyFormData
  );

  const [errors, setErrors] = useState<Partial<TenantFormData>>({});

  const validate = () => {
    const newErrors: Partial<TenantFormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
      newErrors.mobileNumber = 'Enter valid 10-digit number';
    }
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) < 0) {
      newErrors.monthlyRent = 'Enter valid rent amount';
    }
    if (!formData.waterBill || parseFloat(formData.waterBill) < 0) {
      newErrors.waterBill = 'Enter valid water bill';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Tenant Name
        </Label>
        <Input
          id="name"
          placeholder="Enter tenant name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(errors.name && 'border-destructive')}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomNumber" className="flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          Room / Flat Number
        </Label>
        <Input
          id="roomNumber"
          placeholder="e.g., Room 101"
          value={formData.roomNumber}
          onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobileNumber" className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          Mobile Number (WhatsApp)
        </Label>
        <Input
          id="mobileNumber"
          type="tel"
          placeholder="10-digit mobile number"
          value={formData.mobileNumber}
          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          className={cn(errors.mobileNumber && 'border-destructive')}
        />
        {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyRent" className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-muted-foreground" />
            Monthly Rent
          </Label>
          <Input
            id="monthlyRent"
            type="number"
            min="0"
            placeholder="₹0"
            value={formData.monthlyRent}
            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
            className={cn(errors.monthlyRent && 'border-destructive')}
          />
          {errors.monthlyRent && <p className="text-sm text-destructive">{errors.monthlyRent}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="waterBill" className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-muted-foreground" />
            Water Bill
          </Label>
          <Input
            id="waterBill"
            type="number"
            min="0"
            placeholder="₹0"
            value={formData.waterBill}
            onChange={(e) => setFormData({ ...formData, waterBill: e.target.value })}
            className={cn(errors.waterBill && 'border-destructive')}
          />
          {errors.waterBill && <p className="text-sm text-destructive">{errors.waterBill}</p>}
        </div>
      </div>

      <DialogFooter className="gap-2 pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" className="bg-primary hover:bg-primary-dark">
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TenantList() {
  const { tenants, addTenant, updateTenant, deleteTenant, selectedTenant, selectTenant } = useBilling();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const handleAddTenant = (data: TenantFormData) => {
    const newTenant = addTenant({
      name: data.name.trim(),
      roomNumber: data.roomNumber.trim(),
      mobileNumber: data.mobileNumber.trim(),
      monthlyRent: parseFloat(data.monthlyRent) || 0,
      waterBill: parseFloat(data.waterBill) || 0,
    });
    selectTenant(newTenant.id);
    setIsAddOpen(false);
  };

  const handleEditTenant = (data: TenantFormData) => {
    if (editingTenant) {
      updateTenant(editingTenant.id, {
        name: data.name.trim(),
        roomNumber: data.roomNumber.trim(),
        mobileNumber: data.mobileNumber.trim(),
        monthlyRent: parseFloat(data.monthlyRent) || 0,
        waterBill: parseFloat(data.waterBill) || 0,
      });
      setEditingTenant(null);
    }
  };

  const handleDeleteTenant = (id: string) => {
    if (selectedTenant?.id === id) {
      selectTenant(null);
    }
    deleteTenant(id);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Add Tenant Button */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2 bg-primary hover:bg-primary-dark h-12 text-base font-medium shadow-md">
            <Plus className="w-5 h-5" />
            Add New Tenant
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Tenant</DialogTitle>
          </DialogHeader>
          <TenantForm 
            onSubmit={handleAddTenant} 
            onCancel={() => setIsAddOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Tenant List */}
      {tenants.length === 0 ? (
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-8 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tenants added yet</p>
            <p className="text-sm text-muted-foreground">Add your first tenant to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id}
              className={cn(
                'shadow-card cursor-pointer transition-all duration-200 tap-highlight',
                selectedTenant?.id === tenant.id 
                  ? 'ring-2 ring-primary bg-primary-light' 
                  : 'hover:shadow-lg'
              )}
              onClick={() => selectTenant(tenant.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedTenant?.id === tenant.id && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground truncate">{tenant.name}</h3>
                    </div>
                    {tenant.roomNumber && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {tenant.roomNumber}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {tenant.mobileNumber}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-rent font-medium">₹{tenant.monthlyRent.toLocaleString()}/mo</span>
                      <span className="text-water font-medium">₹{tenant.waterBill} water</span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {/* Edit Dialog */}
                    <Dialog open={editingTenant?.id === tenant.id} onOpenChange={(open) => !open && setEditingTenant(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTenant(tenant);
                          }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                          <DialogTitle className="font-display text-xl">Edit Tenant</DialogTitle>
                        </DialogHeader>
                        <TenantForm 
                          initialData={tenant}
                          onSubmit={handleEditTenant}
                          onCancel={() => setEditingTenant(null)}
                          submitLabel="Save Changes"
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Tenant?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {tenant.name} and all their saved data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDeleteTenant(tenant.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
