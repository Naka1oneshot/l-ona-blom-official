import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import ImageCropper from './ImageCropper';
import { generateAllVariants } from '@/lib/imageVariants';

/* ─── shared helpers ─── */

const BUCKET = 'images';

async function uploadFile(file: File | Blob, folder: string, ext = 'webp'): Promise<string | null> {
  const fileExt = file instanceof File ? (file.name.split('.').pop() ?? ext) : ext;
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    toast.error(`Erreur upload: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a source image and generate __grid + __detail WebP variants.
 * Returns the __grid public URL (to be stored in DB).
 */
async function uploadWithVariants(
  file: File | Blob,
  folder: string,
): Promise<string | null> {
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const variants = await generateAllVariants(file);

    let gridUrl: string | null = null;

    for (const v of variants) {
      const path = `${folder}/${baseName}${v.suffix}.webp`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, v.blob, {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'image/webp',
      });
      if (error) {
        toast.error(`Erreur upload ${v.suffix}: ${error.message}`);
        return null;
      }
      if (v.suffix === '__grid') {
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        gridUrl = data.publicUrl;
      }
    }

    return gridUrl;
  } catch (err: any) {
    toast.error(`Erreur génération variantes: ${err.message}`);
    return null;
  }
}

const labelClass =
  'text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground';

/* ─── Single Image Upload ─── */

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  label = 'Image',
  folder = 'uploads',
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder, file.name.split('.').pop());
    if (url) onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-32 h-32 object-cover border border-border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-dashed border-border px-4 py-3 text-sm font-body text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Envoi en cours…' : 'Importer une image'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

/* ─── Video Upload ─── */

export const VideoUpload = ({
  value,
  onChange,
  label = 'Vidéo',
  folder = 'uploads',
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder, file.name.split('.').pop());
    if (url) onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {value ? (
        <div className="relative inline-block">
          <video
            src={value}
            className="w-48 h-auto border border-border"
            muted
            autoPlay
            loop
            playsInline
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-dashed border-border px-4 py-3 text-sm font-body text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Envoi en cours…' : 'Importer une vidéo'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />
    </div>
  );
};

/* ─── Multi Image Upload with Variants ─── */

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
  /** Set to a number (e.g. 3/4) to force a crop dialog before upload. null = no crop. */
  cropAspect?: number | null;
  /** Generate __grid + __detail variants at upload time (default: true for product images) */
  generateVariants?: boolean;
}

export const MultiImageUpload = ({
  value,
  onChange,
  label = 'Images',
  folder = 'uploads',
  cropAspect = null,
  generateVariants = true,
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop queue: files waiting to be cropped one-by-one
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const pendingUploads = useRef<string[]>([]);

  /* ── upload a single file (with or without variants) ── */
  const uploadSingleFile = async (file: File | Blob): Promise<string | null> => {
    if (generateVariants) {
      return uploadWithVariants(file, folder);
    } else {
      return uploadFile(file, folder, file instanceof File ? file.name.split('.').pop() : 'webp');
    }
  };

  /* ── file selection ── */
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (cropAspect) {
      // Build object URLs for each file and queue them
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      pendingUploads.current = [];
      setCropQueue(urls);
      setCropSrc(urls[0]);
    } else {
      // No crop – generate variants and upload directly
      setUploading(true);
      const newUrls: string[] = [];
      const total = files.length;
      for (let i = 0; i < total; i++) {
        setUploadProgress(`${i + 1}/${total}`);
        const url = await uploadSingleFile(files[i]);
        if (url) newUrls.push(url);
      }
      onChange([...value, ...newUrls]);
      setUploading(false);
      setUploadProgress('');
    }

    if (inputRef.current) inputRef.current.value = '';
  };

  /* ── crop callbacks ── */
  const handleCropComplete = async (blob: Blob) => {
    setUploading(true);
    const url = await uploadSingleFile(blob);
    setUploading(false);

    if (url) pendingUploads.current.push(url);

    // Move to next in queue
    const remaining = cropQueue.slice(1);
    if (remaining.length > 0) {
      setCropQueue(remaining);
      setCropSrc(remaining[0]);
    } else {
      // All done
      setCropQueue([]);
      setCropSrc(null);
      if (pendingUploads.current.length > 0) {
        onChange([...value, ...pendingUploads.current]);
        pendingUploads.current = [];
      }
    }
  };

  const handleCropCancel = () => {
    // Skip this image, move to next
    const remaining = cropQueue.slice(1);
    if (remaining.length > 0) {
      setCropQueue(remaining);
      setCropSrc(remaining[0]);
    } else {
      setCropQueue([]);
      setCropSrc(null);
      if (pendingUploads.current.length > 0) {
        onChange([...value, ...pendingUploads.current]);
        pendingUploads.current = [];
      }
    }
  };

  /* ── remove / reorder ── */
  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === toIndex) return;
    const arr = [...value];
    const [item] = arr.splice(dragIndex, 1);
    arr.splice(toIndex, 0, item);
    onChange(arr);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-3 mb-2">
        {value.map((url, i) => (
          <div
            key={url + i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`relative group cursor-grab active:cursor-grabbing transition-all ${
              dragIndex === i ? 'opacity-40 scale-95' : ''
            } ${overIndex === i && dragIndex !== i ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="relative">
              <img src={url} alt="" className="w-24 h-24 object-cover border border-border" />
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-white drop-shadow-md" />
              </div>
              <span className="absolute bottom-1 left-1 text-[9px] font-body text-white bg-black/50 px-1 rounded">
                {i + 1}
              </span>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 border border-dashed border-border px-4 py-3 text-sm font-body text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {uploading
          ? `Traitement ${uploadProgress}…`
          : generateVariants
            ? 'Ajouter des images (grid + detail auto)'
            : 'Ajouter des images'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* Crop dialog */}
      {cropSrc && cropAspect && (
        <ImageCropper
          src={cropSrc}
          aspectRatio={cropAspect}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={!!cropSrc}
        />
      )}
    </div>
  );
};
