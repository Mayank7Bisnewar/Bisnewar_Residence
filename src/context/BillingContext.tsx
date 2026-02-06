import React, { createContext, useContext, useState, useCallback } from 'react';
import { Tenant, BillData, AppState } from '@/types/tenant';
import { useTenants } from '@/hooks/useTenants';
import { useOwnerInfo } from '@/hooks/useOwnerInfo';

const ELECTRICITY_RATE = 12; // ₹12 per unit

interface BillingContextType {
  // Tenant management
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>) => void;
  deleteTenant: (id: string) => void;
  selectedTenant: Tenant | null;
  selectTenant: (id: string | null) => void;

  // Billing state
  electricityUnits: number;
  setElectricityUnits: (units: number) => void;
  extraCharges: number;
  setExtraCharges: (charges: number) => void;
  billingDate: Date;
  setBillingDate: (date: Date) => void;

  // Calculated values
  electricityCharges: number;
  totalAmount: number;

  // Owner info
  ownerInfo: { name: string; mobileNumber: string; upiId: string };
  setOwnerInfo: (info: { name: string; mobileNumber: string; upiId: string }) => void;

  // Bill generation
  generateBillData: () => BillData | null;
  resetBill: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { tenants, addTenant, updateTenant, deleteTenant, getTenant } = useTenants();
  const { ownerInfo, setOwnerInfo } = useOwnerInfo();

  // App state
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [electricityUnits, setElectricityUnits] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);
  const [billingDate, setBillingDate] = useState(new Date());

  const selectedTenant = selectedTenantId ? getTenant(selectedTenantId) || null : null;

  const selectTenant = useCallback((id: string | null) => {
    setSelectedTenantId(id);
    // Reset billing values when changing tenant
    setElectricityUnits(0);
    setExtraCharges(0);
    setBillingDate(new Date());
  }, []);

  // Calculated values
  const electricityCharges = electricityUnits * ELECTRICITY_RATE;
  const totalAmount = selectedTenant
    ? selectedTenant.monthlyRent + electricityCharges + selectedTenant.waterBill + extraCharges
    : 0;

  const generateBillData = useCallback((): BillData | null => {
    if (!selectedTenant) return null;

    return {
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      roomNumber: selectedTenant.roomNumber,
      mobileNumber: selectedTenant.mobileNumber,
      monthlyRent: selectedTenant.monthlyRent,
      electricityUnits,
      electricityRate: ELECTRICITY_RATE,
      electricityCharges,
      waterBill: selectedTenant.waterBill,
      extraCharges,
      totalAmount,
      billingDate,
    };
  }, [selectedTenant, electricityUnits, electricityCharges, extraCharges, totalAmount, billingDate]);

  const resetBill = useCallback(() => {
    setElectricityUnits(0);
    setExtraCharges(0);
    setBillingDate(new Date());
  }, []);

  return (
    <BillingContext.Provider
      value={{
        tenants,
        addTenant,
        updateTenant,
        deleteTenant,
        selectedTenant,
        selectTenant,
        electricityUnits,
        setElectricityUnits,
        extraCharges,
        setExtraCharges,
        billingDate,
        setBillingDate,
        electricityCharges,
        totalAmount,
        ownerInfo,
        setOwnerInfo,
        generateBillData,
        resetBill,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
