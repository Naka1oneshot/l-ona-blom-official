import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useSaveContactPage, type ContactPageData, type ContactSocial } from '@/hooks/useContactPage';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Trash2, Camera, Crop } from 'lucide-react';
import { toast } from 'sonner';
import ImageCropper from '@/components/admin/ImageCropper';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  data: ContactPageData;
}

const ContactEditDrawer = ({ open, onOpenChange, data }: Props) => {
  const [draft, setDraft] = useState<ContactPageData>(structuredClone(data));
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'hero' | 'atelier'>('hero');
  const saveMutation = useSaveContactPage();

  const set = <K extends keyof ContactPageData>(section: K, value: ContactPageData[K]) =>
    setDraft(prev => ({ ...prev, [section]: value }));

  const handleSave = async () => {
    await saveMutation.mutateAsync(draft);
    onOpenChange(false);
  };

  const labelCls = 'text-[10px] tracking-[0.15em] uppercase font-body text-foreground/50 block mb-1.5';
  const inputCls = 'w-full border border-foreground/15 bg-transparent px-3 py-2 text-sm font-body focus:outline-none focus:border-primary/50 transition-colors';
  const textareaCls = `${inputCls} min-h-[70px] resize-none`;

  const addSocial = () => {
    const newSocial: ContactSocial = { key: `custom_${Date.now()}`, label: '', url: '', enabled: true, order: draft.socials.length + 1 };
    set('socials', [...draft.socials, newSocial]);
  };

  const updateSocial = (i: number, patch: Partial<ContactSocial>) => {
    const copy = [...draft.socials];
    copy[i] = { ...copy[i], ...patch };
    set('socials', copy);
  };

  const removeSocial = (i: number) => set('socials', draft.socials.filter((_, idx) => idx !== i));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-background">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-display text-xl tracking-wider">Modifier la page Contact</SheetTitle>
        </SheetHeader>

        {/* Lang toggle */}
        <div className="flex gap-2 mb-6">
          {(['fr', 'en'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 text-xs font-body tracking-wider border transition-colors ${lang === l ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/20 text-foreground/60'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* HERO */}
        <Section title="Hero">
          <ImageUploadField
            label="Image hero"
            value={draft.hero.image_url}
            folder="contact"
            onChange={url => set('hero', { ...draft.hero, image_url: url })}
            onCrop={url => { setCropTarget('hero'); setCropSrc(url); }}
          />
          <label className={labelCls}>Titre ({lang.toUpperCase()})</label>
          <input value={lang === 'fr' ? draft.hero.title_fr : draft.hero.title_en} onChange={e => set('hero', { ...draft.hero, [lang === 'fr' ? 'title_fr' : 'title_en']: e.target.value })} className={inputCls} />
          <label className={labelCls}>Sous-titre ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.hero.subtitle_fr : draft.hero.subtitle_en} onChange={e => set('hero', { ...draft.hero, [lang === 'fr' ? 'subtitle_fr' : 'subtitle_en']: e.target.value })} className={textareaCls} />
        </Section>

        {/* COORDINATES */}
        <Section title="Coordonnées">
          <label className={labelCls}>Email</label>
          <input value={draft.coordinates.email} onChange={e => set('coordinates', { ...draft.coordinates, email: e.target.value })} className={inputCls} type="email" />
          <label className={labelCls}>Téléphone</label>
          <input value={draft.coordinates.phone} onChange={e => set('coordinates', { ...draft.coordinates, phone: e.target.value })} className={inputCls} />
          <label className={labelCls}>Adresse ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.coordinates.address_fr : draft.coordinates.address_en} onChange={e => set('coordinates', { ...draft.coordinates, [lang === 'fr' ? 'address_fr' : 'address_en']: e.target.value })} className={textareaCls} />
          <label className={labelCls}>Horaires ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.coordinates.hours_fr : draft.coordinates.hours_en} onChange={e => set('coordinates', { ...draft.coordinates, [lang === 'fr' ? 'hours_fr' : 'hours_en']: e.target.value })} className={textareaCls} />
        </Section>

        {/* PRESS */}
        <Section title="Presse & Collaborations">
          <label className={labelCls}>Email presse</label>
          <input value={draft.press.email} onChange={e => set('press', { ...draft.press, email: e.target.value })} className={inputCls} />
          <label className={labelCls}>Texte ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.press.text_fr : draft.press.text_en} onChange={e => set('press', { ...draft.press, [lang === 'fr' ? 'text_fr' : 'text_en']: e.target.value })} className={textareaCls} />
        </Section>

        {/* SOCIALS */}
        <Section title="Réseaux sociaux">
          <div className="space-y-3">
            {draft.socials.map((s, i) => (
              <div key={s.key} className="border border-foreground/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input value={s.label} onChange={e => updateSocial(i, { label: e.target.value })} className={`${inputCls} flex-1 mr-2`} placeholder="Label" />
                  <div className="flex items-center gap-2">
                    <Switch checked={s.enabled} onCheckedChange={v => updateSocial(i, { enabled: v })} />
                    <button onClick={() => removeSocial(i)} className="text-destructive/60 hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
                <input value={s.url} onChange={e => updateSocial(i, { url: e.target.value })} className={inputCls} placeholder="https://..." />
              </div>
            ))}
            <button onClick={addSocial} className="flex items-center gap-1.5 text-xs font-body text-primary/70 hover:text-primary transition-colors tracking-wider">
              <Plus size={14} /> Ajouter un réseau
            </button>
          </div>
        </Section>

        {/* FORM */}
        <Section title="Formulaire de contact">
          <div className="flex items-center gap-3 mb-3">
            <Switch checked={draft.form.enabled} onCheckedChange={v => set('form', { ...draft.form, enabled: v })} />
            <span className="text-xs font-body text-foreground/60">Activé</span>
          </div>
          <label className={labelCls}>Titre ({lang.toUpperCase()})</label>
          <input value={lang === 'fr' ? draft.form.title_fr : draft.form.title_en} onChange={e => set('form', { ...draft.form, [lang === 'fr' ? 'title_fr' : 'title_en']: e.target.value })} className={inputCls} />
          <label className={labelCls}>Consentement ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.form.consent_fr : draft.form.consent_en} onChange={e => set('form', { ...draft.form, [lang === 'fr' ? 'consent_fr' : 'consent_en']: e.target.value })} className={textareaCls} />
        </Section>

        {/* ATELIER */}
        <Section title="Bloc Atelier">
          <ImageUploadField
            label="Image atelier"
            value={draft.atelier.image_url}
            folder="contact"
            onChange={url => set('atelier', { ...draft.atelier, image_url: url })}
            onCrop={url => { setCropTarget('atelier'); setCropSrc(url); }}
          />
          <label className={labelCls}>Titre ({lang.toUpperCase()})</label>
          <input value={lang === 'fr' ? draft.atelier.title_fr : draft.atelier.title_en} onChange={e => set('atelier', { ...draft.atelier, [lang === 'fr' ? 'title_fr' : 'title_en']: e.target.value })} className={inputCls} />
          <label className={labelCls}>Texte ({lang.toUpperCase()})</label>
          <textarea value={lang === 'fr' ? draft.atelier.text_fr : draft.atelier.text_en} onChange={e => set('atelier', { ...draft.atelier, [lang === 'fr' ? 'text_fr' : 'text_en']: e.target.value })} className={textareaCls} />
        </Section>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pb-6">
          <button onClick={() => onOpenChange(false)} className="flex-1 border border-foreground/20 py-3 text-xs font-body tracking-[0.2em] uppercase hover:bg-muted transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-primary text-primary-foreground py-3 text-xs font-body tracking-[0.2em] uppercase hover:bg-accent/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
        {/* Cropper dialog */}
        {cropSrc && (
          <ImageCropper
            open
            src={cropSrc}
            aspectRatio={cropTarget === 'hero' ? 16 / 7 : 3 / 4}
            onCancel={() => setCropSrc(null)}
            onCropComplete={async (blob) => {
              setCropSrc(null);
              const path = `contact/${Date.now()}-crop.webp`;
              const { error } = await supabase.storage.from('images').upload(path, blob, { cacheControl: '31536000', upsert: false });
              if (error) { toast.error(error.message); return; }
              const { data: d } = supabase.storage.from('images').getPublicUrl(path);
              if (cropTarget === 'hero') {
                set('hero', { ...draft.hero, image_url: d.publicUrl });
              } else {
                set('atelier', { ...draft.atelier, image_url: d.publicUrl });
              }
              toast.success('Image recadrée');
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-xs font-body tracking-[0.15em] uppercase text-foreground/80 mb-3">{title}</h3>
    <div className="space-y-3">{children}</div>
    <Separator className="bg-border/30 mt-5" />
  </div>
);

/** Inline image upload field for the drawer */
const ImageUploadField = ({ label, value, folder, onChange, onCrop }: { label: string; value: string; folder: string; onChange: (url: string) => void; onCrop?: (url: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <span className="text-[10px] tracking-[0.15em] uppercase font-body text-foreground/50 block mb-1.5">{label}</span>
      {value && (
        <div className="relative mb-2">
          <img src={value} alt={label} className="w-full h-32 object-cover border border-foreground/10" />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            {onCrop && (
              <button
                type="button"
                onClick={() => onCrop(value)}
                className="w-6 h-6 flex items-center justify-center bg-primary/90 text-primary-foreground rounded-full hover:bg-primary transition-colors"
                title="Recadrer"
              >
                <Crop size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange('')}
              className="w-6 h-6 flex items-center justify-center bg-destructive/90 text-destructive-foreground rounded-full hover:bg-destructive transition-colors"
              title="Supprimer l'image"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-body tracking-wider border border-foreground/20 hover:bg-muted transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        {uploading ? 'Envoi…' : value ? 'Changer' : 'Importer'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

export default ContactEditDrawer;
