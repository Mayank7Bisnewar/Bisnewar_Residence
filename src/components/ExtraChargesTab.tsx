import React from 'react';
import { PlusCircle, IndianRupee } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ExtraChargesTab() {
  const { selectedTenant, extraCharges, setExtraCharges } = useBilling();

  if (!selectedTenant) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <PlusCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenant selected</p>
            <p className="text-sm text-muted-foreground mt-1">Select a tenant from the Tenant tab first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChargesChange = (value: string) => {
    const charges = parseFloat(value) || 0;
    setExtraCharges(Math.max(0, charges));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-extra to-violet-600 text-white pb-4">
          <CardTitle className="flex items-center gap-2 font-display">
            <PlusCircle className="w-5 h-5" />
            Extra Charges
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="extraCharges" className="text-base font-medium">
              Additional Charges (Optional)
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="extraCharges"
                type="number"
                min="0"
                placeholder="0"
                value={extraCharges || ''}
                onChange={(e) => handleChargesChange(e.target.value)}
                className="text-lg h-12 pl-10 text-center font-medium"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Add any additional charges like repairs, maintenance, or other expenses
            </p>
          </div>

          {/* Current Value Display */}
          {extraCharges > 0 && (
            <div className="p-4 bg-extra/10 rounded-lg border border-extra/20 animate-fade-in">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Extra Charges Added</p>
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-extra">
                  <IndianRupee className="w-7 h-7" />
                  <span>{extraCharges.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 Extra charges are optional and reset for each new bill.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
