import { useState } from 'react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSubmitContactMessage } from '@/hooks/useContactPage';
import type { ContactPageData } from '@/hooks/useContactPage';

interface Props {
  data: ContactPageData;
  language: 'fr' | 'en';
}

const l = (fr: string, en: string, lang: string) => (lang === 'en' && en ? en : fr);

const ContactForm = ({ data, language }: Props) => {
  const { form: formConfig } = data;
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const submitMutation = useSubmitContactMessage();

  if (!formConfig.enabled) return null;

  const labels = {
    name: language === 'en' ? 'Name' : 'Nom',
    email: 'Email',
    subject: language === 'en' ? 'Subject' : 'Sujet',
    message: 'Message',
    send: language === 'en' ? 'Send' : 'Envoyer',
    success: language === 'en' ? 'Message sent successfully.' : 'Message envoyé avec succès.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!consent) {
      toast.error(language === 'en' ? 'Please accept the consent.' : 'Veuillez accepter le consentement.');
      return;
    }

    try {
      await submitMutation.mutateAsync({
        ...form,
        locale: language,
        consent,
      });
      toast.success(labels.success);
      setForm({ name: '', email: '', subject: '', message: '' });
      setConsent(false);
    } catch {
      toast.error(language === 'en' ? 'An error occurred.' : 'Une erreur est survenue.');
    }
  };

  const inputCls = 'w-full border border-foreground/15 bg-transparent px-4 py-3.5 text-sm font-body tracking-wider focus:outline-none focus:border-primary/60 transition-colors duration-300';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.15 }}
    >
      <h2 className="text-display text-2xl md:text-3xl tracking-wider mb-2">
        {l(formConfig.title_fr, formConfig.title_en, language)}
      </h2>
      <Separator className="bg-border/50 my-6" />

      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2 text-foreground/60">{labels.name}</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} required maxLength={100} />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2 text-foreground/60">{labels.email}</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} required maxLength={255} />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2 text-foreground/60">{labels.subject}</label>
          <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputCls} required maxLength={200} />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-2 text-foreground/60">{labels.message}</label>
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className={`${inputCls} min-h-[140px] resize-none`} required maxLength={2000} />
        </div>

        {/* GDPR consent */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-1 accent-primary" />
          <span className="text-xs font-body text-foreground/60 leading-relaxed group-hover:text-foreground/80 transition-colors">
            {l(formConfig.consent_fr, formConfig.consent_en, language)}
          </span>
        </label>

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.25em] uppercase font-body hover:bg-accent/80 transition-colors duration-300 disabled:opacity-50"
        >
          {submitMutation.isPending ? '...' : labels.send}
        </button>
      </form>
    </motion.div>
  );
};

export default ContactForm;
