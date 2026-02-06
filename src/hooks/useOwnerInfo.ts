import { useLocalStorage } from './useLocalStorage';
import { OwnerInfo } from '@/types/tenant';

const STORAGE_KEY = 'rentmate_owner';

const defaultOwner: OwnerInfo = {
  name: '',
  mobileNumber: '',
  upiId: '',
};

export function useOwnerInfo() {
  const [ownerInfo, setOwnerInfo] = useLocalStorage<OwnerInfo>(STORAGE_KEY, defaultOwner);

  return {
    ownerInfo,
    setOwnerInfo,
  };
}
