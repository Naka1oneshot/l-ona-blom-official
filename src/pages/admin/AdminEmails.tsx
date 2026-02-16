import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Send, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface WelcomeTemplate {
  key: string;
  enabled: boolean;
  subject_fr: string;
  subject_en: string;
  preheader_fr: string;
  preheader_en: string;
  body_fr: string;
  body_en: string;
  cta_label_fr: string;
  cta_label_en: string;
  cta_url: string;
  header_image_url: string;
}

const fieldLabels: Record<string, string> = {
  subject_fr: 'Sujet (FR)',
  subject_en: 'Subject (EN)',
  preheader_fr: 'Pré-header (FR)',
  preheader_en: 'Pre-header (EN)',
  body_fr: 'Corps (FR)',
  body_en: 'Body (EN)',
  cta_label_fr: 'Bouton CTA (FR)',
  cta_label_en: 'CTA Button (EN)',
  cta_url: 'URL du CTA',
  header_image_url: 'URL image/logo en-tête',
};

const defaultTemplate: WelcomeTemplate = {
  key: 'welcome',
  enabled: true,
  subject_fr: '',
  subject_en: '',
  preheader_fr: '',
  preheader_en: '',
  body_fr: '',
  body_en: '',
  cta_label_fr: 'Découvrir la boutique',
  cta_label_en: 'Explore the boutique',
  cta_url: '/boutique',
  header_image_url: '',
};

