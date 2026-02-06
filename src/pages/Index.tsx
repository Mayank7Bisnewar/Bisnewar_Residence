import React, { useState } from 'react';
import { BillingProvider } from '@/context/BillingContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { TenantList } from '@/components/TenantList';
import { RoomRentTab } from '@/components/RoomRentTab';
import { ElectricityTab } from '@/components/ElectricityTab';
import { WaterBillTab } from '@/components/WaterBillTab';
import { ExtraChargesTab } from '@/components/ExtraChargesTab';
import { BillingDateTab } from '@/components/BillingDateTab';
import { BillSummary } from '@/components/BillSummary';
import { Home } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('tenant');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tenant':
        return <TenantList />;
      case 'rent':
        return <RoomRentTab />;
      case 'electricity':
        return <ElectricityTab />;
      case 'water':
        return <WaterBillTab />;
      case 'extra':
        return <ExtraChargesTab />;
      case 'date':
        return <BillingDateTab />;
      case 'send':
        return <BillSummary />;
      default:
        return <TenantList />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'tenant':
        return 'Tenants';
      case 'rent':
        return 'Room Rent';
      case 'electricity':
        return 'Electricity';
      case 'water':
        return 'Water Bill';
      case 'extra':
        return 'Extra Charges';
      case 'date':
        return 'Billing Date';
      case 'send':
        return 'Send Bill';
      default:
        return 'RentMate';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">RentMate</h1>
              <p className="text-xs text-muted-foreground">{getTabTitle()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-4">
          {renderTabContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
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
