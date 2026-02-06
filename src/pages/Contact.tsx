import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { siteConfig } from '@/lib/siteConfig';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

const Contact = () => {
  const { language, t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setSending(true);
    // For now, toast-only. Edge function for real sending to be added with Resend integration.
    await new Promise(r => setTimeout(r, 600));
    toast.success(t('contact.success'));
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title={t('contact.title')}
        description={language === 'fr' ? 'Contactez la maison LÉONA BLOM.' : 'Contact LÉONA BLOM.'}
        path="/contact"
      />
      <section className="luxury-container luxury-section max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-4">{t('contact.title')}</h1>
          <p className="text-center text-sm font-body text-muted-foreground mb-12">{siteConfig.contactEmail}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('contact.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('contact.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('contact.subject')}</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2">{t('contact.message')}</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="w-full border border-foreground/20 bg-transparent px-4 py-3 text-sm font-body tracking-wider focus:outline-none focus:border-primary transition-colors min-h-[150px] resize-none"
                required
                maxLength={1000}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-body hover:bg-luxury-magenta-light transition-colors duration-300 disabled:opacity-50"
            >
              {sending ? '...' : t('contact.send')}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
