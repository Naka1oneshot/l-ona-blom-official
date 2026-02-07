import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, ArrowRight, MapPin, Clock, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface EventPost {
  id: string;
  slug: string;
  title_fr: string;
  title_en: string;
  cover_image: string | null;
  event_date: string | null;
  event_link: string | null;
  event_location: string | null;
  published_at: string | null;
}

const EventsSection = () => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<EventPost[]>([]);
  const [isUpcoming, setIsUpcoming] = useState(true);

  useEffect(() => {
    const now = new Date().toISOString();

    // Try upcoming events first
    supabase
      .from('posts')
      .select('id, slug, title_fr, title_en, cover_image, event_date, event_link, event_location, published_at')
      .eq('category', 'event')
      .not('published_at', 'is', null)
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setEvents(data as EventPost[]);
          setIsUpcoming(true);
        } else {
          supabase
            .from('posts')
            .select('id, slug, title_fr, title_en, cover_image, event_date, event_link, event_location, published_at')
            .eq('category', 'event')
            .not('published_at', 'is', null)
            .order('event_date', { ascending: false })
            .limit(3)
            .then(({ data: pastData }) => {
              setEvents((pastData as EventPost[]) || []);
              setIsUpcoming(false);
            });
        }
      });
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="luxury-section luxury-container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-display text-3xl md:text-4xl">{t('home.events.title')}</h2>
            <p className="text-xs tracking-[0.15em] uppercase font-body text-muted-foreground mt-2">
              {isUpcoming ? t('home.events.upcoming') : t('home.events.past')}
            </p>
          </div>
          <Link
            to="/actualites"
            className="hidden sm:inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-body hover:text-primary transition-colors"
          >
            {t('home.events.see_all')} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event, i) => {
            const title = language === 'fr' ? event.title_fr : event.title_en;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link to={`/actualites/${event.slug}`} className="group block">
                  {event.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden bg-secondary mb-4">
                      <img
                        src={event.cover_image}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    {event.event_date && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-body text-primary">
                        <CalendarDays size={12} />
                        {new Date(event.event_date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' — '}
                        {new Date(event.event_date).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {event.event_location && (
                      <span className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] font-body text-muted-foreground">
                        <MapPin size={12} />
                        {event.event_location}
                      </span>
                    )}
                  </div>
                  <h3 className="text-display text-lg md:text-xl group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </Link>
                {event.event_link && (
                  <a
                    href={event.event_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 bg-primary text-primary-foreground px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-body hover:bg-primary/90 transition-colors"
                  >
                    {language === 'fr' ? 'Réserver sa place' : 'Book your spot'} <ExternalLink size={12} />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>

        <Link
          to="/actualites"
          className="sm:hidden flex items-center justify-center gap-2 text-xs tracking-[0.15em] uppercase font-body hover:text-primary transition-colors mt-8"
        >
          {t('home.events.see_all')} <ArrowRight size={14} />
        </Link>
      </motion.div>
    </section>
  );
};

export default EventsSection;
