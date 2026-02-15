import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MessageSquare, IndianRupee, Home, Zap, Droplets, PlusCircle, Calendar, User, Settings, CheckSquare, History, Save } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { BillData } from '@/types/tenant';
import { HistoryView } from '@/components/HistoryView';
import { GoogleSheetsService } from '@/services/GoogleSheetsService';
import { useToast } from '@/hooks/use-toast';

export function BillSummary() {
  const {
    tenants,
    ownerInfo,
    setOwnerInfo,
    generateBillDataForTenant,
    addPaymentRecord,
    updatePaymentRecord,
  } = useBilling();
  const { toast } = useToast();

  const [localOwnerInfo, setLocalOwnerInfo] = useState(ownerInfo);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState(GoogleSheetsService.getScriptUrl());

  // Selection state
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false);
  const [historyTenantId, setHistoryTenantId] = useState<string | null>(null);
  const [syncingTenants, setSyncingTenants] = useState<Set<string>>(new Set());

  // Sync local state with context when dialog opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setLocalOwnerInfo(ownerInfo);
    }
  }, [isSettingsOpen, ownerInfo]);

  const handleSaveOwnerInfo = () => {
    setOwnerInfo(localOwnerInfo);
    GoogleSheetsService.setScriptUrl(sheetsUrl);
    setIsSettingsOpen(false);
    toast({ title: 'Settings saved successfully' });
  };

  const handleRecordPayment = async (tenantId: string) => {
    if (syncingTenants.has(tenantId)) return;

    const billData = generateBillDataForTenant(tenantId);
    if (!billData) return;

    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    const billingMonth = format(billData.billingDate, 'MMMM yyyy');

    // Check if payment already exists for this month
    const existingPayment = tenant.paymentHistory?.find(
      record => record.billingMonth === billingMonth
    );

    const scriptUrl = GoogleSheetsService.getScriptUrl();

    if (existingPayment && existingPayment.syncedToSheets) {
      toast({
        title: 'Payment already recorded',
        description: `A payment for ${billingMonth} is already recorded and synced.`,
        variant: 'default'
      });
      return;
    }

    setSyncingTenants(prev => new Set(prev).add(tenantId));

    try {
      let paymentRecordId = existingPayment?.id;

      if (!existingPayment) {
        const paymentRecord = {
          date: new Date().toISOString(),
          amount: billData.totalAmount,
          rentAmount: billData.monthlyRent,
          electricityAmount: billData.electricityCharges,
          waterAmount: billData.waterBill,
          extraAmount: billData.extraCharges,
          electricityUnits: billData.electricityUnits,
          billingMonth: billingMonth,
          syncedToSheets: false,
        };

        // Save to local history and get the record with its UUID
        const newRecord = addPaymentRecord(tenantId, paymentRecord);
        if (newRecord) {
          paymentRecordId = newRecord.id;
        }
      }

      // Send to Google Sheets if configured and not already synced
      if (scriptUrl) {
        try {
          await GoogleSheetsService.appendRow({
            billedDate: format(billData.billingDate, 'dd/MM/yyyy'),
            paidDate: format(new Date(), 'dd/MM/yyyy'),
            tenantName: billData.tenantName,
            roomNo: billData.roomNumber,
            rent: billData.monthlyRent,
            electricityUnits: billData.electricityUnits,
            electricityAmount: billData.electricityCharges,
            waterAmount: billData.waterBill,
            extraAmount: billData.extraCharges,
            totalAmount: billData.totalAmount,
            remarks: '',
          });

          if (paymentRecordId) {
            updatePaymentRecord(tenantId, paymentRecordId, { syncedToSheets: true });
          }

          toast({ title: 'Payment recorded and synced to Google Sheets' });
        } catch (error) {
          console.error('Sheets sync error:', error);
          toast({
            title: 'Sync failed',
            description: 'Payment is kept locally. You can try syncing again later.',
            variant: 'destructive'
          });
        }
      } else if (!existingPayment) {
        toast({ title: 'Payment recorded locally' });
      }
    } finally {
      setSyncingTenants(prev => {
        const next = new Set(prev);
        next.delete(tenantId);
        return next;
      });
    }
  };

  // Toggle selection
  const toggleTenant = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTenantIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTenantIds(newSelected);
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedTenantIds(new Set(tenants.map(t => t.id)));
    } else {
      setSelectedTenantIds(new Set());
    }
  };

  // Calculate totals for selected
  const selectedTotal = useMemo(() => {
    let total = 0;
    selectedTenantIds.forEach(id => {
      const data = generateBillDataForTenant(id);
      if (data) total += data.totalAmount;
    });
    return total;
  }, [selectedTenantIds, generateBillDataForTenant]);

  const getWhatsappLink = (billData: BillData) => {
    const formattedDate = format(billData.billingDate, 'MMMM yyyy');

    let message = `Hello ${billData.tenantName},\n\n`;
    message += `Here are the bill details for ${formattedDate}:\n\n`;
    // message += `Room Rent: ₹${billData.monthlyRent.toLocaleString()}\n`;
    // message += `Electricity Used: ${billData.electricityUnits} units\n`;
    // message += `Electricity Charges: ₹${billData.electricityCharges.toLocaleString()}\n`;
    // message += `Water Bill: ₹${billData.waterBill.toLocaleString()}\n`;

    if (billData.extraCharges > 0) {
      message += `Extra Charges: ₹${billData.extraCharges.toLocaleString()}\n`;
    }

    message += `\n *Total Payable Amount: ₹${billData.totalAmount.toLocaleString()}*\n`;

    if (ownerInfo.name || ownerInfo.upiId || ownerInfo.mobileNumber) {
      message += `\n---\n`;
      if (ownerInfo.name) message += `Owner Name: ${ownerInfo.name}\n`;
      if (ownerInfo.upiId) message += `UPI ID: ${ownerInfo.upiId}\n`;
      if (ownerInfo.mobileNumber) message += `Mobile: ${ownerInfo.mobileNumber}\n`;
    }

    message += `\n*Please ensure the surroundings and toilets are kept clean. Let’s maintain hygiene together. Thank you.*`;

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = billData.mobileNumber.replace(/\D/g, '');
    return `whatsapp://send?phone=91${phoneNumber}&text=${encodedMessage}`;
  };

  const handleSendClick = (tenantId: string) => {
    const data = generateBillDataForTenant(tenantId);
    if (data) {
      window.open(getWhatsappLink(data), '_blank');
    }
  };

  if (tenants.length === 0) {
    return (
      <div className="animate-fade-in">
        <Card className="shadow-card border-dashed border-2">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No tenants found</p>
            <p className="text-sm text-muted-foreground mt-1">Add tenants to generate bills</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header Card */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display">
              <CheckSquare className="w-5 h-5" />
              Select Tenants
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
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Your mobile number"
                      value={localOwnerInfo.mobileNumber}
                      onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
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
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="sheetsUrl">Google Sheets Script URL (Optional)</Label>
                    <Input
                      id="sheetsUrl"
                      placeholder="https://script.google.com/..."
                      value={sheetsUrl}
                      onChange={(e) => setSheetsUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">For automatic sync to Google Sheets</p>
                    {sheetsUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            console.log('Testing connection to:', sheetsUrl);
                            await GoogleSheetsService.appendRow({
                              billedDate: '01/01/2024',
                              paidDate: '01/01/2024',
                              tenantName: 'TEST',
                              roomNo: 'TEST',
                              rent: 0,
                              electricityUnits: 0,
                              electricityAmount: 0,
                              waterAmount: 0,
                              extraAmount: 0,
                              totalAmount: 0,
                              remarks: 'Connection Test',
                            });
                            toast({ title: 'Test successful! Check your sheet for a TEST row.' });
                          } catch (error) {
                            console.error('Test failed:', error);
                            toast({
                              title: 'Test failed',
                              description: 'Check browser console for details',
                              variant: 'destructive'
                            });
                          }
                        }}
                      >
                        Test Connection
                      </Button>
                    )}
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

        {/* Select All Bar */}
        <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedTenantIds.size === tenants.length && tenants.length > 0}
              onCheckedChange={(checked) => toggleAll(checked as boolean)}
            />
            <Label htmlFor="select-all" className="cursor-pointer font-medium">Select All</Label>
          </div>
          <span className="text-sm text-muted-foreground">
            {selectedTenantIds.size} selected
          </span>
        </div>

        {/* Tenant List */}
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-border">
              {tenants.map((tenant) => {
                const billData = generateBillDataForTenant(tenant.id);
                if (!billData) return null;

                return (
                  <div
                    key={tenant.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleTenant(tenant.id, !selectedTenantIds.has(tenant.id))}
                  >
                    <Checkbox
                      id={`tenant-${tenant.id}`}
                      checked={selectedTenantIds.has(tenant.id)}
                      onCheckedChange={(checked) => toggleTenant(tenant.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0 grid gap-1">
                      <Label
                        htmlFor={`tenant-${tenant.id}`}
                        className="font-semibold cursor-pointer truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {tenant.name}
                      </Label>
                      <div className="flex text-xs text-muted-foreground gap-3">
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" /> {tenant.monthlyRent.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> ₹{billData.electricityCharges}
                        </span>
                        {billData.extraCharges > 0 && (
                          <span className="flex items-center gap-1 text-extra">
                            <PlusCircle className="w-3 h-3" /> ₹{billData.extraCharges}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryTenantId(tenant.id);
                        }}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                      <div className="font-bold text-primary">
                        ₹{billData.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Total Receivable</span>
            <span className="text-2xl font-bold text-foreground">₹{selectedTotal.toLocaleString()}</span>
          </div>
          <Button
            className="w-full h-12 text-base font-semibold shadow-md bg-[#25D366] hover:bg-[#128C7E] text-white"
            disabled={selectedTenantIds.size === 0}
            onClick={() => setIsSendingModalOpen(true)}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Send {selectedTenantIds.size} Bills
          </Button>
        </div>
      </Card>

      {/* Sending Modal */}
      <Dialog open={isSendingModalOpen} onOpenChange={setIsSendingModalOpen}>
        <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Send Bills</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Click send for each tenant to open WhatsApp
            </p>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              {Array.from(selectedTenantIds).map(id => {
                const tenant = tenants.find(t => t.id === id);
                const data = generateBillDataForTenant(id);
                if (!tenant || !data) return null;

                const billingMonth = format(data.billingDate, 'MMMM yyyy');
                const existingPayment = tenant.paymentHistory?.find(
                  record => record.billingMonth === billingMonth
                );
                const isSynced = existingPayment?.syncedToSheets;
                const isSyncing = syncingTenants.has(id);

                return (
                  <div key={id} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">₹{data.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isSynced ? "secondary" : "outline"}
                        onClick={() => handleRecordPayment(id)}
                        disabled={isSynced || isSyncing}
                        className={cn(!isSynced && !existingPayment && "border-primary text-primary hover:bg-primary/5")}
                      >
                        {isSyncing ? (
                          <>
                            <span className="flex items-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              Syncing...
                            </span>
                          </>
                        ) : isSynced ? (
                          <>
                            <CheckSquare className="w-4 h-4 mr-1.5 text-green-500" /> Recorded
                          </>
                        ) : existingPayment ? (
                          <>
                            <Save className="w-4 h-4 mr-1.5" /> Retry Sync
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1.5" /> Record
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                        onClick={() => handleSendClick(id)}
                        disabled={isSyncing}
                      >
                        Send <MessageSquare className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-2 border-t">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyTenantId} onOpenChange={(open) => !open && setHistoryTenantId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {historyTenantId && tenants.find(t => t.id === historyTenantId)?.name} - <History className="w-5 h-5 text-muted-foreground" /> Payment History
            </DialogTitle>
          </DialogHeader>
          {historyTenantId && (
            <HistoryView tenant={tenants.find(t => t.id === historyTenantId)!} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
