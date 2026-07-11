import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { PaymentRecord, Tenant, BillData, AppState, MessageSettings } from '@/types/tenant';
import { useTenants } from '@/hooks/useTenants';
import { useOwnerInfo } from '@/hooks/useOwnerInfo';
import { useMessageSettings } from '@/hooks/useMessageSettings';
import { useAuth } from './AuthContext';
import { firestoreService } from '@/lib/firestoreService';
import { getBillingStatus } from '@/lib/billingUtils';

const ELECTRICITY_RATE = 12; // ₹12 per unit

interface BillingContextType {
  // Tenant management
  tenants: Tenant[];
  allTenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => Tenant;
  updateTenant: (id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>> | ((tenant: Tenant) => Partial<Omit<Tenant, 'id' | 'createdAt'>>)) => Promise<void>;
  deleteTenant: (id: string) => void;
  permanentDeleteTenant: (id: string) => void;
  reorderTenants: (tenants: Tenant[]) => void;
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
  electricityRate: number;
  electricityCharges: number;
  totalAmount: number;

  // Owner info
  ownerInfo: { name: string; mobileNumber: string; upiId: string };
  setOwnerInfo: (info: { name: string; mobileNumber: string; upiId: string }) => void;

  // Message settings
  messageSettings: MessageSettings;
  setMessageSettings: (settings: MessageSettings) => void;

  // Bill generation
  generateBillData: () => BillData | null;
  generateBillDataForTenant: (tenantId: string) => BillData | null;
  getTenantBillingState: (tenantId: string) => { electricityUnits: number; extraCharges: number; billingDate: Date };
  resetBill: () => void;
  resetTenantBillData: (tenantId: string) => void;
  generateBillMessage: (tenant: Tenant, data: BillData | PaymentRecord) => string;
  getWhatsappLink: (tenant: Tenant, data: BillData | PaymentRecord) => string;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { tenants: allTenants, addTenant, updateTenant, deleteTenant: deleteTenantBase, permanentDeleteTenant, getTenant, reorderTenants: reorderTenantsBase } = useTenants();
  const tenants = allTenants.filter(t => t.status === 'active');
  const { ownerInfo, setOwnerInfo } = useOwnerInfo();
  const { messageSettings, setMessageSettings } = useMessageSettings();

  // App state
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Per-tenant billing state
  const [billingState, setBillingState] = useState<Record<string, { electricityUnits: number; extraCharges: number; billingDate: Date }>>({});
  const { user } = useAuth();
  const isInitialSync = useRef(true);

  // Sync from Firestore to Local
  useEffect(() => {
    if (!user) {
      isInitialSync.current = true;
      return;
    }

    const unsubscribe = firestoreService.listenToBillingState(user.uid, (remoteState) => {
      setBillingState(currentLocal => {
        if (isInitialSync.current && (!remoteState || Object.keys(remoteState).length === 0) && Object.keys(currentLocal).length > 0) {
          firestoreService.saveBillingState(user.uid, currentLocal);
          isInitialSync.current = false;
          return currentLocal;
        }

        if (remoteState && Object.keys(remoteState).length > 0) {
          isInitialSync.current = false;
          return remoteState;
        }

        isInitialSync.current = false;
        return currentLocal;
      });
    });

    return () => unsubscribe();
  }, [user]);



  const selectedTenant = selectedTenantId ? getTenant(selectedTenantId) || null : null;

  // Get current values or defaults
  const currentBillingState = selectedTenantId ? billingState[selectedTenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() } : { electricityUnits: 0, extraCharges: 0, billingDate: new Date() };

  const electricityUnits = currentBillingState.electricityUnits;
  const extraCharges = currentBillingState.extraCharges;
  const billingDate = new Date(currentBillingState.billingDate); // Ensure Date object

  const updateBillingState = useCallback((tenantId: string, updates: Partial<{ electricityUnits: number; extraCharges: number; billingDate: Date }>) => {
    setBillingState(prev => {
      const newState = {
        ...prev,
        [tenantId]: {
          ...(prev[tenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() }),
          ...updates
        }
      };
      if (user) {
        firestoreService.saveBillingState(user.uid, newState);
      }
      return newState;
    });
  }, [user]);

