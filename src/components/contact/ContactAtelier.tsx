import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import type { ContactPageData } from '@/hooks/useContactPage';

interface Props {
  data: ContactPageData;
  language: 'fr' | 'en';
}

const l = (fr: string, en: string, lang: string) => (lang === 'en' && en ? en : fr);

const ContactAtelier = ({ data, language }: Props) => {
  const { atelier } = data;
  const title = l(atelier.title_fr, atelier.title_en, language);
  const text = l(atelier.text_fr, atelier.text_en, language);

  if (!title && !text && !atelier.image_url) return null;

  return (
    <section className="luxury-container py-16 md:py-24">
      <Separator className="bg-border/30 mb-16" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center max-w-5xl mx-auto"
      >
        {atelier.image_url && (
          <img src={atelier.image_url} alt={title || 'Atelier'} className="w-full aspect-[4/5] object-cover" style={{ objectPosition: atelier.focal_point || '50% 50%' }} />
        )}
        <div className="space-y-4">
          {title && <h2 className="text-display text-2xl md:text-3xl tracking-wider">{title}</h2>}
          {text && <p className="font-body text-sm text-foreground/70 leading-relaxed whitespace-pre-line">{text}</p>}
        </div>
      </motion.div>
    </section>
  );
};

export default ContactAtelier;
