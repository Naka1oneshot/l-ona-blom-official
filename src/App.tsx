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
import ProtectedRoute from "@/components/ProtectedRoute";
import ComingSoonGate from "@/components/ComingSoonGate";
import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Cart from "./pages/Cart";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import LegalPage from "./pages/LegalPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCollections from "./pages/admin/AdminCollections";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPosts from "./pages/admin/AdminPosts";
import AdminClients from "./pages/admin/AdminClients";
import AdminPromos from "./pages/admin/AdminPromos";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminImport from "./pages/admin/AdminImport";
import AdminComingSoon from "./pages/admin/AdminComingSoon";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminTheme from "./pages/admin/AdminTheme";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
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
                  </Route>

                  {/* Public & customer routes — wrapped in ComingSoonGate */}
                  <Route path="/" element={<ComingSoonGate><Layout><Index /></Layout></ComingSoonGate>} />
                  <Route path="/boutique" element={<ComingSoonGate><Layout><Shop /></Layout></ComingSoonGate>} />
                  <Route path="/boutique/:slug" element={<ComingSoonGate><Layout><ProductDetail /></Layout></ComingSoonGate>} />
                  <Route path="/collections" element={<ComingSoonGate><Layout><Collections /></Layout></ComingSoonGate>} />
                  <Route path="/collections/:slug" element={<ComingSoonGate><Layout><CollectionDetail /></Layout></ComingSoonGate>} />
                  <Route path="/a-propos" element={<ComingSoonGate><Layout><About /></Layout></ComingSoonGate>} />
                  <Route path="/actualites" element={<ComingSoonGate><Layout><News /></Layout></ComingSoonGate>} />
                  <Route path="/actualites/:slug" element={<ComingSoonGate><Layout><NewsArticle /></Layout></ComingSoonGate>} />
                  <Route path="/contact" element={<ComingSoonGate><Layout><Contact /></Layout></ComingSoonGate>} />
                  <Route path="/faq" element={<ComingSoonGate><Layout><FAQ /></Layout></ComingSoonGate>} />
                  <Route path="/panier" element={<ComingSoonGate><Layout><Cart /></Layout></ComingSoonGate>} />
                  <Route path="/cgv" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_cgv" titleKey="footer.cgv" path="/cgv" /></Layout></ComingSoonGate>} />
                  <Route path="/confidentialite" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_privacy" titleKey="footer.privacy" path="/confidentialite" /></Layout></ComingSoonGate>} />
                  <Route path="/cookies" element={<ComingSoonGate><Layout><LegalPage settingsKey="legal_cookies" titleKey="footer.cookies" path="/cookies" /></Layout></ComingSoonGate>} />
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
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
