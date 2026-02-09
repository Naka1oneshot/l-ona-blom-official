import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditableImageProps {
  settingsKey: string;
  currentSrc: string;
  alt: string;
  className?: string;
  folder?: string;
  priority?: boolean;
}

const BUCKET = 'images';

const EditableImage = ({ settingsKey, currentSrc, alt, className = '', folder = 'hero', priority = false }: EditableImageProps) => {
  const { isAdmin } = useAuth();
  const [src, setSrc] = useState<string | null>(null); // null = loading
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved URL from site_settings on mount — don't show anything until resolved
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'string' && data.value.startsWith('http')) {
          setSrc(data.value as string);
        } else {
          setSrc(currentSrc); // fallback to default
        }
      });
  }, [settingsKey, currentSrc]);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      toast.error(`Erreur upload: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = data.publicUrl;

    // Save to site_settings
    const { error: upsertError } = await supabase
      .from('site_settings')
      .upsert({ key: settingsKey, value: url as any }, { onConflict: 'key' });

    if (upsertError) {
      toast.error(upsertError.message);
    } else {
      setSrc(url);
      toast.success('Image mise à jour');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!src) {
    return (
      <div className="absolute inset-0 bg-foreground/60">
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-transparent to-foreground/40" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={src}
          src={src}
          alt={alt}
          className={className}
          {...(priority ? { fetchPriority: 'high', loading: 'eager' as const } : { loading: 'lazy' as const })}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </AnimatePresence>
      {isAdmin && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-full shadow-lg hover:bg-luxury-magenta-light transition-colors text-xs font-body tracking-wider"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Envoi…' : 'Changer la photo'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
};

export default EditableImage;
