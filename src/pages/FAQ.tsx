import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { faqData } from '@/lib/mockData';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SEOHead from '@/components/SEOHead';

const FAQ = () => {
  const { language, t } = useLanguage();
  const items = faqData[language];

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead
        title="FAQ"
        description={language === 'fr' ? 'Questions fréquentes sur les créations LÉONA BLOM, les commandes et la livraison.' : 'Frequently asked questions about LÉONA BLOM creations, orders and delivery.'}
        path="/faq"
      />
      <section className="luxury-container luxury-section max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-display text-4xl md:text-5xl text-center mb-16">{t('faq.title')}</h1>

          <Accordion type="single" collapsible className="space-y-4">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b border-foreground/10">
                <AccordionTrigger className="text-left text-sm font-body tracking-wider py-6 hover:no-underline hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm font-body text-muted-foreground leading-relaxed pb-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>
    </div>
  );
};

export default FAQ;
