import { useEffect } from 'react';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import LandingPage from '@/pages/LandingPage';
import NewLandingPage from '@/pages/NewLandingPage';
import TestLandingPage from '@/pages/TestLandingPage';
import CatalogPage from '@/pages/CatalogPage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import ContactPage from '@/pages/ContactPage';
import LegalPage from '@/pages/LegalPage';
import NotFoundPage from '@/pages/NotFoundPage';
import BrandsPage from '@/pages/BrandsPage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminPOS from '@/pages/admin/AdminPOS';
import AdminVehicles from '@/pages/admin/AdminVehicles';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import { AdminUsers, AdminSettings } from '@/pages/admin/AdminMisc';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminRegister from '@/pages/admin/AdminRegister';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, isLoading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isLoading && (!session || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [isLoading, session, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3d6eff]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

function Routes() {
  const { path } = useRouter();

  // Admin routes
  if (path.startsWith('/admin')) {
    if (path === '/admin/login') {
      return <AdminLogin />;
    }
    if (path === '/admin/register') {
      return <AdminRegister />;
    }

    let section = 'dashboard';
    let content;

    if (path === '/admin' || path === '/admin/') {
      section = 'dashboard';
      content = <AdminDashboard />;
    } else if (path.startsWith('/admin/products')) {
      section = 'products';
      content = <AdminProducts />;
    } else if (path.startsWith('/admin/orders')) {
      section = 'orders';
      content = <AdminOrders />;
    } else if (path.startsWith('/admin/quotes')) {
      section = 'quotes';
      content = <AdminOrders quotesOnly />;
    } else if (path.startsWith('/admin/vehicles')) {
      section = 'vehicles';
      content = <AdminVehicles />;
    } else if (path.startsWith('/admin/inventory')) {
      section = 'inventory';
      content = <AdminInventory />;
    } else if (path.startsWith('/admin/customers')) {
      section = 'customers';
      content = <AdminCustomers />;
    } else if (path.startsWith('/admin/pos')) {
      section = 'pos';
      content = <AdminPOS />;
    } else if (path.startsWith('/admin/users')) {
      section = 'users';
      content = <AdminUsers />;
    } else if (path.startsWith('/admin/settings')) {
      section = 'settings';
      content = <AdminSettings />;
    }

    return (
      <AdminRouteGuard>
        <AdminLayout section={section}>{content}</AdminLayout>
      </AdminRouteGuard>
    );
  }

  // Storefront routes
  let page;
  if (path === '/' || path === '') {
    page = <LandingPage />;
  } else if (path === '/newlanding') {
    page = <NewLandingPage />;
  } else if (path === '/test1') {
    page = <TestLandingPage />;
  } else if (path === '/catalog') {
    page = <CatalogPage />;
  } else if (path === '/brands') {
    page = <BrandsPage />;
  } else if (path.startsWith('/product/')) {
    page = <ProductPage />;
  } else if (path === '/cart') {
    page = <CartPage />;
  } else if (path === '/checkout') {
    page = <CheckoutPage />;
  } else if (path === '/contact') {
    page = <ContactPage />;
  } else if (path === '/quote') {
    page = <CheckoutPage />;
  } else if (path === '/mentions-legales') {
    page = <LegalPage type="mentions" />;
  } else if (path === '/cgv') {
    page = <LegalPage type="cgv" />;
  } else if (path === '/confidentialite') {
    page = <LegalPage type="confidentialite" />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
      
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/21627804642"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[90] bg-[#25D366] text-white p-3 rounded-full shadow-[0_4px_12px_rgba(37,211,102,0.4)] hover:scale-110 hover:shadow-[0_6px_16px_rgba(37,211,102,0.5)] transition-all duration-300 flex items-center justify-center animate-fade-in-up"
        aria-label="Contact us on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>
      
      {/* Theme Editor Widget */}

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider>
            <Routes />
            <Toaster position="top-right" />
          </RouterProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
