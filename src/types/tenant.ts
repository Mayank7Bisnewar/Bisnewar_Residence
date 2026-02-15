export interface PaymentRecord {
  id: string;
  date: string; // ISO date string
  amount: number;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  extraAmount: number;
  electricityUnits: number;
  billingMonth: string; // "January 2024"
  syncedToSheets?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  roomNumber: string;
  mobileNumber: string;
  monthlyRent: number;
  waterBill: number;
  paymentHistory: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface BillData {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  mobileNumber: string;
  monthlyRent: number;
  electricityUnits: number;
  electricityRate: number;
  electricityCharges: number;
  waterBill: number;
  extraCharges: number;
  totalAmount: number;
  billingDate: Date;
}

export interface OwnerInfo {
  name: string;
  mobileNumber: string;
  upiId: string;
}

export interface AppState {
  selectedTenantId: string | null;
  electricityUnits: number;
  extraCharges: number;
  billingDate: Date;
}
