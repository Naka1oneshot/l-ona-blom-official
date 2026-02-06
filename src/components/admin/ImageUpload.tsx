import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
}

const BUCKET = 'images';

async function uploadFile(file: File, folder: string): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    toast.error(`Erreur upload: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const labelClass = "text-[10px] tracking-[0.2em] uppercase font-body block mb-1.5 text-muted-foreground";

export const ImageUpload = ({ value, onChange, label = 'Image', folder = 'uploads' }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder);
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

export const VideoUpload = ({ value, onChange, label = 'Vidéo', folder = 'uploads' }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, folder);
    if (url) onChange(url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {value ? (
        <div className="relative inline-block">
          <video src={value} className="w-48 h-auto border border-border" muted autoPlay loop playsInline />
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

export const MultiImageUpload = ({ value, onChange, label = 'Images', folder = 'uploads' }: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, folder);
      if (url) newUrls.push(url);
    }
    onChange([...value, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const arr = [...value];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-3 mb-2">
        {value.map((url, i) => (
          <div key={i} className="relative group">
            <div className="relative">
              <img src={url} alt="" className="w-24 h-24 object-cover border border-border" />
              <div className="absolute bottom-0 inset-x-0 flex justify-center gap-0.5 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  className="p-0.5 text-foreground disabled:text-muted-foreground/30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[9px] font-body self-center text-muted-foreground">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === value.length - 1}
                  className="p-0.5 text-foreground disabled:text-muted-foreground/30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
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
        {uploading ? 'Envoi en cours…' : 'Ajouter des images'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
};