  const deleteTenant = useCallback((id: string) => {
    deleteTenantBase(id);
    setBillingState(prev => {
      const newState = { ...prev };
      delete newState[id];
      if (user) {
        firestoreService.saveBillingState(user.uid, newState);
      }
      return newState;
    });
    if (selectedTenantId === id) {
      setSelectedTenantId(null);
    }
  }, [deleteTenantBase, user, selectedTenantId]);

  const reorderTenants = useCallback((newActiveTenants: Tenant[]) => {
    const deletedTenants = allTenants.filter(t => t.status === 'deleted');
    reorderTenantsBase([...newActiveTenants, ...deletedTenants]);
  }, [allTenants, reorderTenantsBase]);

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

  const electricityRate = ownerInfo?.electricityRate !== undefined ? ownerInfo.electricityRate : 12;
  const electricityCharges = electricityUnits * electricityRate;
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
      electricityRate,
      electricityCharges,
      waterBill: selectedTenant.waterBill,
      extraCharges,
      totalAmount,
      billingDate,
      joiningDate: selectedTenant.joiningDate,
      dueDate: getBillingStatus(selectedTenant.joiningDate, selectedTenant.paymentHistory).dueDate || undefined,
    };
  }, [selectedTenant, electricityUnits, electricityCharges, extraCharges, totalAmount, billingDate, electricityRate]);

  // Helper to generate bill data for ANY tenant, not just selected
  const generateBillDataForTenant = useCallback((tenantId: string): BillData | null => {
    const tenant = getTenant(tenantId);
    if (!tenant) return null;

    const rate = ownerInfo?.electricityRate !== undefined ? ownerInfo.electricityRate : 12;
    const state = billingState[tenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() };
    const elecCharges = state.electricityUnits * rate;
    const total = tenant.monthlyRent + elecCharges + tenant.waterBill + state.extraCharges;

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      roomNumber: tenant.roomNumber,
      mobileNumber: tenant.mobileNumber,
      monthlyRent: tenant.monthlyRent,
      electricityUnits: state.electricityUnits,
      electricityRate: rate,
      electricityCharges: elecCharges,
      waterBill: tenant.waterBill,
      extraCharges: state.extraCharges,
      totalAmount: total || 0,
      billingDate: state.billingDate instanceof Date ? state.billingDate : new Date(state.billingDate),
      joiningDate: tenant.joiningDate,
      dueDate: getBillingStatus(tenant.joiningDate, tenant.paymentHistory).dueDate || undefined,
    };
  }, [getTenant, billingState, ownerInfo]);

  // Sync public views immediately when tenant details, payments, or owner info changes
  useEffect(() => {
    if (!user) return;
    
    allTenants.forEach(tenant => {
      if (tenant.status !== 'deleted') {
        const billData = generateBillDataForTenant(tenant.id);
        if (billData) {
          firestoreService.publishPublicTenantView(user.uid, tenant.id, {
            ...billData,
            paymentHistory: tenant.paymentHistory || [],
            ownerName: ownerInfo?.name || '',
            ownerMobile: ownerInfo?.mobileNumber || '',
            ownerUpiId: ownerInfo?.upiId || '',
          });
        }
      }
    });
  }, [allTenants, user, ownerInfo, generateBillDataForTenant]);

  // Sync public views with a debounce when typing billing inputs (units, extra charges)
  useEffect(() => {
    if (!user) return;
    
    const timeout = setTimeout(() => {
      allTenants.forEach(tenant => {
        if (tenant.status !== 'deleted') {
          const billData = generateBillDataForTenant(tenant.id);
          if (billData) {
            firestoreService.publishPublicTenantView(user.uid, tenant.id, {
              ...billData,
              paymentHistory: tenant.paymentHistory || [],
              ownerName: ownerInfo?.name || '',
              ownerMobile: ownerInfo?.mobileNumber || '',
              ownerUpiId: ownerInfo?.upiId || '',
            });
          }
        }
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [billingState, user, ownerInfo, generateBillDataForTenant]);

  const addPaymentRecord = useCallback((tenantId: string, record: Omit<PaymentRecord, 'id'>) => {
    const recordId = crypto.randomUUID();
    const newRecord: PaymentRecord = {
      ...record,
      id: recordId,
    };

    updateTenant(tenantId, (tenant) => ({
      paymentHistory: [...(tenant.paymentHistory || []), newRecord]
    }));

    return newRecord;
  }, [updateTenant]);

  const updatePaymentRecord = useCallback((tenantId: string, recordId: string, updates: Partial<PaymentRecord>) => {
    updateTenant(tenantId, (tenant) => ({
      paymentHistory: (tenant.paymentHistory || []).map(record =>
        record.id === recordId ? { ...record, ...updates } : record
      )
    }));
  }, [updateTenant]);

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

  const resetTenantBillData = useCallback((tenantId: string) => {
    updateBillingState(tenantId, { electricityUnits: 0, extraCharges: 0, billingDate: new Date() });
  }, [updateBillingState]);

  const getTenantBillingState = useCallback((tenantId: string) => {
    return billingState[tenantId] || { electricityUnits: 0, extraCharges: 0, billingDate: new Date() };
  }, [billingState]);

  const generateBillMessage = useCallback((tenant: Tenant, data: BillData | PaymentRecord) => {
    const isBillData = 'tenantName' in data;
    const dateStr = isBillData 
      ? (data.billingDate instanceof Date ? format(data.billingDate, 'MMMM yyyy') : format(new Date(data.billingDate), 'MMMM yyyy'))
      : data.billingMonth;
    
    const amount = isBillData ? data.totalAmount : data.amount;
    const electricityCharges = isBillData ? data.electricityCharges : data.electricityAmount;
    const waterBill = isBillData ? data.waterBill : data.waterAmount;
    const extraCharges = isBillData ? data.extraCharges : data.extraAmount;

    let message = `*${messageSettings.headerText}*\n\n`;
    message += `Hello ${tenant.name},\n\n`;
    message += `Here are the bill details for ${dateStr}:\n\n`;
    
    if (messageSettings.includeRent) {
      message += `Monthly Rent: ₹${tenant.monthlyRent.toLocaleString()}\n`;
    }
    if (messageSettings.includeElectricity && electricityCharges > 0) {
      message += `Electricity: ₹${electricityCharges.toLocaleString()}\n`;
    }
    if (messageSettings.includeWater && waterBill > 0) {
      message += `Water: ₹${waterBill.toLocaleString()}\n`;
    }
    if (messageSettings.includeExtra && extraCharges > 0) {
      message += `Extra Charges: ₹${extraCharges.toLocaleString()}\n`;
    }
    
    if (messageSettings.includeTotal) {
      message += `\n *Total Payable Amount: ₹${amount.toLocaleString()}*\n`;
    }

    if (ownerInfo?.name || ownerInfo?.upiId || ownerInfo?.mobileNumber) {
      message += `\n---\n`;
      if (ownerInfo.name) message += `Landlord: ${ownerInfo.name}\n`;
      if (ownerInfo.upiId) message += `UPI ID: ${ownerInfo.upiId}\n`;
      if (ownerInfo.mobileNumber) message += `Mobile: ${ownerInfo.mobileNumber}\n`;
    }

    if (messageSettings.customText) {
      message += `\n*${messageSettings.customText}*`;
    }

    return message;
  }, [messageSettings, ownerInfo]);

  const getWhatsappLink = useCallback((tenant: Tenant, data: BillData | PaymentRecord) => {
    const message = generateBillMessage(tenant, data);
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = (tenant.mobileNumber || '').replace(/\D/g, '');
    return `whatsapp://send?phone=91${phoneNumber}&text=${encodedMessage}`;
  }, [generateBillMessage]);

  return (
    <BillingContext.Provider
      value={{
        tenants,
        addTenant,
        updateTenant,
        deleteTenant,
        permanentDeleteTenant,
        reorderTenants,
        addPaymentRecord,
        updatePaymentRecord,
        deletePaymentRecord,
        allTenants, // Add allTenants to the context if needed for the directory
        selectedTenant,
        selectTenant,
        electricityUnits,
        setElectricityUnits,
        extraCharges,
        setExtraCharges,
        billingDate,
        setBillingDate,
        electricityRate,
        electricityCharges,
        totalAmount,
        ownerInfo,
        setOwnerInfo,
        messageSettings,
        setMessageSettings,
        generateBillData,
        generateBillDataForTenant,
        getTenantBillingState,
        resetBill,
        resetTenantBillData,
        generateBillMessage,
        getWhatsappLink,
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
