import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    tenantAccessKey: string | null;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    loginAsGuest: () => void;
    loginAsTenant: (key: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem('isGuest') === 'true');
    const [tenantAccessKey, setTenantAccessKey] = useState<string | null>(() => localStorage.getItem('tenantAccessKey'));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Safety timeout: if Firebase auth doesn't resolve in 5s, stop loading anyway
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        // Initialize GoogleAuth for native
        if (Capacitor.isNativePlatform()) {
            try {
                GoogleAuth.initialize();
            } catch (e) {
                console.warn('GoogleAuth init failed (non-critical):', e);
            }
        }

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const loginWithGoogle = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                const googleUser = await GoogleAuth.signIn();
                const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
                await signInWithCredential(auth, credential);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
            toast.success("Successfully logged in!");
            
            // Show interstitial ad after successful login
            const { showInterstitialAd } = await import('@/lib/admob');
            showInterstitialAd();
        } catch (error: any) {
            console.error("Login failed:", error);

            // Helpful error messages
            if (error.code === 'auth/popup-blocked') {
                toast.error("Popup blocked! Please allow popups for this site.");
            } else if (error.code === 'auth/unauthorized-domain') {
                toast.error("This domain is not authorized for login. Check Firebase Console.");
            } else {
                toast.error(`Login failed: ${error.message || 'Unknown error'}`);
            }
            throw error;
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            toast.success("Successfully logged in!");
            const { showInterstitialAd } = await import('@/lib/admob');
            showInterstitialAd();
        } catch (error: any) {
            console.error("Email login failed:", error);
            toast.error(`Login failed: ${error.message || 'Unknown error'}`);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            toast.success("Account created successfully!");
            const { showInterstitialAd } = await import('@/lib/admob');
            showInterstitialAd();
        } catch (error: any) {
            console.error("Signup failed:", error);
            toast.error(`Signup failed: ${error.message || 'Unknown error'}`);
            throw error;
        }
    };

    const loginAsGuest = () => {
        localStorage.setItem('isGuest', 'true');
        setIsGuest(true);
    };

    const loginAsTenant = (key: string) => {
        localStorage.setItem('tenantAccessKey', key);
        setTenantAccessKey(key);
    };

    const logout = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                await GoogleAuth.signOut();
            }
            await signOut(auth);
            localStorage.removeItem('isGuest');
            localStorage.removeItem('tenantAccessKey');
            setIsGuest(false);
            setTenantAccessKey(null);
            toast.success("Logged out successfully.");
        } catch (error) {
            console.error("Logout failed:", error);
            toast.error("Failed to logout.");
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, loading, isGuest, tenantAccessKey, 
            loginWithGoogle, loginWithEmail, signUpWithEmail, 
            loginAsGuest, loginAsTenant, logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
