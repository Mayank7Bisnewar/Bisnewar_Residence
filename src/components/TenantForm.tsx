import React, { useState } from 'react';
import { User, Phone, Home, Droplets, IndianRupee, Contact } from 'lucide-react';
import { Contacts } from '@capacitor-community/contacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Tenant } from '@/types/tenant';

export interface TenantFormData {
    name: string;
    roomNumber: string;
    mobileNumber: string;
    joiningDate: string;
    monthlyRent: string;
    waterBill: string;
}

const emptyFormData: TenantFormData = {
    name: '',
    roomNumber: '',
    mobileNumber: '',
    joiningDate: new Date().toISOString().split('T')[0], // Default to today
    monthlyRent: '',
    waterBill: '',
};

export function TenantForm({
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
                joiningDate: initialData.joiningDate || new Date().toISOString().split('T')[0],
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
                    <User className="w-4 h-4 text-blue-500" />
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
                    <Home className="w-4 h-4 text-violet-500" />
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
                    <Phone className="w-4 h-4 text-emerald-500" />
                    Mobile Number (WhatsApp)
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                            +91
                        </span>
                        <Input
                            id="mobileNumber"
                            name="mobileNumber"
                            type="tel"
                            pattern="[0-9]*"
                            placeholder="10-digit mobile number"
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            className={cn("pl-11", errors.mobileNumber && 'border-destructive')}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                            try {
                                const permission = await Contacts.requestPermissions();
                                if (permission.contacts !== 'granted') return;

                                const result = await Contacts.pickContact({
                                    projection: {
                                        name: true,
                                        phones: true,
                                    },
                                });

                                if (result.contact) {
                                    let phone = '';
                                    if (result.contact.phones && result.contact.phones.length > 0) {
                                        phone = result.contact.phones[0].number?.replace(/\D/g, '').slice(-10) || '';
                                    }

                                    let name = formData.name;
                                    if (result.contact.name && !name) {
                                        name = result.contact.name.display || '';
                                    }

                                    setFormData(prev => ({
                                        ...prev,
                                        mobileNumber: phone,
                                        name: name
                                    }));
                                }
                            } catch (e) {
                                console.error("Error picking contact", e);
                            }
                        }}
                    >
                        <Contact className="w-4 h-4 text-emerald-600" />
                    </Button>
                </div>
                {errors.mobileNumber && <p className="text-sm text-destructive">{errors.mobileNumber}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="joiningDate" className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-rose-500" />
                    Joining Date
                </Label>
                <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="monthlyRent" className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-amber-500" />
                        Monthly Rent
                    </Label>
                    <Input
                        id="monthlyRent"
                        name="monthlyRent"
                        type="tel"
                        pattern="[0-9]*"
                        placeholder="₹0"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value.replace(/\D/g, '') })}
                        className={cn(errors.monthlyRent && 'border-destructive')}
                    />
                    {errors.monthlyRent && <p className="text-sm text-destructive">{errors.monthlyRent}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="waterBill" className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-sky-500" />
                        Water Bill
                    </Label>
                    <Input
                        id="waterBill"
                        name="waterBill"
                        type="tel"
                        pattern="[0-9]*"
                        placeholder="₹0"
                        value={formData.waterBill}
                        onChange={(e) => setFormData({ ...formData, waterBill: e.target.value.replace(/\D/g, '') })}
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
