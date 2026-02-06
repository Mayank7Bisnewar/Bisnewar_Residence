import React from 'react';
import { Zap, IndianRupee, AlertCircle } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ELECTRICITY_RATE = 12; // ₹12 per unit

export function ElectricityTab() {
  const { selectedTenant, electricityUnits, setElectricityUnits, electricityCharges } = useBilling();

  if (!selectedTenant) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenant selected</p>
            <p className="text-sm text-muted-foreground mt-1">Select a tenant from the Tenant tab first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUnitsChange = (value: string) => {
    const units = parseInt(value) || 0;
    setElectricityUnits(Math.max(0, units));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-electricity to-amber-600 text-white pb-4">
          <CardTitle className="flex items-center gap-2 font-display">
            <Zap className="w-5 h-5" />
            Electricity Bill
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Units Input */}
          <div className="space-y-2">
            <Label htmlFor="units" className="text-base font-medium">
              Units Consumed
            </Label>
            <Input
              id="units"
              type="number"
              min="0"
              placeholder="Enter electricity units"
              value={electricityUnits || ''}
              onChange={(e) => handleUnitsChange(e.target.value)}
              className="text-lg h-12 text-center font-medium"
            />
          </div>

          {/* Rate Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Rate per unit</span>
              <span className="font-semibold">₹{ELECTRICITY_RATE}</span>
            </div>
          </div>

          {/* Calculation Display */}
          {electricityUnits > 0 && (
            <div className="p-4 bg-electricity/10 rounded-lg border border-electricity/20 animate-fade-in">
              <div className="text-center mb-3">
                <p className="text-sm text-muted-foreground">Calculation</p>
                <p className="font-mono text-lg">
                  {electricityUnits} units × ₹{ELECTRICITY_RATE} = 
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 text-3xl font-bold text-electricity">
                <IndianRupee className="w-7 h-7" />
                <span>{electricityCharges.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {electricityUnits === 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Enter the number of electricity units to calculate charges</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
