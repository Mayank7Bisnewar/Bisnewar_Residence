import React from 'react';
import { format } from 'date-fns';
import { MessageSquare, IndianRupee, Home, Zap, Droplets, PlusCircle, Calendar, User, Settings } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function BillSummary() {
  const { 
    selectedTenant, 
    electricityUnits, 
    electricityCharges, 
    extraCharges, 
    totalAmount,
    billingDate,
    ownerInfo,
    setOwnerInfo,
    generateBillData,
  } = useBilling();

  const [localOwnerInfo, setLocalOwnerInfo] = React.useState(ownerInfo);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Sync local state with context when dialog opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setLocalOwnerInfo(ownerInfo);
    }
  }, [isSettingsOpen, ownerInfo]);

  const handleSaveOwnerInfo = () => {
    setOwnerInfo(localOwnerInfo);
    setIsSettingsOpen(false);
  };

  const handleWhatsAppSend = () => {
    const billData = generateBillData();
    if (!billData) return;

    const formattedDate = format(billData.billingDate, 'MMMM yyyy');
    
    let message = `Hello ${billData.tenantName},\n\n`;
    message += `Here are the bill details for ${formattedDate}:\n\n`;
    message += `🏠 Room Rent: ₹${billData.monthlyRent.toLocaleString()}\n`;
    message += `⚡ Electricity Used: ${billData.electricityUnits} units\n`;
    message += `💡 Electricity Charges: ₹${billData.electricityCharges.toLocaleString()}\n`;
    message += `🚰 Water Bill: ₹${billData.waterBill.toLocaleString()}\n`;
    
    if (billData.extraCharges > 0) {
      message += `➕ Extra Charges: ₹${billData.extraCharges.toLocaleString()}\n`;
    }
    
    message += `\n💰 *Total Payable Amount: ₹${billData.totalAmount.toLocaleString()}*\n`;
    
    if (ownerInfo.name || ownerInfo.upiId || ownerInfo.mobileNumber) {
      message += `\n---\n`;
      if (ownerInfo.name) message += `Owner Name: ${ownerInfo.name}\n`;
      if (ownerInfo.upiId) message += `UPI ID: ${ownerInfo.upiId}\n`;
      if (ownerInfo.mobileNumber) message += `Mobile: ${ownerInfo.mobileNumber}\n`;
    }
    
    message += `\nThank you.`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = billData.mobileNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (!selectedTenant) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenant selected</p>
            <p className="text-sm text-muted-foreground mt-1">Select a tenant to generate bill</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Bill Summary Card */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display">
              <IndianRupee className="w-5 h-5" />
              Bill Summary
            </CardTitle>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Owner Information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      placeholder="Your name"
                      value={localOwnerInfo.name}
                      onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerMobile">Mobile Number</Label>
                    <Input
                      id="ownerMobile"
                      placeholder="Your mobile number"
                      value={localOwnerInfo.mobileNumber}
                      onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, mobileNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      placeholder="yourname@upi"
                      value={localOwnerInfo.upiId}
                      onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, upiId: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSaveOwnerInfo}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Tenant Info */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{selectedTenant.name}</p>
              {selectedTenant.roomNumber && (
                <p className="text-sm text-muted-foreground">{selectedTenant.roomNumber}</p>
              )}
            </div>
          </div>

          {/* Billing Date */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Billing Date</span>
            </div>
            <span className="font-medium">{format(billingDate, 'dd MMM yyyy')}</span>
          </div>

          {/* Bill Items */}
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-rent" />
                <span>Room Rent</span>
              </div>
              <span className="font-medium">₹{selectedTenant.monthlyRent.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-electricity" />
                <span>Electricity ({electricityUnits} units)</span>
              </div>
              <span className="font-medium">₹{electricityCharges.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-water" />
                <span>Water Bill</span>
              </div>
              <span className="font-medium">₹{selectedTenant.waterBill.toLocaleString()}</span>
            </div>

            {extraCharges > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-extra" />
                  <span>Extra Charges</span>
                </div>
                <span className="font-medium">₹{extraCharges.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-lg font-semibold">Total Amount</span>
            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
              <IndianRupee className="w-6 h-6" />
              <span>{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Send Button */}
      <Button 
        className={cn(
          "w-full h-14 text-lg font-semibold gap-3",
          "bg-[#25D366] hover:bg-[#128C7E] text-white",
          "shadow-lg hover:shadow-xl transition-all duration-200"
        )}
        onClick={handleWhatsAppSend}
      >
        <MessageSquare className="w-6 h-6" />
        Send Bill via WhatsApp
      </Button>

      {/* Info */}
      <p className="text-xs text-center text-muted-foreground">
        Opens WhatsApp with a pre-filled message for {selectedTenant.name}
      </p>
    </div>
  );
}
