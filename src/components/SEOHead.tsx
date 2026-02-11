import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/lib/siteConfig';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: string;
  noindex?: boolean;
  /** JSON-LD structured data object(s) to inject */
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SEOHead = ({
  title,
  description,
  image,
  path = '',
  type = 'website',
  noindex = false,
  jsonLd,
}: SEOHeadProps) => {
  const { language } = useLanguage();
  const fullTitle = title ? `${title} | ${siteConfig.brand}` : siteConfig.seo.defaultTitle;
  const desc = description || siteConfig.seo.defaultDescription;
  const url = `${siteConfig.siteUrl}${path}`;

  // Build hreflang — same URL for both since language is client-side state
  const hrefFr = url;
  const hrefEn = url;

  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow';

  // Normalize JSON-LD to array
  const jsonLdItems = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={url} />

      {/* hreflang */}
      <link rel="alternate" hrefLang="fr" href={hrefFr} />
      <link rel="alternate" hrefLang="en" href={hrefEn} />
      <link rel="alternate" hrefLang="x-default" href={hrefFr} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteConfig.brand} />
      <meta property="og:locale" content={language === 'en' ? 'en_US' : 'fr_FR'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD */}
      {jsonLdItems.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
