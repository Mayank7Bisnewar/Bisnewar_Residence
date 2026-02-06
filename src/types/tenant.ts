export interface Tenant {
  id: string;
  name: string;
  roomNumber: string;
  mobileNumber: string;
  monthlyRent: number;
  waterBill: number;
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
