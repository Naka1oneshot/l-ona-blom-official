import { useEffect } from 'react';
import logoIcon from '@/assets/logo-icon.png';
import logoDark from '@/assets/logo-dark.png';
import logoWhite from '@/assets/logo-white.png';

/**
 * Injects <link rel="preload"> for critical above-the-fold images
 * so the browser starts fetching them before React renders.
 */
const CRITICAL_IMAGES = [logoIcon, logoDark, logoWhite];

const ImagePreloader = () => {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    CRITICAL_IMAGES.forEach(href => {
      // Avoid duplicates
      if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    });

    return () => links.forEach(l => l.remove());
  }, []);

  return null;
};

export default ImagePreloader;
