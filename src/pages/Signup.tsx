import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Signup = () => {
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(form.email, form.password, form.firstName, form.lastName);
    setSubmitting(false);
    if (error) {
      toast.error(error.message || t('auth.error'));
    } else {
      toast.success(t('auth.check_email'));
    }
  };

  const inputClass = "w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-display text-4xl md:text-5xl text-center mb-12">{t('auth.signup')}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.first_name')}</label>
                <input type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} className={inputClass} required />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.last_name')}</label>
                <input type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} className={inputClass} required />
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClass} required minLength={6} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background py-4 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors duration-300 disabled:opacity-50"
            >
              {submitting ? '...' : t('auth.signup')}
            </button>
          </form>

          <p className="text-center text-sm font-body text-muted-foreground mt-8">
            {t('auth.has_account')}{' '}
            <Link to="/connexion" className="text-primary hover:underline">{t('auth.login')}</Link>
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Signup;
