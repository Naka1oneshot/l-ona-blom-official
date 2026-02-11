import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EditModeProvider } from "@/contexts/EditModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ComingSoonGate from "@/components/ComingSoonGate";
import Layout from "@/components/layout/Layout";
import React, { Suspense, lazy } from "react";
import LogoSpinner from "@/components/LogoSpinner";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Cart = lazy(() => import("./pages/Cart"));
const News = lazy(() => import("./pages/News"));
const NewsArticle = lazy(() => import("./pages/NewsArticle"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages — only loaded when admin navigates there
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCollections = lazy(() => import("./pages/admin/AdminCollections"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminPromos = lazy(() => import("./pages/admin/AdminPromos"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminImport = lazy(() => import("./pages/admin/AdminImport"));
const AdminComingSoon = lazy(() => import("./pages/admin/AdminComingSoon"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminTheme = lazy(() => import("./pages/admin/AdminTheme"));
const AdminSeoCheck = lazy(() => import("./pages/admin/AdminSeoCheck"));
const AdminFeatures = lazy(() => import("./pages/admin/AdminFeatures"));
const TryOnPage = lazy(() => import("./pages/TryOn"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — avoid unnecessary re-fetches
      gcTime: 10 * 60 * 1000,     // 10 min — keep cache longer
      refetchOnWindowFocus: false, // don't refetch on tab switch
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LogoSpinner />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
      <EditModeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Admin routes */}
                    <Route path="/admin" element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<AdminDashboard />} />
                      <Route path="produits" element={<AdminProducts />} />
                      <Route path="collections" element={<AdminCollections />} />
                      <Route path="commandes" element={<AdminOrders />} />
                      <Route path="articles" element={<AdminPosts />} />
                      <Route path="clients" element={<AdminClients />} />
                      <Route path="promos" element={<AdminPromos />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="import" element={<AdminImport />} />
                      <Route path="reglages" element={<AdminSettings />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="coming-soon" element={<AdminComingSoon />} />
                      <Route path="theme" element={<AdminTheme />} />
                      <Route path="seo-check" element={<AdminSeoCheck />} />
                      <Route path="fonctionnalites" element={<AdminFeatures />} />
                    </Route>

                    {/* Public & customer routes — wrapped in ComingSoonGate */}
                    <Route path="/" element={<ComingSoonGate><Layout><Index /></Layout></ComingSoonGate>} />
                    <Route path="/boutique" element={<ComingSoonGate><Layout><Shop /></Layout></ComingSoonGate>} />
                    <Route path="/boutique/:slug" element={<ComingSoonGate><Layout hideFooter><ProductDetail /></Layout></ComingSoonGate>} />
                    <Route path="/collections" element={<ComingSoonGate><Layout><Collections /></Layout></ComingSoonGate>} />
                    <Route path="/collections/:slug" element={<ComingSoonGate><Layout><CollectionDetail /></Layout></ComingSoonGate>} />
                    <Route path="/a-propos" element={<ComingSoonGate><Layout><About /></Layout></ComingSoonGate>} />
                    <Route path="/actualites" element={<ComingSoonGate><Layout><News /></Layout></ComingSoonGate>} />
                    <Route path="/actualites/:slug" element={<ComingSoonGate><Layout><NewsArticle /></Layout></ComingSoonGate>} />
                    <Route path="/contact" element={<ComingSoonGate><Layout><Contact /></Layout></ComingSoonGate>} />
                    <Route path="/faq" element={<ComingSoonGate><Layout><FAQ /></Layout></ComingSoonGate>} />
                    <Route path="/panier" element={<ComingSoonGate><Layout><Cart /></Layout></ComingSoonGate>} />
                    <Route path="/try-on" element={<ComingSoonGate><Layout><TryOnPage /></Layout></ComingSoonGate>} />
                    <Route path="/cgv" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_cgv" titleKey="footer.cgv" path="/cgv" /></Layout></ComingSoonGate>} />
                    <Route path="/confidentialite" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_privacy" titleKey="footer.privacy" path="/confidentialite" /></Layout></ComingSoonGate>} />
                    <Route path="/cookies" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_cookies" titleKey="footer.cookies" path="/cookies" /></Layout></ComingSoonGate>} />
                    <Route path="/mentions-legales" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_mentions" titleKey="footer.legal" path="/mentions-legales" /></Layout></ComingSoonGate>} />
                    <Route path="/connexion" element={<ComingSoonGate><Layout><Login /></Layout></ComingSoonGate>} />
                    <Route path="/inscription" element={<ComingSoonGate><Layout><Signup /></Layout></ComingSoonGate>} />
                    <Route path="/compte" element={
                      <ComingSoonGate>
                        <Layout>
                          <ProtectedRoute><Account /></ProtectedRoute>
                        </Layout>
                      </ComingSoonGate>
                    } />
                    <Route path="*" element={<ComingSoonGate><Layout><NotFound /></Layout></ComingSoonGate>} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
      </EditModeProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