const AdminEmails = () => {
  const [tpl, setTpl] = useState<WelcomeTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [previewLang, setPreviewLang] = useState<'fr' | 'en'>('fr');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    const { data, error } = await supabase
      .from('site_emails_templates')
      .select('*')
      .eq('key', 'welcome')
      .maybeSingle();
    if (data) setTpl(data as unknown as WelcomeTemplate);
    if (error) toast.error(error.message);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { key, ...rest } = tpl;
    const { error } = await supabase
      .from('site_emails_templates')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('key', 'welcome');
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Template sauvegardé');
  }

  async function handleTestSend() {
    if (!testEmail) { toast.error('Entrez une adresse email'); return; }
    setSendingTest(true);
    try {
      const res = await supabase.functions.invoke('send-welcome-email', {
        body: {
          user_id: 'test-' + Date.now(),
          email: testEmail,
          locale: previewLang,
          first_name: 'Test',
          test_mode: true,
          test_email: testEmail,
        },
      });
      if (res.error) throw res.error;
      const data = res.data as any;
      if (data?.success) toast.success('Email test envoyé !');
      else if (data?.error) toast.error(data.error);
      else toast.success('Email test envoyé !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur envoi test');
    }
    setSendingTest(false);
  }

  function updateField(field: keyof WelcomeTemplate, value: any) {
    setTpl(prev => ({ ...prev, [field]: value }));
  }

  const inputClass = "w-full border border-border bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary transition-colors";

  if (loading) return <p className="text-sm font-body text-muted-foreground py-8 text-center">Chargement…</p>;

  const previewBody = previewLang === 'fr' ? tpl.body_fr : (tpl.body_en || tpl.body_fr);
  const previewBodyProcessed = previewBody
    .replace('{{first_name_or_cher_tresor}}', 'Marie')
    .replace('{{first_name_or_dear}}', 'Marie')
    .replace('{{cta_url}}', tpl.cta_url)
    .replace('{{account_url}}', '/compte');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-display text-3xl">Emails</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground">Email de bienvenue</span>
          <Switch checked={tpl.enabled} onCheckedChange={(v) => updateField('enabled', v)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor */}
        <div className="space-y-5">
          {(['subject_fr', 'subject_en', 'preheader_fr', 'preheader_en'] as const).map(field => (
            <div key={field}>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground">{fieldLabels[field]}</label>
              <input
                type="text"
                value={tpl[field]}
                onChange={e => updateField(field, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}

          {(['body_fr', 'body_en'] as const).map(field => (
            <div key={field}>
              <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground">{fieldLabels[field]}</label>
              <textarea
                value={tpl[field]}
                onChange={e => updateField(field, e.target.value)}
                className={inputClass + ' min-h-[200px] resize-y font-mono text-xs'}
              />
              <p className="text-[10px] font-body text-muted-foreground mt-1">
                Variables : {'{{first_name_or_cher_tresor}}'} · {'{{first_name_or_dear}}'} · {'{{cta_url}}'} · {'{{account_url}}'}
              </p>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            {(['cta_label_fr', 'cta_label_en'] as const).map(field => (
              <div key={field}>
                <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground">{fieldLabels[field]}</label>
                <input type="text" value={tpl[field]} onChange={e => updateField(field, e.target.value)} className={inputClass} />
              </div>
            ))}
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground">{fieldLabels.cta_url}</label>
            <input type="text" value={tpl.cta_url} onChange={e => updateField('cta_url', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground">{fieldLabels.header_image_url}</label>
            <input type="text" value={tpl.header_image_url} onChange={e => updateField('header_image_url', e.target.value)} className={inputClass} placeholder="https://… (optionnel)" />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-body hover:bg-primary transition-colors disabled:opacity-50"
            >
              <Save size={13} /> {saving ? '…' : 'Enregistrer'}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 border border-border px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-body hover:border-foreground transition-colors"
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Masquer aperçu' : 'Aperçu'}
            </button>
          </div>

          {/* Test send */}
          <div className="border border-border p-4 mt-2">
            <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground mb-3">Envoyer un test</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="email@test.com"
                className={inputClass + ' flex-1'}
              />
              <select
                value={previewLang}
                onChange={e => setPreviewLang(e.target.value as 'fr' | 'en')}
                className="border border-border bg-transparent px-2 py-1 text-xs font-body"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
              <button
                onClick={handleTestSend}
                disabled={sendingTest}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 text-[10px] tracking-wider uppercase font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={12} /> {sendingTest ? '…' : 'Test'}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="border border-border bg-[#f7f5f2] p-4 overflow-auto max-h-[80vh]">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setPreviewLang('fr')}
                className={`px-3 py-1 text-[10px] tracking-wider uppercase font-body border ${previewLang === 'fr' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
              >FR</button>
              <button
                onClick={() => setPreviewLang('en')}
                className={`px-3 py-1 text-[10px] tracking-wider uppercase font-body border ${previewLang === 'en' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground'}`}
              >EN</button>
            </div>
            <div className="bg-white border border-[#e8e4df] max-w-[500px] mx-auto">
              {/* Header */}
              <div className="p-6 text-center border-b border-[#e8e4df]">
                {tpl.header_image_url && <img src={tpl.header_image_url} alt="" className="max-w-[140px] h-auto mx-auto mb-2" />}
                <h1 className="text-lg tracking-[0.15em] uppercase" style={{ fontFamily: 'Georgia, serif', fontWeight: 400, color: '#1a1a1a' }}>LÉONA BLOM</h1>
              </div>
              {/* Body */}
              <div className="p-6">
                <div className="whitespace-pre-line text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif', color: '#333' }}>
                  {previewBodyProcessed}
                </div>
                <div className="text-center mt-8">
                  <span className="inline-block px-8 py-3 text-xs tracking-[0.1em] uppercase text-white" style={{ backgroundColor: '#981D70', fontFamily: 'Georgia, serif' }}>
                    {previewLang === 'fr' ? tpl.cta_label_fr : (tpl.cta_label_en || tpl.cta_label_fr)}
                  </span>
                </div>
              </div>
              {/* Footer */}
              <div className="p-4 text-center border-t border-[#e8e4df]">
                <p className="text-[10px] tracking-[0.12em] uppercase" style={{ color: '#aaa', fontFamily: 'Georgia, serif' }}>LÉONA BLOM — Maison de création</p>
                <p className="text-[10px] mt-1" style={{ color: '#981D70', fontFamily: 'Georgia, serif' }}>contact@leonablom.com</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <EmailStats />
    </div>
  );
};

function EmailStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('user_emails_log')
      .select('id', { count: 'exact', head: true })
      .not('welcome_sent_at', 'is', null)
      .then(({ count: c }) => setCount(c ?? 0));
  }, []);

  if (count === null) return null;

  return (
    <div className="mt-10 pt-6 border-t border-border">
      <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground">
        Emails de bienvenue envoyés : <span className="text-foreground font-medium">{count}</span>
      </p>
    </div>
  );
}

export default AdminEmails;
