import {
    doc,
    setDoc,
    getDoc,
    collection,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { Tenant } from "@/types/tenant";

const convertTimestamps = (data: any): any => {
    if (!data || typeof data !== 'object') return data;

    // Handle Firestore Timestamp
    if (data.seconds !== undefined && data.nanoseconds !== undefined && typeof data.toDate === 'function') {
        return data.toDate();
    }

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(convertTimestamps);
    }

    // Handle Objects
    const result: any = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            result[key] = convertTimestamps(data[key]);
        }
    }
    return result;
};

export const firestoreService = {
    // Sync Tenants
    async saveTenants(uid: string, tenants: Tenant[]) {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { tenants }, { merge: true });
    },

    listenToTenants(uid: string, callback: (tenants: Tenant[]) => void) {
        const userDocRef = doc(db, "users", uid);
        return onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback(convertTimestamps(data.tenants || []));
            }
        });
    },

    // Sync Billing State
    async saveBillingState(uid: string, billingState: any) {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { billingState }, { merge: true });
    },

    listenToBillingState(uid: string, callback: (state: any) => void) {
        const userDocRef = doc(db, "users", uid);
        return onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback(convertTimestamps(data.billingState || {}));
            }
        });
    },

    // Sync Owner Info
    async saveOwnerInfo(uid: string, ownerInfo: any) {
        const userDocRef = doc(db, "users", uid);
        await setDoc(userDocRef, { ownerInfo }, { merge: true });
    },

    listenToOwnerInfo(uid: string, callback: (ownerInfo: any) => void) {
        const userDocRef = doc(db, "users", uid);
        return onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback(data.ownerInfo || null);
            }
        });
    },

    // Public Tenant Views
    async publishPublicTenantView(landlordUid: string, tenantId: string, data: any) {
        const viewDocRef = doc(db, "public_tenant_views", tenantId);
        await setDoc(viewDocRef, { ...data, landlordUid }, { merge: true });
    },

    async getPublicTenantView(tenantId: string) {
        const viewDocRef = doc(db, "public_tenant_views", tenantId);
        const docSnap = await getDoc(viewDocRef);
        if (docSnap.exists()) {
            return convertTimestamps(docSnap.data());
        }
        return null;
    },

    listenToPublicTenantView(tenantId: string, callback: (data: any) => void) {
        const viewDocRef = doc(db, "public_tenant_views", tenantId);
        return onSnapshot(viewDocRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(convertTimestamps(docSnap.data()));
            } else {
                callback(null);
            }
        });
    },

    async updatePublicTenantToken(tenantId: string, fcmToken: string) {
        const viewDocRef = doc(db, "public_tenant_views", tenantId);
        await setDoc(viewDocRef, { fcmToken }, { merge: true });
    },

    async requestPushNotification(tenantId: string, landlordUid: string, message: string) {
        const reqRef = doc(collection(db, "notification_requests"));
        await setDoc(reqRef, {
            tenantId,
            landlordUid,
            message,
            timestamp: new Date()
        });
    }
};
