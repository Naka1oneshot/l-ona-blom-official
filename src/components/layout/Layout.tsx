import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import FloatingThemeEditor from '@/components/admin/FloatingThemeEditor';
import ThemeHintOverlay from '@/components/admin/ThemeHintOverlay';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout = ({ children, hideFooter }: LayoutProps) => {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        {!hideFooter && <Footer />}
        <FloatingThemeEditor />
        <ThemeHintOverlay />
      </div>
    </HelmetProvider>
  );
};

export default Layout;
