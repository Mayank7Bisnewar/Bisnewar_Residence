import React, { useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { motion, AnimatePresence } from 'framer-motion';
import { BillingProvider } from '@/context/BillingContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { TenantList } from '@/components/TenantList';
import { BillSummary } from '@/components/BillSummary';
import { TenantDirectory } from '@/components/TenantDirectory';
import { Home } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useToast } from '@/hooks/use-toast';

function AppContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTabState] = useState('tenant');
  const [history, setHistory] = useState<string[]>(['tenant']);

  // Custom setter to track history
  const setActiveTab = useCallback((newTab: string, isBack: boolean = false) => {
    setActiveTabState(newTab);
    if (!isBack) {
      setHistory(prev => {
        // Don't add if it's the same as current
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
    }
  }, []);

  // Handle back button
  useEffect(() => {
    const handleBackButton = async () => {
      // Intercept for Dialogs (Add/Edit modals)
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        // Close the Radix Dialog and stay on the current tab
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      if (history.length > 1) {
        // Go back in history
        const newHistory = [...history];
        newHistory.pop(); // Remove current
        const previousTab = newHistory[newHistory.length - 1];
        setHistory(newHistory);
        setActiveTabState(previousTab);
      } else if (activeTab !== 'tenant') {
        // If not on main tab, first go to main tab
        setActiveTabState('tenant');
        setHistory(['tenant']);
      } else {
        // On main tab with no history - Exit on single press
        await App.exitApp();
      }
    };

    const backButtonListener = App.addListener('backButton', () => {
      handleBackButton();
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [history, activeTab, setActiveTab]);

  const renderTabContent = () => {
    return (
      <div className="flex-1 flex flex-col min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0"
          >
            {(() => {
              switch (activeTab) {
                case 'tenant':
                  return <TenantList onNavigateToSummary={() => setActiveTab('send')} />;
                case 'send':
                  return <BillSummary />;
                case 'directory':
                  return <TenantDirectory />;
                default:
                  return <TenantList onNavigateToSummary={() => setActiveTab('send')} />;
              }
            })()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'tenant':
        return 'Tenants';
      case 'send':
        return 'Bill Summary';
      case 'directory':
        return 'Directory';
      default:
        return 'Tenant';
    }
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-card border-b border-border shadow-sm safe-area-top z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <img src="/home-icon.png" alt="Home" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground select-none">TENANT</h1>
              <p className="text-xs text-muted-foreground">
                {getTabTitle()}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-4">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </div>
  );
}

const Index = () => {
  return (
    <BillingProvider>
      <AppContent />
    </BillingProvider>
  );
};

export default Index;
