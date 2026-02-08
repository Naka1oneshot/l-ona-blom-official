import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ContactSocial {
  key: string;
  label: string;
  url: string;
  enabled: boolean;
  order: number;
}

export interface ContactPageData {
  hero: {
    image_url: string;
    title_fr: string;
    title_en: string;
    subtitle_fr: string;
    subtitle_en: string;
  };
  coordinates: {
    email: string;
    phone: string;
    address_fr: string;
    address_en: string;
    hours_fr: string;
    hours_en: string;
  };
  press: {
    text_fr: string;
    text_en: string;
    email: string;
  };
  socials: ContactSocial[];
  form: {
    enabled: boolean;
    title_fr: string;
    title_en: string;
    consent_fr: string;
    consent_en: string;
  };
  atelier: {
    title_fr: string;
    title_en: string;
    text_fr: string;
    text_en: string;
    image_url: string;
  };
}

const defaultData: ContactPageData = {
  hero: { image_url: '', title_fr: 'Contact', title_en: 'Contact', subtitle_fr: 'Nous serions ravis d\'échanger avec vous.', subtitle_en: 'We would love to hear from you.' },
  coordinates: { email: 'contact@leonablom.com', phone: '', address_fr: '', address_en: '', hours_fr: '', hours_en: '' },
  press: { text_fr: '', text_en: '', email: '' },
  socials: [],
  form: { enabled: true, title_fr: 'Écrivez-nous', title_en: 'Write to us', consent_fr: 'J\'accepte que mes données soient utilisées pour répondre à ma demande.', consent_en: 'I agree that my data may be used to respond to my inquiry.' },
  atelier: { title_fr: '', title_en: '', text_fr: '', text_en: '', image_url: '' },
};

export function useContactPage() {
  return useQuery({
    queryKey: ['contact-page'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'page_contact')
        .maybeSingle();
      if (error) throw error;
      if (!data) return defaultData;
      return { ...defaultData, ...(data.value as unknown as ContactPageData) };
    },
  });
}

export function useSaveContactPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (content: ContactPageData) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: content as any })
        .eq('key', 'page_contact');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-page'] });
      toast.success('Page contact mise à jour');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSubmitContactMessage() {
  return useMutation({
    mutationFn: async (msg: { name: string; email: string; subject: string; message: string; locale: string; consent: boolean }) => {
      const { error } = await supabase.from('contact_messages' as any).insert(msg as any);
      if (error) throw error;
    },
  });
}
