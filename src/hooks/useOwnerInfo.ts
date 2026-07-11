import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { OwnerInfo } from '@/types/tenant';
import { useAuth } from '@/context/AuthContext';
import { firestoreService } from '@/lib/firestoreService';

const OLD_STORAGE_KEY = 'rentmate_owner';
const STORAGE_KEY = 'tenant_manager_owner';

// Migrate legacy data
if (localStorage.getItem(OLD_STORAGE_KEY) && !localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, localStorage.getItem(OLD_STORAGE_KEY)!);
  localStorage.removeItem(OLD_STORAGE_KEY);
}

const defaultOwner: OwnerInfo = {
  name: '',
  mobileNumber: '',
  upiId: '',
  electricityRate: 12,
};

export function useOwnerInfo() {
  const [ownerInfo, setOwnerInfo] = useLocalStorage<OwnerInfo>(STORAGE_KEY, defaultOwner);
  const { user } = useAuth();
  const isInitialSync = useRef(true);

  // Sync from Firestore to local storage
  useEffect(() => {
    if (!user) {
      isInitialSync.current = true;
      return;
    }

    const unsubscribe = firestoreService.listenToOwnerInfo(user.uid, (remoteOwner) => {
      if (remoteOwner) {
        setOwnerInfo(remoteOwner);
      } else {
        // If remote config does not exist, initialize it with local values
        setOwnerInfo((currentLocal) => {
          if (currentLocal && currentLocal.name) {
            firestoreService.saveOwnerInfo(user.uid, currentLocal);
          }
          return currentLocal;
        });
      }
    });

    return () => unsubscribe();
  }, [user, setOwnerInfo]);

  // Wrap setOwnerInfo to save to Firestore immediately when called
  const updateOwnerInfo = (newInfo: OwnerInfo | ((prev: OwnerInfo) => OwnerInfo)) => {
    setOwnerInfo((prev) => {
      const updated = typeof newInfo === 'function' ? newInfo(prev) : newInfo;
      if (user) {
        firestoreService.saveOwnerInfo(user.uid, updated);
      }
      return updated;
    });
  };

  return {
    ownerInfo,
    setOwnerInfo: updateOwnerInfo,
  };
}
