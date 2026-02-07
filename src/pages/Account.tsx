import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LogOut, User, MapPin, Package, Shield } from 'lucide-react';

const Account = () => {
  const { t } = useLanguage();
  const { user, signOut, isAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' });

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadOrders();
  }, [user]);

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setForm({ first_name: data.first_name || '', last_name: data.last_name || '', phone: data.phone || '' });
    }
  }

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('user_id', user!.id);
    if (error) {
      toast.error(t('auth.error'));
    } else {
      toast.success(t('account.saved'));
      setEditing(false);
      loadProfile();
    }
  }

  const inputClass = "w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors";
  const statusColors: Record<string, string> = {
    NEW: 'bg-muted text-muted-foreground',
    PAID: 'bg-primary/10 text-primary',
    PREPARING: 'bg-accent/20 text-accent-foreground',
    SHIPPED: 'bg-primary/20 text-primary',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="pt-20 md:pt-24">
      <section className="luxury-container luxury-section max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <h1 className="text-display text-3xl md:text-5xl">{t('nav.account')}</h1>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-body border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Shield size={14} />
                  Admin
                </Link>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-xs tracking-[0.15em] uppercase font-body border border-foreground/20 hover:border-destructive hover:text-destructive transition-colors"
              >
                <LogOut size={14} />
                {t('auth.logout')}
              </button>
            </div>
          </div>

          {/* Profile */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <User size={16} />
              <h2 className="text-display text-2xl">{t('account.profile')}</h2>
            </div>
            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.first_name')}</label>
                    <input type="text" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('auth.last_name')}</label>
                    <input type="text" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('account.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-foreground text-background px-6 py-3 text-xs tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors">{t('account.save')}</button>
                  <button type="button" onClick={() => setEditing(false)} className="border border-foreground/20 px-6 py-3 text-xs tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors">{t('account.cancel')}</button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-sm font-body text-muted-foreground mb-1">{profile?.email}</p>
                <p className="text-sm font-body">{profile?.first_name} {profile?.last_name}</p>
                {profile?.phone && <p className="text-sm font-body text-muted-foreground">{profile.phone}</p>}
                <button onClick={() => setEditing(true)} className="mt-4 text-xs tracking-[0.15em] uppercase font-body text-primary hover:underline">{t('account.edit')}</button>
              </div>
            )}
          </div>

          {/* Orders */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Package size={16} />
              <h2 className="text-display text-2xl">{t('account.orders')}</h2>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm font-body text-muted-foreground">{t('account.no_orders')}</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-foreground/10 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-body text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                      <span className={`text-[10px] tracking-[0.15em] uppercase font-body px-3 py-1 ${statusColors[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-body">
                      {order.currency} {(order.total / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Account;
