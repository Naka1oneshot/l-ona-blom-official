import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import SEOHead from '@/components/SEOHead';

interface LegalPageProps {
  settingsKey: string;
  titleKey: string;
  path: string;
}

const defaultContent: Record<string, Record<string, string>> = {
  legal_cgv: {
    fr: `## Conditions Générales de Vente

### Article 1 — Objet
Les présentes CGV régissent les ventes de produits LÉONA BLOM via le site leonablom.com.

### Article 2 — Prix
Les prix sont indiqués en euros TTC. Les conversions en USD, GBP et CAD sont fournies à titre indicatif.

### Article 3 — Commandes
Toute commande vaut acceptation des présentes CGV. Les pièces sur commande sont confectionnées après validation du paiement.

### Article 4 — Droit de rétractation
Conformément à la législation en vigueur, vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation sur les produits en stock, à compter de la réception. **Les pièces sur mesure, confectionnées selon vos spécifications personnelles, ne sont pas éligibles au droit de rétractation** sauf en cas de défaut de fabrication (article L221-28 du Code de la consommation).

### Article 5 — Livraison
Nous livrons en Europe, au Royaume-Uni, aux États-Unis et au Canada. Les délais varient selon la destination et le mode de confection.

### Article 6 — Retours
Les articles en stock peuvent être retournés dans leur état d'origine sous 14 jours. Les frais de retour sont à la charge du client sauf en cas de produit défectueux.

### Article 7 — Garantie
Tous nos produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés.`,
    en: `## Terms & Conditions

### Article 1 — Purpose
These Terms & Conditions govern the sales of LÉONA BLOM products via leonablom.com.

### Article 2 — Pricing
Prices are displayed in EUR including tax. Conversions to USD, GBP, and CAD are provided as estimates.

### Article 3 — Orders
Any order constitutes acceptance of these T&C. Made-to-order pieces are crafted after payment validation.

### Article 4 — Right of Withdrawal
In accordance with applicable law, you have 14 days from receipt to exercise your right of withdrawal on in-stock products. **Made-to-measure pieces, crafted to your personal specifications, are not eligible for withdrawal** except in cases of manufacturing defects.

### Article 5 — Shipping
We ship to Europe, the UK, the US, and Canada. Delivery times vary by destination and crafting method.

### Article 6 — Returns
In-stock items may be returned in their original condition within 14 days. Return shipping costs are borne by the customer unless the product is defective.

### Article 7 — Warranty
All our products benefit from the legal guarantee of conformity and the guarantee against hidden defects.`,
  },
  legal_privacy: {
    fr: `## Politique de Confidentialité

### Données collectées
Nous collectons les données nécessaires au traitement de vos commandes : nom, adresse email, adresse postale, téléphone, mesures corporelles (pour le sur-mesure).

### Utilisation des données
Vos données sont utilisées exclusivement pour le traitement de vos commandes, la gestion de votre compte client et, avec votre consentement, l'envoi de communications commerciales.

### Protection des données
Vos données sont stockées de manière sécurisée et ne sont jamais vendues à des tiers. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.

### Contact
Pour toute question relative à vos données personnelles : contact@leonablom.com`,
    en: `## Privacy Policy

### Data Collected
We collect data necessary for processing your orders: name, email address, postal address, phone number, body measurements (for made-to-measure).

### Data Usage
Your data is used exclusively for processing your orders, managing your customer account, and, with your consent, sending commercial communications.

### Data Protection
Your data is stored securely and is never sold to third parties. In accordance with GDPR, you have the right to access, rectify, and delete your data.

### Contact
For any questions regarding your personal data: contact@leonablom.com`,
  },
  legal_cookies: {
    fr: `## Politique de Cookies

### Cookies essentiels
Nous utilisons des cookies strictement nécessaires au fonctionnement du site : authentification, panier d'achat, préférences de langue et de devise.

### Cookies analytiques
Avec votre consentement, nous pouvons utiliser des cookies analytiques pour comprendre comment vous utilisez notre site et améliorer votre expérience.

### Gestion des cookies
Vous pouvez à tout moment modifier vos préférences de cookies via les paramètres de votre navigateur.`,
    en: `## Cookie Policy

### Essential Cookies
We use cookies strictly necessary for the operation of the site: authentication, shopping cart, language and currency preferences.

### Analytical Cookies
With your consent, we may use analytical cookies to understand how you use our site and improve your experience.

### Managing Cookies
You can modify your cookie preferences at any time through your browser settings.`,
  },
};

const LegalPage = ({ settingsKey, titleKey, path }: LegalPageProps) => {
  const { language, t } = useLanguage();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object' && (data.value as any)[language]) {
          setContent((data.value as any)[language]);
        } else {
          setContent(defaultContent[settingsKey]?.[language] || '');
        }
        setLoading(false);
      });
  }, [settingsKey, language]);

  const title = t(titleKey);

  return (
    <div className="pt-20 md:pt-24">
      <SEOHead title={title} path={path} />
      <section className="luxury-container luxury-section max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-display text-4xl md:text-5xl text-center mb-12">{title}</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border border-foreground/30 border-t-primary animate-spin" />
            </div>
          ) : (
            <div>
              {content.split('\n').map((line, i) => {
                if (!line.trim()) return <br key={i} />;
                if (line.startsWith('## ')) return <h2 key={i} className="text-display text-2xl mt-8 mb-4">{line.replace('## ', '')}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-display text-xl mt-6 mb-3">{line.replace('### ', '')}</h3>;
                // Handle bold markdown
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i} className="text-sm font-body text-muted-foreground leading-relaxed mb-3">
                    {parts.map((part, j) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j} className="text-foreground font-medium">{part.slice(2, -2)}</strong>
                        : part
                    )}
                  </p>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default LegalPage;
