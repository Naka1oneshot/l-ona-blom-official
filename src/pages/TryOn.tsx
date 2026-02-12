import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteFeature } from '@/hooks/useSiteFeature';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchProducts } from '@/lib/products';
import { Upload, Download, ShieldCheck, Loader2, FlaskConical, Sparkles, AlertTriangle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';

const ESTIMATED_TOTAL_S = 150; // ~2min30 based on real tests

const TryOnPage = () => {
  const { items } = useCart();
  const { language } = useLanguage();
  const { enabled: featureEnabled, config } = useSiteFeature('virtual_tryon');
  const { isAdmin } = useAuth();

  /* ── AI generation state ──────────────────────────────────── */
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState('');
  const [aiPercent, setAiPercent] = useState(0);
  const [aiElapsed, setAiElapsed] = useState(0);
  const aiStartRef = useRef<number>(0);
  const [aiResultUrl, setAiResultUrl] = useState<string | null>(null);
  const [aiConsented, setAiConsented] = useState(false);
  const [aiPhotoFile, setAiPhotoFile] = useState<File | null>(null);
  const aiPhotoRef = useRef<HTMLInputElement>(null);

  /* ── Admin AI test state ──────────────────────────────────── */
  const [adminAiGarmentUrl, setAdminAiGarmentUrl] = useState('');
  const [adminAiGarmentType, setAdminAiGarmentType] = useState<'upper_body' | 'lower_body' | 'dresses'>('upper_body');
  const adminAiGarmentRef = useRef<HTMLInputElement>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminSelectedProductId, setAdminSelectedProductId] = useState<string>('');

  // Fetch all products for admin gallery picker
  useEffect(() => {
    if (!isAdmin) return;
    fetchProducts().then(setAdminProducts);
  }, [isAdmin]);

  // Filter eligible AI items
  const eligibleItems = items.filter(item => {
    const p = item.product as any;
    return p.tryon_ai_enabled && p.tryon_garment_type;
  });

  /* ── AI generation ────────────────────────────────────────── */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const generateAi = useCallback(async (opts: {
    productId?: string;
    garmentImageUrl?: string;
    garmentType?: string;
    photoFile: File;
  }) => {
    setAiGenerating(true);
    setAiProgress(language === 'fr' ? 'Envoi de la photo…' : 'Uploading photo…');
    setAiResultUrl(null);
    setAiPercent(0);
    setAiElapsed(0);
    aiStartRef.current = Date.now();

    try {
      const base64 = await fileToBase64(opts.photoFile);

      const body: any = { userImageBase64: base64 };
      if (opts.productId) {
        body.productId = opts.productId;
      } else {
        body.garmentImageUrl = opts.garmentImageUrl;
        body.garmentType = opts.garmentType;
      }

      setAiProgress(language === 'fr' ? 'Soumission à l\'IA…' : 'Submitting to AI…');
      setAiPercent(5);

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const createRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-leffa/create`,
        { method: 'POST', headers, body: JSON.stringify(body) }
      );
      const createData = await createRes.json();
      if (!createRes.ok || !createData.request_id) {
        throw new Error(createData.error || 'Failed to submit');
      }

      setAiProgress(language === 'fr' ? 'Génération en cours…' : 'Generating…');
      setAiPercent(10);

      const requestId = createData.request_id;
      let attempts = 0;
      const maxAttempts = 120;

      const poll = async () => {
        while (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 2000));
          attempts++;

          const elapsedS = Math.round((Date.now() - aiStartRef.current) / 1000);
          setAiElapsed(elapsedS);
          const pct = Math.min(95, 10 + 85 * (1 - Math.exp(-elapsedS / (ESTIMATED_TOTAL_S * 0.6))));
          setAiPercent(Math.round(pct));

          const remainS = Math.max(0, Math.round(ESTIMATED_TOTAL_S - elapsedS));
          const remainMin = Math.floor(remainS / 60);
          const remainSec = remainS % 60;
          const eta = remainMin > 0 ? `${remainMin}min ${remainSec}s` : `${remainSec}s`;

          setAiProgress(language === 'fr'
            ? `Génération en cours… ~${eta} restant`
            : `Generating… ~${eta} remaining`);

          const statusRes = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tryon-leffa/status?requestId=${requestId}`,
            { headers }
          );
          const statusData = await statusRes.json();

          if (statusData.status === 'COMPLETED') {
            setAiPercent(100);
            if (statusData.image_url) {
              setAiResultUrl(statusData.image_url);
              setAiProgress('');
              toast.success(language === 'fr' ? 'Essayage IA terminé !' : 'AI try-on complete!');
            } else {
              throw new Error('No image returned');
            }
            return;
          }

          if (statusData.status === 'FAILED') {
            throw new Error('AI generation failed');
          }
        }
        throw new Error('Timeout');
      };

      await poll();
    } catch (err: any) {
      toast.error(err.message || 'Error');
      setAiProgress('');
    } finally {
      setAiGenerating(false);
    }
  }, [language]);

  return (
    <div className="min-h-screen bg-background pt-20 md:pt-24">
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <h1 className="text-display text-3xl md:text-4xl text-center mb-2">
          {language === 'fr' ? 'Essayage Virtuel IA' : 'AI Virtual Try-On'}
        </h1>
        <p className="text-center text-xs font-body text-muted-foreground mb-10 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} />
          {language === 'fr'
            ? 'Votre photo est envoyée à un service tiers sécurisé pour générer un essayage réaliste.'
            : 'Your photo is sent to a secure third-party service for realistic try-on rendering.'}
        </p>

        <div className="space-y-6">
          {/* ── Step 1: Consent ──────────────────────────────── */}
          <div className="border border-border p-5 space-y-3">
            <p className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
              {language === 'fr' ? 'Étape 1 — Consentement' : 'Step 1 — Consent'}
            </p>
            <label className="flex items-start gap-2 text-xs font-body text-foreground cursor-pointer">
              <input type="checkbox" checked={aiConsented} onChange={e => setAiConsented(e.target.checked)} className="accent-primary mt-0.5" />
              <span>
                <AlertTriangle size={10} className="inline mr-1 text-amber-500" />
                {language === 'fr'
                  ? 'J\'accepte que ma photo soit envoyée à un service tiers (fal.ai) pour l\'essayage.'
                  : 'I agree my photo will be sent to a third-party service (fal.ai) for try-on.'}
              </span>
            </label>
          </div>

          {/* ── Step 2: Upload photo ────────────────────────── */}
          <div className="border border-border p-5 space-y-3">
            <p className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
              {language === 'fr' ? 'Étape 2 — Votre photo' : 'Step 2 — Your photo'}
            </p>
            <button
              onClick={() => aiPhotoRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs tracking-wider uppercase font-body border-2 border-dashed border-border hover:border-primary/50 transition-colors"
            >
              <Upload size={14} />
              {aiPhotoFile
                ? aiPhotoFile.name
                : (language === 'fr' ? 'Choisir une photo de vous' : 'Choose a photo of yourself')}
            </button>
            <input ref={aiPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setAiPhotoFile(f); }} />
            {aiPhotoFile && (
              <img
                src={URL.createObjectURL(aiPhotoFile)}
                alt="Preview"
                className="w-full max-w-xs mx-auto aspect-[3/4] object-cover border border-border"
              />
            )}
          </div>

          {/* ── Step 3: Choose garment ──────────────────────── */}
          <div className="border border-border p-5 space-y-3">
            <p className="text-[10px] tracking-[0.2em] uppercase font-body text-muted-foreground">
              {language === 'fr' ? 'Étape 3 — Choisir un article' : 'Step 3 — Choose an item'}
            </p>

            {eligibleItems.length === 0 && (
              <p className="text-xs font-body text-muted-foreground">
                {language === 'fr'
                  ? 'Aucun article éligible dans votre panier. Ajoutez un produit avec essayage IA activé.'
                  : 'No eligible items in your cart. Add a product with AI try-on enabled.'}
              </p>
            )}

            {eligibleItems.map(item => {
              const p = item.product as any;
              const name = language === 'fr' ? p.name_fr : p.name_en;
              const imgUrl = p.tryon_garment_image_url || p.images?.[0];
              return (
                <div key={p.id} className="flex gap-3 items-center border border-border/50 p-3">
                  {imgUrl && <img src={imgUrl} alt={name} className="w-14 h-18 object-cover flex-shrink-0 border border-border" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground font-body uppercase">{p.tryon_garment_type}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!aiPhotoFile) { toast.error(language === 'fr' ? 'Uploadez votre photo.' : 'Upload your photo.'); return; }
                      if (!aiConsented) { toast.error(language === 'fr' ? 'Acceptez le consentement.' : 'Accept consent.'); return; }
                      generateAi({ productId: p.id, photoFile: aiPhotoFile });
                    }}
                    disabled={aiGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-wider uppercase font-body bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={12} /> {language === 'fr' ? 'Essayer' : 'Try On'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Progress bar ────────────────────────────────── */}
          {aiGenerating && (
            <div className="border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-body text-primary">
                <span className="flex items-center gap-2 animate-pulse">
                  <Loader2 size={14} className="animate-spin" /> {aiProgress}
                </span>
                <span className="text-muted-foreground font-mono">{aiPercent}%</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${aiPercent}%` }}
                />
              </div>
              {aiElapsed > 0 && (
                <p className="text-[10px] font-body text-muted-foreground text-right">
                  {language === 'fr'
                    ? `Écoulé : ${Math.floor(aiElapsed / 60)}min ${aiElapsed % 60}s`
                    : `Elapsed: ${Math.floor(aiElapsed / 60)}min ${aiElapsed % 60}s`}
                </p>
              )}
            </div>
          )}

          {/* ── Result ──────────────────────────────────────── */}
          {aiResultUrl && (
            <div className="border border-primary/30 p-5 space-y-4">
              <p className="text-[10px] tracking-[0.2em] uppercase font-body text-primary flex items-center gap-1.5">
                <Sparkles size={12} /> {language === 'fr' ? 'Résultat' : 'Result'}
              </p>
              <img src={aiResultUrl} alt="AI try-on result" className="w-full rounded border border-border" />
              <a
                href={aiResultUrl}
                download="essayage-ia.png"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs tracking-wider uppercase font-body bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download size={14} /> {language === 'fr' ? 'Télécharger' : 'Download'}
              </a>
            </div>
          )}

          {/* ── Admin AI test ───────────────────────────────── */}
          {isAdmin && (
            <div className="border border-primary/30 bg-primary/5 p-5 space-y-4">
              <p className="flex items-center gap-1.5 text-[10px] font-body font-medium text-primary">
                <FlaskConical size={12} /> <Sparkles size={12} /> {language === 'fr' ? 'Test IA admin' : 'Admin AI test'}
              </p>

              {/* Garment type */}
              <select value={adminAiGarmentType} onChange={e => setAdminAiGarmentType(e.target.value as any)} className="w-full text-xs font-body border border-border bg-background px-2 py-1.5">
                <option value="upper_body">upper_body (Haut)</option>
                <option value="lower_body">lower_body (Bas)</option>
                <option value="dresses">dresses (Robe)</option>
              </select>

              {/* ── Pick from product gallery ── */}
              <div className="space-y-2">
                <p className="text-[10px] tracking-[0.15em] uppercase font-body text-muted-foreground flex items-center gap-1">
                  <ImageIcon size={10} /> {language === 'fr' ? 'Choisir depuis un produit' : 'Pick from a product'}
                </p>
                <select
                  value={adminSelectedProductId}
                  onChange={e => setAdminSelectedProductId(e.target.value)}
                  className="w-full text-xs font-body border border-border bg-background px-2 py-1.5"
                >
                  <option value="">{language === 'fr' ? '— Sélectionner un produit —' : '— Select a product —'}</option>
                  {adminProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {language === 'fr' ? p.name_fr : p.name_en}
                    </option>
                  ))}
                </select>

                {(() => {
                  const selectedProduct = adminProducts.find(p => p.id === adminSelectedProductId);
                  if (!selectedProduct || !selectedProduct.images?.length) return null;
                  return (
                    <div className="grid grid-cols-4 gap-1.5">
                      {selectedProduct.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAdminAiGarmentUrl(imgUrl);
                            toast.success(language === 'fr' ? `Image ${idx + 1} sélectionnée` : `Image ${idx + 1} selected`);
                          }}
                          className={`relative aspect-[3/4] border-2 overflow-hidden transition-all ${adminAiGarmentUrl === imgUrl ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                        >
                          <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          {adminAiGarmentUrl === imgUrl && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Sparkles size={14} className="text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* ── Or upload custom garment ── */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-body">
                <div className="flex-1 h-px bg-border" />
                <span>{language === 'fr' ? 'ou uploader une image' : 'or upload an image'}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button onClick={() => adminAiGarmentRef.current?.click()} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] tracking-wider uppercase font-body border border-primary text-primary hover:bg-primary/10 transition-colors">
                <Upload size={12} /> {language === 'fr' ? 'Photo vêtement IA' : 'AI garment photo'}
              </button>
              <input ref={adminAiGarmentRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files?.[0];
                if (f) {
                  const filename = `admin-test/${Date.now()}-${f.name}`;
                  const { error } = await supabase.storage.from('images').upload(filename, f);
                  if (error) { toast.error(error.message); return; }
                  const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);
                  setAdminAiGarmentUrl(urlData.publicUrl);
                  toast.success(language === 'fr' ? 'Image uploadée' : 'Image uploaded');
                }
                e.target.value = '';
              }} />

              {/* Selected garment preview + run */}
              {adminAiGarmentUrl && (
                <>
                  <img src={adminAiGarmentUrl} alt="Garment" className="w-full h-24 object-contain border border-border rounded" />
                  <button
                    onClick={() => {
                      if (!aiPhotoFile) { toast.error(language === 'fr' ? 'Uploadez votre photo IA.' : 'Upload AI photo.'); return; }
                      if (!aiConsented) { toast.error(language === 'fr' ? 'Acceptez le consentement.' : 'Accept consent.'); return; }
                      generateAi({ garmentImageUrl: adminAiGarmentUrl, garmentType: adminAiGarmentType, photoFile: aiPhotoFile });
                    }}
                    disabled={aiGenerating}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] tracking-wider uppercase font-body bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={12} /> {language === 'fr' ? 'Lancer essayage IA' : 'Run AI try-on'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryOnPage;
