import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  ChevronRight, 
  MessageSquare, 
  Sliders,
  Settings as SettingsIcon,
  ShieldCheck, 
  Database, 
  Zap, 
  Droplets, 
  Home,
  FileText,
  IndianRupee,
  Phone,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBilling } from '@/context/BillingContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { GoogleSheetsService } from '@/services/GoogleSheetsService';
import { firestoreService } from "@/lib/firestoreService";


export function Settings() {
  const {
    ownerInfo,
    setOwnerInfo,
    messageSettings,
    setMessageSettings,
    allTenants,
    generateBillDataForTenant
  } = useBilling();
  const { user, loginWithGoogle, logout } = useAuth();
  const { toast } = useToast();

  // Modal open states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  // Local form states
  const [localOwnerInfo, setLocalOwnerInfo] = useState(ownerInfo);
  const [localMessageSettings, setLocalMessageSettings] = useState(messageSettings);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [isTestingSheets, setIsTestingSheets] = useState(false);

  // Sync state when modals open
  useEffect(() => {
    if (isProfileOpen) {
      setLocalOwnerInfo(ownerInfo);
      setSheetsUrl(GoogleSheetsService.getScriptUrl() || '');
    }
  }, [isProfileOpen, ownerInfo]);

  useEffect(() => {
    if (isMessageOpen) {
      setLocalMessageSettings(messageSettings);
    }
  }, [isMessageOpen, messageSettings]);

  const handleSaveProfile = () => {
    try {
      setOwnerInfo(localOwnerInfo);
      GoogleSheetsService.setScriptUrl(sheetsUrl);
      
      // Immediately publish/sync new owner info to Firestore for all tenants
      if (user && localOwnerInfo) {
        firestoreService.saveOwnerInfo(user.uid, localOwnerInfo);
        
        // Push the update directly to all tenant public views in Firestore instantly
        allTenants.forEach(async (tenant) => {
          if (tenant.status !== 'deleted') {
            const billData = generateBillDataForTenant(tenant.id);
            if (billData) {
              await firestoreService.publishPublicTenantView(user.uid, tenant.id, {
                ...billData,
                paymentHistory: tenant.paymentHistory || [],
                ownerName: localOwnerInfo.name || '',
                ownerMobile: localOwnerInfo.mobileNumber || '',
                ownerUpiId: localOwnerInfo.upiId || '',
              });
            }
          }
        });
      }
      
      setIsProfileOpen(false);
      toast({
        title: 'Profile Saved',
        description: 'Your owner and bank profile details have been updated.',
      });
    } catch (e) {
      console.error("Failed to save profile:", e);
      // Fallback close modal in case of crash
      setIsProfileOpen(false);
    }
  };

  const handleSaveMessageSettings = () => {
    setMessageSettings(localMessageSettings);
    setIsMessageOpen(false);
    toast({
      title: 'Message Settings Saved',
      description: 'Your WhatsApp bill template has been updated.',
    });
  };

  const handleTestSheets = async () => {
    if (!sheetsUrl) return;
    setIsTestingSheets(true);
    try {
      await GoogleSheetsService.appendRow({
        billedDate: '01/01/2024',
        paidDate: '01/01/2024',
        tenantName: 'TEST CONNECTION',
        roomNo: '999',
        rent: 0,
        electricityUnits: 0,
        electricityAmount: 0,
        waterAmount: 0,
        extraAmount: 0,
        totalAmount: 0,
        remarks: 'Connection Test from settings tab',
      });
      toast({
        title: 'Connection Successful!',
        description: 'Test row successfully appended to your sheet.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Connection Failed',
        description: 'Please verify the Web App URL and check permission scopes.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingSheets(false);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col min-h-0 pt-4 gap-4 overflow-y-auto"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 85px)' }}
    >
      {/* Account Section */}
      <div className="space-y-2 px-1">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
          Google Cloud Backup
        </h3>
        
        {user ? (
          <Card className="border-none shadow-sm rounded-2xl bg-card">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-12 w-12 border-2 border-primary/20 flex-none">
                  <AvatarImage
                    src={user.photoURL || undefined}
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <UserIcon className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">
                    {user.displayName || "Landlord Account"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    Synced & Active
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 rounded-xl hover:bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-xs flex-none"
                onClick={logout}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 bg-card/50">
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="max-w-[280px]">
                <p className="font-semibold text-sm text-foreground">
                  Backup disabled
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign in to protect your tenant directory and billing history in the cloud.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-xl font-semibold text-xs bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform w-full"
                  onClick={loginWithGoogle}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In with Google
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform w-full text-muted-foreground"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Return to Login Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Settings Options */}
      <div className="space-y-3 px-1">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
          Preferences
        </h3>

        {/* Profile Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="cursor-pointer"
          onClick={() => setIsProfileOpen(true)}
        >
          <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-none">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground">Profile & Bank Info</h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {ownerInfo.name ? `${ownerInfo.name} • ` : ''}
                    {ownerInfo.mobileNumber ? `${ownerInfo.mobileNumber} • ` : ''}
                    {ownerInfo.upiId ? `${ownerInfo.upiId}` : 'No UPI configured'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-none" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Message Settings Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="cursor-pointer"
          onClick={() => setIsMessageOpen(true)}
        >
          <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 flex-none">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground">WhatsApp Bill Template</h4>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {messageSettings.headerText || 'No header'} • {
                      [
                        messageSettings.includeRent && 'Rent',
                        messageSettings.includeElectricity && 'Electricity',
                        messageSettings.includeWater && 'Water',
                        messageSettings.includeExtra && 'Extras'
                      ].filter(Boolean).join(', ') || 'No fields'
                    }
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/60 flex-none" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Info Card */}
      <div className="px-1 text-center py-4">
        <p className="text-[10px] text-muted-foreground/75 font-semibold uppercase tracking-widest">
          Tenant Manager v1.1.0
        </p>
      </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Landlord & Bank Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="font-semibold text-xs text-muted-foreground">Landlord Name</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="ownerName"
                  placeholder="e.g. Ramesh Kumar"
                  value={localOwnerInfo.name}
                  onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, name: e.target.value })}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerMobile" className="font-semibold text-xs text-muted-foreground">Mobile Number (WhatsApp)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="ownerMobile"
                  type="text"
                  inputMode="tel"
                  placeholder="10 digit number"
                  value={localOwnerInfo.mobileNumber}
                  onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upiId" className="font-semibold text-xs text-muted-foreground">UPI ID for Rent Payments</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="upiId"
                  placeholder="e.g. ramesh@upi"
                  value={localOwnerInfo.upiId || ''}
                  onChange={(e) => setLocalOwnerInfo({ ...localOwnerInfo, upiId: e.target.value })}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="electricityRate" className="font-semibold text-xs text-muted-foreground">Electricity Rate (₹ per unit)</Label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="electricityRate"
                  type="number"
                  placeholder="12"
                  value={localOwnerInfo.electricityRate !== undefined ? localOwnerInfo.electricityRate : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLocalOwnerInfo({
                      ...localOwnerInfo,
                      electricityRate: val === '' ? undefined : parseFloat(val)
                    });
                  }}
                  className="pl-10 h-10 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="sheetsUrl" className="font-semibold text-xs text-muted-foreground">Google Sheets Script URL (Optional)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="sheetsUrl"
                    placeholder="https://script.google.com/..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    className="pl-10 h-10 rounded-xl text-xs"
                  />
                </div>
                {sheetsUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl px-3 font-semibold text-xs border-primary text-primary hover:bg-primary/5"
                    disabled={isTestingSheets}
                    onClick={handleTestSheets}
                  >
                    {isTestingSheets ? 'Testing...' : 'Test'}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl h-10">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveProfile} className="rounded-xl h-10 bg-primary hover:bg-primary-dark text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageOpen} onOpenChange={setIsMessageOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">WhatsApp Bill Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="headerText" className="font-semibold text-xs text-muted-foreground">Message Header Title</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="headerText"
                  value={localMessageSettings.headerText}
                  onChange={(e) => setLocalMessageSettings({ ...localMessageSettings, headerText: e.target.value })}
                  placeholder="e.g. HOUSE RENT BILL"
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="font-semibold text-xs text-muted-foreground">Include in Bill Details</Label>
              
              <div className="space-y-2 bg-muted/30 p-3 rounded-2xl border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Monthly rent amount</span>
                  </div>
                  <Switch
                    id="include-rent"
                    checked={localMessageSettings.includeRent}
                    onCheckedChange={(checked) => setLocalMessageSettings({ ...localMessageSettings, includeRent: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Electricity bill charges</span>
                  </div>
                  <Switch
                    id="include-elec"
                    checked={localMessageSettings.includeElectricity}
                    onCheckedChange={(checked) => setLocalMessageSettings({ ...localMessageSettings, includeElectricity: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Water bill charges</span>
                  </div>
                  <Switch
                    id="include-water"
                    checked={localMessageSettings.includeWater}
                    onCheckedChange={(checked) => setLocalMessageSettings({ ...localMessageSettings, includeWater: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">Extra miscellaneous charges</span>
                  </div>
                  <Switch
                    id="include-extra"
                    checked={localMessageSettings.includeExtra}
                    onCheckedChange={(checked) => setLocalMessageSettings({ ...localMessageSettings, includeExtra: checked })}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">Grand total receivable</span>
                  </div>
                  <Switch
                    id="include-total"
                    checked={localMessageSettings.includeTotal}
                    onCheckedChange={(checked) => setLocalMessageSettings({ ...localMessageSettings, includeTotal: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="customText" className="font-semibold text-xs text-muted-foreground">Custom Footer Message</Label>
              <Textarea
                id="customText"
                placeholder="e.g. Please clear the payment by the 5th. Thank you!"
                className="h-20 resize-none text-xs rounded-xl p-3"
                value={localMessageSettings.customText}
                onChange={(e) => setLocalMessageSettings({ ...localMessageSettings, customText: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl h-10">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveMessageSettings} className="rounded-xl h-10 bg-primary hover:bg-primary-dark text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}