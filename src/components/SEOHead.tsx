import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/lib/siteConfig';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: string;
}

const SEOHead = ({ title, description, image, path = '', type = 'website' }: SEOHeadProps) => {
  const fullTitle = title ? `${title} | ${siteConfig.brand}` : siteConfig.seo.defaultTitle;
  const desc = description || siteConfig.seo.defaultDescription;
  const url = `${siteConfig.siteUrl}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={siteConfig.seo.keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteConfig.brand} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export default SEOHead;
