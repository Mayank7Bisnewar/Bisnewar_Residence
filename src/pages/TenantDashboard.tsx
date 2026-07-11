import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Home, Droplets, CreditCard, Clock, Zap, AlertCircle, RefreshCw, Receipt, Copy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { firestoreService } from '@/lib/firestoreService';
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function TenantDashboard() {
  const { tenantAccessKey, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const touchStartY = useRef(0);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!tenantAccessKey) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener for tenant details
    const unsubscribe = firestoreService.listenToPublicTenantView(tenantAccessKey, (viewData) => {
      setLoading(false);
      if (viewData) {
        setData(viewData);
        setLastUpdated(new Date());

        // Register for push notifications on native devices
        if (Capacitor.isNativePlatform()) {
          try {
            import('@capacitor/push-notifications').then(async ({ PushNotifications }) => {
              const permResult = await PushNotifications.requestPermissions();
              if (permResult.receive === 'granted') {
                await PushNotifications.register();
              }
              await PushNotifications.addListener('registration', (token) => {
                firestoreService.updatePublicTenantToken(tenantAccessKey, token.value);
              });
            });
          } catch (pushErr) {
            console.warn('Push notification setup failed (non-critical):', pushErr);
          }
        }
      } else {
        setError("No data found for this access key. Please ask your landlord to open the app once to sync your data.");
      }
    });

    return () => unsubscribe();
  }, [tenantAccessKey, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Safe date formatting helpers
  const formatDueDate = (dateValue: any): string | null => {
    try {
      if (!dateValue) return null;
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return null;
      return new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(d);
    } catch {
      return null;
    }
  };

  const formatBillingDate = (dateValue: any): string => {
    try {
      if (!dateValue) return 'Current Bill';
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return 'Current Bill';
      return format(d, 'MMMM yyyy');
    } catch {
      return 'Current Bill';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("UPI ID copied to clipboard!");
  };

  const handleUpiPay = () => {
    if (!data.ownerUpiId) {
        toast.error("Landlord has not set their UPI ID.");
        return;
    }

    const billingPeriod = formatBillingDate(data.billingDate);
    const payeeName = encodeURIComponent(data.ownerName || 'Landlord');
    const paymentAmount = data.totalAmount > 0 ? data.totalAmount : data.monthlyRent;
    const note = encodeURIComponent(`Rent for ${billingPeriod}`);

    const upiLink = `upi://pay?pa=${data.ownerUpiId}&pn=${payeeName}&am=${paymentAmount}&cu=INR&tn=${note}`;

    window.location.href = upiLink;
};

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = mainRef.current?.scrollTop ?? 0;
    if (scrollTop > 2) return; // only at top
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      const progress = Math.min(delta / 70, 1);
      setPullProgress(progress);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullProgress >= 1) {
      setPullRefreshing(true);
      setPullProgress(0);
      // onSnapshot already keeps data live; just show visual feedback
      setTimeout(() => {
        setLastUpdated(new Date());
        setPullRefreshing(false);
      }, 800);
    } else {
      setPullProgress(0);
    }
  }, [pullProgress]);

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return '';
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 10) return 'just now';
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full animate-bounce" />
          <p className="text-muted-foreground font-medium">Fetching your details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Unable to Load Data</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">{error || "Something went wrong. Please try again."}</p>
            <p className="text-xs text-muted-foreground/60">Access Key: {tenantAccessKey}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" /> Reload
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="w-full text-destructive">
                Return to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dueDateStr = formatDueDate(data.dueDate);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden overscroll-none">
      {/* FIXED Background decorations */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Header (Professional centered content) */}
      <header className="flex-none bg-card/85 backdrop-blur-md border-b border-border shadow-sm safe-area-top z-40 sticky top-0">
        <div className="max-w-xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-logo text-lg font-bold text-foreground select-none tracking-[0.01em] leading-none transform scale-y-[0.85] origin-left uppercase">{data.tenantName || 'TENANT PORTAL'}</h1>
              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                Room: {data.roomNumber || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content (Centered & Compact Container) */}
      <main
        ref={mainRef}
        className="flex-1 max-w-xl mx-auto w-full p-4 space-y-1 z-10 pb-20 overscroll-none overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <div
          className="flex items-center justify-center overflow-hidden transition-all duration-200"
          style={{ height: pullRefreshing ? 40 : `${pullProgress * 100}px`, opacity: pullRefreshing ? 1 : pullProgress }}
        >
          <RefreshCw
            className={`w-5 h-5 text-primary ${pullRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: pullRefreshing ? undefined : `rotate(${pullProgress * 360}deg)` }}
          />
          {pullRefreshing && <span className="ml-2 text-xs text-muted-foreground font-medium">Refreshing...</span>}
        </div>



        {/* Next Due Date Banner */}
        {dueDateStr && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
            <Clock className="w-6 h-6 text-primary mb-2" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Next Rent Due</h2>
            <p className="text-2xl font-bold font-display mt-1">
              {dueDateStr}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-md rounded-xl">
            <CardHeader className="pb-0 pt-2.5 px-3">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Home className="w-3 h-3" /> Room Rent
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2.5 px-3">
              <div className="text-xl font-bold">₹{(data.monthlyRent || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur-sm shadow-md rounded-xl">
            <CardHeader className="pb-0 pt-2.5 px-3">
              <CardTitle className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                <Droplets className="w-3 h-3 text-blue-500" /> Water Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2.5 px-3">
              <div className="text-xl font-bold">₹{(data.waterBill || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          {(data.electricityCharges > 0) && (
            <Card className="border-yellow-500/20 bg-card/50 backdrop-blur-sm shadow-md rounded-xl">
              <CardHeader className="pb-0 pt-2.5 px-3">
                <CardTitle className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap className="w-3 h-3 text-yellow-500" /> Electricity
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2.5 px-3">
                <div className="text-xl font-bold">₹{(data.electricityCharges || 0).toLocaleString()}</div>
                <p className="text-[9px] text-muted-foreground mt-0.5">{data.electricityUnits || 0} units @ ₹{data.electricityRate || 0}</p>
              </CardContent>
            </Card>
          )}

          {(data.extraCharges > 0) && (
            <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm shadow-md rounded-xl">
              <CardHeader className="pb-0 pt-2.5 px-3">
                <CardTitle className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertCircle className="w-3 h-3 text-orange-500" /> Extra
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2.5 px-3">
                <div className="text-xl font-bold">₹{(data.extraCharges || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          <Card className="col-span-2 border-emerald-500/30 bg-emerald-500/5 shadow-md rounded-xl">
            <CardHeader className="pb-0 pt-2.5 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wide">
                <CreditCard className="w-3 h-3" /> Total Due
              </CardTitle>
              <span className="text-[9px] font-bold text-emerald-600/80 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                {formatBillingDate(data.billingDate)}
              </span>
            </CardHeader>
            <CardContent className="pb-2.5 px-3">
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                ₹{(data.totalAmount || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* UPI Payments section - always visible */}
        
       <Card className="border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl overflow-hidden">
  <CardContent className="p-4 space-y-3.5">
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          PAYEE UPI ID
        </span>

        {data.ownerUpiId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-semibold text-primary px-2"
            onClick={() => copyToClipboard(data.ownerUpiId)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy ID
          </Button>
        )}
      </div>

      <div className="bg-card/70 border border-border/80 rounded-xl p-3 text-center select-all font-mono text-sm font-semibold tracking-wide break-all min-h-[44px] flex items-center justify-center">
        {data.ownerUpiId ? (
          data.ownerUpiId
        ) : (
          <span className="text-muted-foreground text-xs font-sans font-normal">
            UPI ID not configured by landlord
          </span>
        )}
      </div>
    </div>

    <Button
      onClick={handleUpiPay}
      disabled={!data.ownerUpiId}
      className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <ExternalLink className="w-4 h-4" />
      {data.ownerUpiId
        ? `Pay ₹${(data.totalAmount > 0
            ? data.totalAmount
            : data.monthlyRent
          ).toLocaleString()} via UPI App`
        : "UPI Payment Unavailable"}
    </Button>
  </CardContent>
</Card>

        {data.ownerName && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mt-2 flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Landlord Contact</p>
            <p className="font-semibold text-sm">{data.ownerName}</p>
            {data.ownerMobile && <p className="text-xs text-primary font-medium mt-0.5">{data.ownerMobile}</p>}
          </div>
        )}

        {data.paymentHistory && data.paymentHistory.length > 0 && (
          <>
            <h3 className="font-bold text-base mt-6 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Payment History
            </h3>

            <div className="space-y-3">
              {data.paymentHistory.map((record: any, index: number) => (
                <Card
                  key={record.id || index}
                  className="bg-card/40 border-border/50 hover:bg-card/70 transition-all cursor-pointer shadow-sm rounded-xl"
                  onClick={() => setSelectedPayment(record)}
                >
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs capitalize flex items-center gap-1.5 text-foreground/90">
                        <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                        {record.method ? `Paid via ${record.method.replace('_', ' ')}` : 'Payment'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {record.date && !isNaN(new Date(record.date).getTime()) ? format(new Date(record.date), 'MMM d, yyyy') : 'Unknown Date'}
                        {record.billingMonth ? ` • ${record.billingMonth}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600">₹{(record.amount || 0).toLocaleString()}</p>
                      {record.status && (
                        <p className={`text-[8px] uppercase font-bold tracking-wider mt-0.5 ${record.status === 'completed' ? 'text-emerald-600/80' :
                          record.status === 'pending' ? 'text-yellow-600/80' : 'text-destructive/80'
                          }`}>
                          {record.status}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Payment Receipt Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold font-display">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Receipt Details
            </DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider">Amount Paid</span>
                <h3 className="text-2xl font-extrabold text-emerald-700 mt-1">₹{(selectedPayment.amount || 0).toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">via {selectedPayment.method?.replace('_', ' ') || 'Unknown'}</p>
              </div>

              <div className="border border-border rounded-xl p-4 space-y-2.5 bg-card/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Billing Period</span>
                  <span className="font-semibold">{selectedPayment.billingMonth || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment Date</span>
                  <span className="font-semibold">
                    {selectedPayment.date && !isNaN(new Date(selectedPayment.date).getTime())
                      ? format(new Date(selectedPayment.date), 'dd MMMM yyyy')
                      : 'N/A'}
                  </span>
                </div>

                <div className="h-px bg-border my-2" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Room Rent</span>
                  <span className="font-semibold">₹{(selectedPayment.rentAmount || 0).toLocaleString()}</span>
                </div>

                {(selectedPayment.waterAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Water Bill</span>
                    <span className="font-semibold">₹{(selectedPayment.waterAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                {(selectedPayment.electricityAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Electricity
                      {selectedPayment.electricityUnits > 0 && (
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded">
                          {selectedPayment.electricityUnits} Units
                        </span>
                      )}
                    </span>
                    <span className="font-semibold">₹{(selectedPayment.electricityAmount || 0).toLocaleString()}</span>
                  </div>
                )}

                {(selectedPayment.extraAmount > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Extra Charges</span>
                    <span className="font-semibold">₹{(selectedPayment.extraAmount || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <Button onClick={() => setSelectedPayment(null)} className="w-full">
                Close Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
