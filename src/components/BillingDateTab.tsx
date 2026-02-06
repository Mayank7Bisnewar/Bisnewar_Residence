import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BillingDateTab() {
  const { selectedTenant, billingDate, setBillingDate } = useBilling();

  if (!selectedTenant) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenant selected</p>
            <p className="text-sm text-muted-foreground mt-1">Select a tenant from the Tenant tab first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const setToday = () => {
    setBillingDate(new Date());
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground pb-4">
          <CardTitle className="flex items-center gap-2 font-display">
            <CalendarIcon className="w-5 h-5" />
            Billing Date
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Selected Date Display */}
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Selected Date</p>
            <p className="text-2xl font-bold text-foreground">
              {format(billingDate, 'dd MMMM yyyy')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {format(billingDate, 'EEEE')}
            </p>
          </div>

          {/* Quick Actions */}
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={setToday}
          >
            Set to Today
          </Button>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={billingDate}
              onSelect={(date) => date && setBillingDate(date)}
              className={cn("rounded-lg border shadow-sm p-3 pointer-events-auto")}
              initialFocus
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
