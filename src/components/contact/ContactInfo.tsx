import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { ContactPageData, ContactSocial } from '@/hooks/useContactPage';
import ContactSocialIcons from './ContactSocialIcons';

interface Props {
  data: ContactPageData;
  language: 'fr' | 'en';
}

const l = (fr: string, en: string, lang: string) => (lang === 'en' && en ? en : fr);

const ContactInfo = ({ data, language }: Props) => {
  const { coordinates, press, socials } = data;
  const activeSocials = socials.filter(s => s.enabled && s.url).sort((a, b) => a.order - b.order);

  const hasPress = press.email || l(press.text_fr, press.text_en, language);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      {/* Coordinates */}
      <div>
        <h2 className="text-display text-2xl md:text-3xl tracking-wider mb-6">
          {language === 'en' ? 'Get in Touch' : 'Coordonnées'}
        </h2>
        <div className="space-y-4 font-body text-sm tracking-wide">
          {coordinates.email && (
            <a href={`mailto:${coordinates.email}`} className="flex items-center gap-3 group text-foreground/80 hover:text-primary transition-colors">
              <Mail size={16} className="text-primary/60 group-hover:text-primary transition-colors" />
              {coordinates.email}
            </a>
          )}
          {coordinates.phone && (
            <a href={`tel:${coordinates.phone}`} className="flex items-center gap-3 group text-foreground/80 hover:text-primary transition-colors">
              <Phone size={16} className="text-primary/60 group-hover:text-primary transition-colors" />
              {coordinates.phone}
            </a>
          )}
          {l(coordinates.address_fr, coordinates.address_en, language) && (
            <div className="flex items-start gap-3 text-foreground/80">
              <MapPin size={16} className="text-primary/60 mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{l(coordinates.address_fr, coordinates.address_en, language)}</span>
            </div>
          )}
          {l(coordinates.hours_fr, coordinates.hours_en, language) && (
            <div className="flex items-start gap-3 text-foreground/80">
              <Clock size={16} className="text-primary/60 mt-0.5 shrink-0" />
              <span className="whitespace-pre-line">{l(coordinates.hours_fr, coordinates.hours_en, language)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Socials */}
      {activeSocials.length > 0 && (
        <>
          <Separator className="bg-border/50" />
          <div>
            <h3 className="text-display text-lg tracking-wider mb-5">
              {language === 'en' ? 'Follow Us' : 'Réseaux'}
            </h3>
            <ContactSocialIcons socials={activeSocials} />
          </div>
        </>
      )}

      {/* Press */}
      {hasPress && (
        <>
          <Separator className="bg-border/50" />
          <div>
            <h3 className="text-display text-lg tracking-wider mb-4">
              {language === 'en' ? 'Press & Collaborations' : 'Presse & Collaborations'}
            </h3>
            {l(press.text_fr, press.text_en, language) && (
              <p className="font-body text-sm text-foreground/70 mb-3 leading-relaxed">
                {l(press.text_fr, press.text_en, language)}
              </p>
            )}
            {press.email && (
              <a href={`mailto:${press.email}`} className="font-body text-sm text-primary hover:text-primary/80 transition-colors tracking-wide">
                {press.email}
              </a>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ContactInfo;
