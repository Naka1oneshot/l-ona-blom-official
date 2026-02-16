import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, LogIn, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface CheckoutGateDialogProps {
  open: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

const CheckoutGateDialog: React.FC<CheckoutGateDialogProps> = ({ open, onClose, onContinueAsGuest }) => {
  const { language, t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(t('auth.error'));
    } else {
      toast.success(t('auth.welcome'));
      onClose();
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin + '/panier',
    });
    if (error) {
      toast.error(language === 'fr' ? 'Erreur de connexion Google' : 'Google sign-in error');
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth('apple', {
      redirect_uri: window.location.origin + '/panier',
    });
    if (error) {
      toast.error(language === 'fr' ? 'Erreur de connexion Apple' : 'Apple sign-in error');
      setAppleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="relative bg-background border border-foreground/10 w-full max-w-md p-8 sm:p-10 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <LogIn size={24} className="mx-auto mb-4 text-primary" />
              <h2 className="text-display text-2xl mb-2">
                {language === 'fr' ? 'Avant de continuer' : 'Before you continue'}
              </h2>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">
                {language === 'fr'
                  ? 'Connectez-vous pour un meilleur suivi de votre commande et accéder à votre historique.'
                  : 'Sign in for better order tracking and to access your order history.'}
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5">{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-foreground/20 bg-transparent px-4 py-2.5 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-foreground/20 bg-transparent px-4 py-2.5 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors duration-300 disabled:opacity-50"
              >
                {submitting ? '...' : t('auth.login')}
              </button>
            </form>

            {/* OAuth divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-foreground/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground">
                  {language === 'fr' ? 'ou' : 'or'}
                </span>
              </div>
            </div>

            {/* OAuth buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 border border-foreground/20 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-muted/50 transition-colors duration-300 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {googleLoading ? '...' : language === 'fr' ? 'Continuer avec Google' : 'Continue with Google'}
              </button>

              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={appleLoading}
                className="w-full flex items-center justify-center gap-2.5 border border-foreground/20 py-2.5 text-xs tracking-[0.15em] uppercase font-body hover:bg-muted/50 transition-colors duration-300 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                {appleLoading ? '...' : language === 'fr' ? 'Continuer avec Apple' : 'Continue with Apple'}
              </button>
            </div>

            {/* Signup link */}
            <p className="text-center text-xs font-body text-muted-foreground mt-4">
              {language === 'fr' ? 'Pas encore de compte ?' : 'No account yet?'}{' '}
              <Link to="/inscription" className="text-primary hover:underline">
                {t('auth.signup')}
              </Link>
            </p>

            {/* Guest continue */}
            <div className="mt-6 pt-6 border-t border-foreground/10">
              <button
                onClick={onContinueAsGuest}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs tracking-[0.15em] uppercase font-body text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                {language === 'fr' ? 'Continuer sans compte' : 'Continue as guest'}
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutGateDialog;
