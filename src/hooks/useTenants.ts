import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Tenant } from '@/types/tenant';

const STORAGE_KEY = 'rentmate_tenants';

export function useTenants() {
  const [tenants, setTenants] = useLocalStorage<Tenant[]>(STORAGE_KEY, []);

  const addTenant = useCallback((tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTenant: Tenant = {
      ...tenant,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setTenants((prev) => [...prev, newTenant]);
    return newTenant;
  }, [setTenants]);

  const updateTenant = useCallback((id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>) => {
    setTenants((prev) =>
      prev.map((tenant) =>
        tenant.id === id
          ? { ...tenant, ...updates, updatedAt: new Date().toISOString() }
          : tenant
      )
    );
  }, [setTenants]);

  const deleteTenant = useCallback((id: string) => {
    setTenants((prev) => prev.filter((tenant) => tenant.id !== id));
  }, [setTenants]);

  const getTenant = useCallback((id: string) => {
    return tenants.find((tenant) => tenant.id === id);
  }, [tenants]);

  return {
    tenants,
    addTenant,
    updateTenant,
    deleteTenant,
    getTenant,
  };
}
