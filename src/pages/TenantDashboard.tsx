import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Home, Droplets, CreditCard, Clock, Zap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { firestoreService } from '@/lib/firestoreService';
import { format } from 'date-fns';

export default function TenantDashboard() {
  const { tenantAccessKey, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantAccessKey) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const viewData = await firestoreService.getPublicTenantView(tenantAccessKey);
        if (viewData) {
          setData(viewData);
        } else {
          setError("Invalid access key or no data found.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching your data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantAccessKey, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleLogout} className="w-full">Return to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/10 rounded-full blur-3xl z-0" />

      {/* Header */}
      <header className="flex-none bg-card/80 backdrop-blur-md border-b border-border shadow-sm safe-area-top z-40 sticky top-0">
        <div className="px-4 py-3 flex items-center justify-between">
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
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 z-10 pb-24">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Home className="w-4 h-4" /> Room Rent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(data.monthlyRent || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-card/50 backdrop-blur-sm shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" /> Water Bill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{(data.waterBill || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          {(data.electricityCharges > 0) && (
            <Card className="border-yellow-500/20 bg-card/50 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> Electricity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{(data.electricityCharges || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{data.electricityUnits} units @ ₹{data.electricityRate}</p>
              </CardContent>
            </Card>
          )}

          {(data.extraCharges > 0) && (
            <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" /> Extra Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{(data.extraCharges || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-full border-emerald-500/30 bg-emerald-500/5 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Total Amount Due
              </CardTitle>
              <span className="text-xs font-medium text-emerald-600/80 bg-emerald-500/10 px-2 py-1 rounded-full">
                {data.billingDate && !isNaN(new Date(data.billingDate).getTime()) ? format(new Date(data.billingDate), 'MMMM yyyy') : 'Current Bill'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
                ₹{(data.totalAmount || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {data.ownerName && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 mt-6 flex flex-col items-center text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">Landlord Contact</p>
            <p className="font-semibold">{data.ownerName}</p>
            {data.ownerMobile && <p className="text-sm text-primary">{data.ownerMobile}</p>}
            {data.ownerUpiId && <p className="text-xs text-muted-foreground mt-1 break-all">UPI: {data.ownerUpiId}</p>}
          </div>
        )}

        {data.paymentHistory && data.paymentHistory.length > 0 && (
          <>
            <h3 className="font-semibold text-lg mt-6 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Payment History
            </h3>

            <div className="space-y-3">
              {data.paymentHistory.map((record: any) => (
                <Card key={record.id} className="bg-card/40 border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">Paid via {record.method.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.date && !isNaN(new Date(record.date).getTime()) ? format(new Date(record.date), 'MMM d, yyyy') : 'Unknown Date'} • {record.billingMonth}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">₹{record.amount.toLocaleString()}</p>
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${record.status === 'completed' ? 'text-emerald-600/80' :
                          record.status === 'pending' ? 'text-yellow-600/80' : 'text-destructive/80'
                        }`}>
                        {record.status}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

      </main>
    </div>
  );
}
