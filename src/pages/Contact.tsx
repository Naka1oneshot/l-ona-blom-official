import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useContactPage } from '@/hooks/useContactPage';
import SEOHead from '@/components/SEOHead';
import ContactHero from '@/components/contact/ContactHero';
import ContactInfo from '@/components/contact/ContactInfo';
import ContactForm from '@/components/contact/ContactForm';
import ContactAtelier from '@/components/contact/ContactAtelier';
import ContactEditDrawer from '@/components/contact/ContactEditDrawer';
import { Separator } from '@/components/ui/separator';
import { Settings2 } from 'lucide-react';

const l = (fr: string, en: string, lang: string) => (lang === 'en' && en ? en : fr);

const Contact = () => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useContactPage();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const title = l(data.hero.title_fr, data.hero.title_en, language);
  const subtitle = l(data.hero.subtitle_fr, data.hero.subtitle_en, language);

  return (
    <div className="min-h-screen">
      <SEOHead
        title={title}
        description={subtitle || (language === 'fr' ? 'Contactez la maison LÉONA BLOM.' : 'Contact LÉONA BLOM.')}
        path="/contact"
      />

      {/* Admin edit button */}
      {isAdmin && (
        <button
          onClick={() => setEditOpen(true)}
          className="fixed top-24 right-4 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-accent/80 transition-colors text-xs font-body tracking-wider"
        >
          <Settings2 size={14} />
          Modifier
        </button>
      )}

      {/* HERO */}
      <ContactHero imageUrl={data.hero.image_url} title={title} subtitle={subtitle} />

      {/* MAIN CONTENT */}
      <section className="luxury-container py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <ContactInfo data={data} language={language} />
          <div>
            <div className="lg:hidden mb-10">
              <Separator className="bg-border/30" />
            </div>
            <ContactForm data={data} language={language} />
          </div>
        </div>
      </section>

      {/* ATELIER */}
      <ContactAtelier data={data} language={language} />

      {/* Admin Drawer */}
      {isAdmin && (
        <ContactEditDrawer open={editOpen} onOpenChange={setEditOpen} data={data} />
      )}
    </div>
  );
};

export default Contact;
