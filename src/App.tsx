import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import TenantDashboard from "./pages/TenantDashboard";
import { AdBanner } from "@/components/AdBanner";
import { showInterstitialAd } from "@/lib/admob";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isGuest, tenantAccessKey, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          tenantAccessKey ? <TenantDashboard /> : 
          (user || isGuest) ? <Index /> : 
          <Login />
        } 
      />
      <Route path="/login" element={!user && !isGuest && !tenantAccessKey ? <Login /> : <Navigate to="/" />} />
      <Route path="/tenant" element={tenantAccessKey ? <TenantDashboard /> : <Navigate to="/login" />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // Show full screen ad 10 seconds after opening the app
    const timer = setTimeout(() => {
      showInterstitialAd();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>

            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <div className="flex-1">
                  <AppRoutes />
                </div>
                <AdBanner />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
