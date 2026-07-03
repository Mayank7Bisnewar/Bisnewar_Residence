import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Key, User, Info, ArrowRight, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, loginAsGuest, loginAsTenant } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'options' | 'email-login' | 'email-signup' | 'tenant'>('options');

  // Form states
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey) return;
    loginAsTenant(accessKey.trim());
    navigate('/');
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/');
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-6 md:p-8 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-logo text-3xl font-bold tracking-tight text-foreground">TENANT</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage with ease</p>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'options' && (
            <motion.div
              key="options"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <Button
                onClick={handleGoogleAuth}
                variant="outline"
                className="w-full h-12 justify-start gap-3 bg-background/50 hover:bg-background"
                disabled={loading}
              >
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left">Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                onClick={() => setMode('tenant')}
                variant="outline"
                className="w-full h-12 justify-start gap-3 bg-background/50 hover:bg-background"
              >
                <Key className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 text-left">Tenant Access</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
                </div>
              </div>

              <Button
                onClick={handleGuestLogin}
                variant="secondary"
                className="w-full h-12 gap-2"
              >
                <User className="w-4 h-4" />
                Continue as Guest
              </Button>

              <Alert className="mt-6 bg-primary/5 border-primary/20 text-primary-foreground">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">Important</AlertTitle>
                <AlertDescription className="text-xs text-primary/80 mt-1">
                  Sign in with an account to take a secure cloud backup of your data. Guest accounts store data locally only.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}



          {mode === 'tenant' && (
            <motion.div
              key="tenant"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <h3 className="font-semibold text-lg">Tenant Portal</h3>
                <p className="text-xs text-muted-foreground">Enter the access key provided by your landlord to view your rent details.</p>
              </div>

              <form onSubmit={handleTenantAccess} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Access Key</label>
                  <Input
                    type="text"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="e.g. TENT-1234-ABCD"
                    className="h-12 bg-background/50 font-mono text-center tracking-wider"
                    required
                  />
                </div>

                <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
                  Access Dashboard
                </Button>
              </form>

              <div className="flex justify-center pt-2">
                <Button variant="ghost" size="sm" onClick={() => setMode('options')} className="text-muted-foreground">
                  Back to options
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
