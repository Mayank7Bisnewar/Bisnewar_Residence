import React, { useState, useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { motion, AnimatePresence } from 'framer-motion';
import { BillingProvider } from '@/context/BillingContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { TenantList } from '@/components/TenantList';
import { BillSummary } from '@/components/BillSummary';
import { TenantDirectory } from '@/components/TenantDirectory';
import { Settings } from '@/components/Settings';
import { UserMenu } from '@/components/UserMenu';
import { BulkNotifyMenu } from '@/components/BulkNotifyMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TenantForm, TenantFormData } from '@/components/TenantForm';
import { useBilling } from '@/context/BillingContext';

const TABS = ['tenant', 'send', 'directory', 'settings'];

function AppContent() {
  const {
    addTenant,
    selectTenant,
  } = useBilling();

  const [activeTab, setActiveTabState] = useState('tenant');
  const [history, setHistory] = useState<string[]>(['tenant']);
  const [direction, setDirection] = useState(0);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAddTenant = (data: TenantFormData) => {
    const newTenant = addTenant({
      name: data.name.trim(),
      roomNumber: data.roomNumber.trim(),
      mobileNumber: data.mobileNumber.trim(),
      joiningDate: data.joiningDate,
      monthlyRent: parseFloat(data.monthlyRent) || 0,
      waterBill: parseFloat(data.waterBill) || 0,
      paymentHistory: [],
      status: 'active',
    });
    selectTenant(newTenant.id);
    setIsAddOpen(false);
  };

  // Custom setter to track history and direction
  const setActiveTab = useCallback((newTab: string, isBack: boolean = false) => {
    const currentIndex = TABS.indexOf(activeTab);
    const nextIndex = TABS.indexOf(newTab);

    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTabState(newTab);

    if (!isBack) {
      setHistory(prev => {
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
    }
  }, [activeTab]);

  // Handle back button
  useEffect(() => {
    const handleBackButton = async () => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      if (history.length > 1) {
        const newHistory = [...history];
        newHistory.pop();
        const previousTab = newHistory[newHistory.length - 1];

        // When going back, we need to find the correct direction
        const currentIndex = TABS.indexOf(activeTab);
        const prevIndex = TABS.indexOf(previousTab);
        setDirection(prevIndex > currentIndex ? 1 : -1);

        setHistory(newHistory);
        setActiveTabState(previousTab);
      } else if (activeTab !== 'tenant') {
        setDirection(-1);
        setActiveTabState('tenant');
        setHistory(['tenant']);
      } else {
        await App.exitApp();
      }
    };

    const backButtonListener = App.addListener('backButton', () => {
      handleBackButton();
    });

    return () => {
      backButtonListener.then(l => l.remove());
    };
  }, [history, activeTab]);

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    const velocityThreshold = 0.5;
    const { offset, velocity } = info;

    // Reject if the swipe was primarily vertical
    if (Math.abs(offset.y) > Math.abs(offset.x)) return;

    const currentIndex = TABS.indexOf(activeTab);

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      // Swipe Left (<-) -> Next Tab
      if (currentIndex < TABS.length - 1) {
        setActiveTab(TABS[currentIndex + 1]);
      }
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      // Swipe Right (->) -> Previous Tab
      if (currentIndex > 0) {
        setActiveTab(TABS[currentIndex - 1]);
      }
    }
  };

  const renderTabContent = () => {
    const variants = {
      initial: (dir: number) => ({
        x: dir > 0 ? '100%' : '-100%',
        opacity: 0,
      }),
      animate: {
        x: 0,
        opacity: 1,
      },
      exit: (dir: number) => ({
        x: dir > 0 ? '-100%' : '100%',
        opacity: 0,
      }),
    };

    return (
      <div className="flex-1 flex flex-col min-h-0 relative overflow-visible">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className="flex-1 flex flex-col min-h-0 w-full active:cursor-grabbing"
          >
            {(() => {
              switch (activeTab) {
                case 'tenant':
                  return <TenantList onNavigateToSummary={() => setActiveTab('send')} />;
                case 'send':
                  return <BillSummary />;
                case 'directory':
                  return <TenantDirectory />;
                case 'settings':
                  return <Settings />;
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
      case 'settings':
        return 'Settings';
      default:
        return 'Tenant';
    }
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-visible">
      {/* Header */}
      <header className="flex-none bg-card border-b border-border shadow-sm safe-area-top z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <img src="/home-icon.png" alt="Home" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-logo text-lg font-bold text-foreground select-none tracking-[0.01em] leading-none transform scale-y-[0.85] origin-left">TENANT</h1>
              <p className="text-xs text-muted-foreground">
                {getTabTitle()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BulkNotifyMenu />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content — pb-24 keeps Send button above floating nav */}
      <main className="flex-1 flex flex-col min-h-0 overflow-visible px-2 ">
        {renderTabContent()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onAddClick={() => setIsAddOpen(true)}
      />

      {/* Add Tenant Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Tenant</DialogTitle>
          </DialogHeader>
          <TenantForm
            onSubmit={handleAddTenant}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>
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
