import React from 'react';
import { Droplets, IndianRupee } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WaterBillTab() {
  const { selectedTenant } = useBilling();

  if (!selectedTenant) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenant selected</p>
            <p className="text-sm text-muted-foreground mt-1">Select a tenant from the Tenant tab first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-water to-sky-600 text-white pb-4">
          <CardTitle className="flex items-center gap-2 font-display">
            <Droplets className="w-5 h-5" />
            Water Bill
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Monthly Water Bill for {selectedTenant.name}</p>
            <div className="flex items-center justify-center gap-1 text-4xl font-bold text-water">
              <IndianRupee className="w-8 h-8" />
              <span>{selectedTenant.waterBill.toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">per month</p>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 To change the water bill amount, edit the tenant details from the Tenant tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
