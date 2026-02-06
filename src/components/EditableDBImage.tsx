import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditableDBImageProps {
  table: 'posts' | 'collections' | 'products';
  id: string;
  field: string;
  value: string | null;
  onSaved?: (url: string) => void;
  alt: string;
  className?: string;
  folder?: string;
}

const BUCKET = 'images';

/**
 * Inline image editor for DB-backed entities (collections, posts, products).
 * Admins see a camera button to replace the cover image.
 */
const EditableDBImage = ({
  table, id, field, value, onSaved, alt, className = '', folder = 'covers',
}: EditableDBImageProps) => {
  const { isAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

    const { error: dbError } = await supabase
      .from(table)
      .update({ [field]: url })
      .eq('id', id);

    if (dbError) {
      toast.error(dbError.message);
    } else {
      onSaved?.(url);
      toast.success('Image mise à jour');
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      {value ? (
        <img src={value} alt={alt} className={className} />
      ) : (
        <div className={`bg-muted ${className}`} />
      )}
      {isAdmin && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); inputRef.current?.click(); }}
            disabled={uploading}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-full shadow-lg hover:bg-luxury-magenta-light transition-colors text-xs font-body tracking-wider"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? 'Envoi…' : 'Changer la photo'}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </>
  );
};

export default EditableDBImage;
