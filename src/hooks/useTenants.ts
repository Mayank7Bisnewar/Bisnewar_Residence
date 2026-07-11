import { useCallback, useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Tenant } from '@/types/tenant';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/lib/firestoreService';

const OLD_STORAGE_KEY = 'rentmate_tenants';
const STORAGE_KEY = 'tenant_manager_tenants';

// Migrate legacy data
if (localStorage.getItem(OLD_STORAGE_KEY) && !localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, localStorage.getItem(OLD_STORAGE_KEY)!);
  localStorage.removeItem(OLD_STORAGE_KEY);
}

export function useTenants() {
  const [localTenants, setLocalTenants] = useLocalStorage<Tenant[]>(STORAGE_KEY, []);
  const { user } = useAuth();
  const isInitialSync = useRef(true);

  // Sync from Firestore to Local
  useEffect(() => {
    if (!user) {
      isInitialSync.current = true;
      return;
    }

    const unsubscribe = firestoreService.listenToTenants(user.uid, (remoteTenants) => {
      setLocalTenants((currentLocal) => {
        // Migration Logic: If remote is empty but local has records, upload local
        if (isInitialSync.current && (!remoteTenants || remoteTenants.length === 0) && currentLocal.length > 0) {
          firestoreService.saveTenants(user.uid, currentLocal);
          isInitialSync.current = false;
          return currentLocal;
        }

        // Merge/Sync Logic: Remote takes precedence once initialized
        if (remoteTenants && remoteTenants.length > 0) {
          isInitialSync.current = false;
          // Ensure all tenants have a status (for legacy migration)
          return remoteTenants.map(t => ({
            ...t,
            status: t.status || 'active'
          }));
        }

        isInitialSync.current = false;
        // Also ensure local status
        return currentLocal.map(t => ({
          ...t,
          status: t.status || 'active'
        }));
      });
    });

    return () => unsubscribe();
  }, [user, setLocalTenants]);

  // Helper to update both local and remote
  const updateState = useCallback((newTenants: Tenant[] | ((prev: Tenant[]) => Tenant[])) => {
    setLocalTenants((prev) => {
      const finalTenants = typeof newTenants === 'function' ? newTenants(prev) : newTenants;
      if (user) {
        firestoreService.saveTenants(user.uid, finalTenants);
      }
      return finalTenants;
    });
  }, [user, setLocalTenants]);

  const addTenant = useCallback((tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTenant: Tenant = {
      ...tenant,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
    updateState((prev) => [...prev, newTenant]);
    return newTenant;
  }, [updateState]);

  const updateTenant = useCallback(async (id: string, updates: Partial<Omit<Tenant, 'id' | 'createdAt'>> | ((tenant: Tenant) => Partial<Omit<Tenant, 'id' | 'createdAt'>>)) => {
    return new Promise<void>((resolve) => {
      setLocalTenants((prev) => {
        const updatedTenants = prev.map((tenant) => {
          if (tenant.id === id) {
            const finalUpdates = typeof updates === 'function' ? updates(tenant) : updates;
            return { ...tenant, ...finalUpdates, updatedAt: new Date().toISOString() };
          }
          return tenant;
        });
        if (user) {
          firestoreService.saveTenants(user.uid, updatedTenants).then(() => resolve());
        } else {
          resolve();
        }
        return updatedTenants;
      });
    });
  }, [user, setLocalTenants]);

  const deleteTenant = useCallback((id: string) => {
    updateState((prev) =>
      prev.map((tenant) => {
        if (tenant.id === id) {
          return {
            ...tenant,
            status: 'deleted',
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return tenant;
      })
    );
  }, [updateState]);

  const permanentDeleteTenant = useCallback((id: string) => {
    updateState((prev) => prev.filter((tenant) => tenant.id !== id));
  }, [updateState]);

  const getTenant = useCallback((id: string) => {
    return localTenants.find((tenant) => tenant.id === id);
  }, [localTenants]);

  return {
    tenants: localTenants,
    addTenant,
    updateTenant,
    deleteTenant,
    permanentDeleteTenant,
    getTenant,
    reorderTenants: updateState,
  };
}
