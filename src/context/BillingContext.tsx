import React, { createContext, useContext, useState, useCallback } from 'react';
import { PaymentRecord, Tenant, BillData, AppState } from '@/types/tenant';
import { useTenants } from '@/hooks/useTenants';
import { useOwnerInfo } from '@/hooks/useOwnerInfo';

const ELECTRICITY_RATE = 12; // ₹12 per unit

interface BillingContextType {
  // Tenant management
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>) => void;
  deleteTenant: (id: string) => void;
  addPaymentRecord: (tenantId: string, record: Omit<PaymentRecord, 'id'>) => PaymentRecord | void;
  updatePaymentRecord: (tenantId: string, recordId: string, updates: Partial<PaymentRecord>) => void;
  deletePaymentRecord: (tenantId: string, recordId: string) => void;
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
  generateBillDataForTenant: (tenantId: string) => BillData | null;
  resetBill: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { tenants, addTenant, updateTenant, deleteTenant, getTenant } = useTenants();
  const { ownerInfo, setOwnerInfo } = useOwnerInfo();

  // App state
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Per-tenant billing state
  const [billingState, setBillingState] = useState<Record<string, { electricityUnits: number; extraCharges: number; billingDate: Date }>>({});

  const selectedTenant = selectedTenantId ? getTenant(selectedTenantId) || null : null;

  // Get current values or defaults
  const currentBillingState = selectedTenantId ? billingState[selectedTenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() } : { electricityUnits: 0, extraCharges: 0, billingDate: new Date() };

  const electricityUnits = currentBillingState.electricityUnits;
  const extraCharges = currentBillingState.extraCharges;
  const billingDate = new Date(currentBillingState.billingDate); // Ensure Date object

  const updateBillingState = useCallback((tenantId: string, updates: Partial<{ electricityUnits: number; extraCharges: number; billingDate: Date }>) => {
    setBillingState(prev => ({
      ...prev,
      [tenantId]: {
        ...(prev[tenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() }),
        ...updates
      }
    }));
  }, []);

  const selectTenant = useCallback((id: string | null) => {
    setSelectedTenantId(id);
    // No need to reset; state is persisted in billingState map
  }, []);

  const setElectricityUnits = useCallback((units: number) => {
    if (selectedTenantId) {
      updateBillingState(selectedTenantId, { electricityUnits: units });
    }
  }, [selectedTenantId, updateBillingState]);

  const setExtraCharges = useCallback((charges: number) => {
    if (selectedTenantId) {
      updateBillingState(selectedTenantId, { extraCharges: charges });
    }
  }, [selectedTenantId, updateBillingState]);

  const setBillingDate = useCallback((date: Date) => {
    if (selectedTenantId) {
      updateBillingState(selectedTenantId, { billingDate: date });
    }
  }, [selectedTenantId, updateBillingState]);

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

  // Helper to generate bill data for ANY tenant, not just selected
  const generateBillDataForTenant = useCallback((tenantId: string): BillData | null => {
    const tenant = getTenant(tenantId);
    if (!tenant) return null;

    const state = billingState[tenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() };
    const elecCharges = state.electricityUnits * ELECTRICITY_RATE;
    const total = tenant.monthlyRent + elecCharges + tenant.waterBill + state.extraCharges;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      roomNumber: tenant.roomNumber,
      mobileNumber: tenant.mobileNumber,
      monthlyRent: tenant.monthlyRent,
      electricityUnits: state.electricityUnits,
      electricityRate: ELECTRICITY_RATE,
      electricityCharges: elecCharges,
      waterBill: tenant.waterBill,
      extraCharges: state.extraCharges,
      totalAmount: total,
      billingDate: new Date(state.billingDate),
    };
  }, [getTenant, billingState]);

  const addPaymentRecord = useCallback((tenantId: string, record: Omit<PaymentRecord, 'id'>) => {
    const tenant = getTenant(tenantId);
    if (!tenant) return;

    const newRecord: PaymentRecord = {
      ...record,
      id: crypto.randomUUID(),
    };

    const updatedHistory = [...(tenant.paymentHistory || []), newRecord];
    updateTenant(tenantId, { paymentHistory: updatedHistory });
    return newRecord;
  }, [getTenant, updateTenant]);

  const updatePaymentRecord = useCallback((tenantId: string, recordId: string, updates: Partial<PaymentRecord>) => {
    const tenant = getTenant(tenantId);
    if (!tenant) return;

    const updatedHistory = (tenant.paymentHistory || []).map(record =>
      record.id === recordId ? { ...record, ...updates } : record
    );
    updateTenant(tenantId, { paymentHistory: updatedHistory });
  }, [getTenant, updateTenant]);

  const deletePaymentRecord = useCallback((tenantId: string, recordId: string) => {
    const tenant = getTenant(tenantId);
    if (!tenant) return;

    const updatedHistory = (tenant.paymentHistory || []).filter(record => record.id !== recordId);
    updateTenant(tenantId, { paymentHistory: updatedHistory });
  }, [getTenant, updateTenant]);

  const resetBill = useCallback(() => {
    if (selectedTenantId) {
      updateBillingState(selectedTenantId, { electricityUnits: 0, extraCharges: 0, billingDate: new Date() });
    }
  }, [selectedTenantId, updateBillingState]);

  return (
    <BillingContext.Provider
      value={{
        tenants,
        addTenant,
        updateTenant,
        deleteTenant,
        addPaymentRecord,
        updatePaymentRecord,
        deletePaymentRecord,
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
        generateBillDataForTenant, // Expose new helper
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
