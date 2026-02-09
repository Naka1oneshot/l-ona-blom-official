import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import FloatingThemeEditor from '@/components/admin/FloatingThemeEditor';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background">
          {children}
        </main>
        <Footer />
        <FloatingThemeEditor />
      </div>
    </HelmetProvider>
  );
};

export default Layout;
