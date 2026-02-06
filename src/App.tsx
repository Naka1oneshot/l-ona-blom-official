import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCollections from "./pages/admin/AdminCollections";
import AdminOrders from "./pages/admin/AdminOrders";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
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
                      <Layout><AdminLayout /></Layout>
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="produits" element={<AdminProducts />} />
                    <Route path="collections" element={<AdminCollections />} />
                    <Route path="commandes" element={<AdminOrders />} />
                  </Route>

                  {/* Public & customer routes */}
                  <Route path="/" element={<Layout><Index /></Layout>} />
                  <Route path="/boutique" element={<Layout><Shop /></Layout>} />
                  <Route path="/boutique/:slug" element={<Layout><ProductDetail /></Layout>} />
                  <Route path="/collections" element={<Layout><Collections /></Layout>} />
                  <Route path="/collections/:slug" element={<Layout><CollectionDetail /></Layout>} />
                  <Route path="/a-propos" element={<Layout><About /></Layout>} />
                  <Route path="/contact" element={<Layout><Contact /></Layout>} />
                  <Route path="/faq" element={<Layout><FAQ /></Layout>} />
                  <Route path="/panier" element={<Layout><Cart /></Layout>} />
                  <Route path="/connexion" element={<Layout><Login /></Layout>} />
                  <Route path="/inscription" element={<Layout><Signup /></Layout>} />
                  <Route path="/compte" element={
                    <Layout>
                      <ProtectedRoute><Account /></ProtectedRoute>
                    </Layout>
                  } />
                  <Route path="*" element={<Layout><NotFound /></Layout>} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
