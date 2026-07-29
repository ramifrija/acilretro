import { useEffect } from 'react';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LandingPage from '@/pages/LandingPage';
import CatalogPage from '@/pages/CatalogPage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import ContactPage from '@/pages/ContactPage';
import LegalPage from '@/pages/LegalPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminInventory from '@/pages/admin/AdminInventory';
import AdminPOS from '@/pages/admin/AdminPOS';
import AdminVehicles from '@/pages/admin/AdminVehicles';
import { AdminCustomers, AdminReports, AdminSettings } from '@/pages/admin/AdminMisc';
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
      <div className="min-h-screen flex items-center justify-center bg-brand-950">
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
    } else if (path.startsWith('/admin/reports')) {
      section = 'reports';
      content = <AdminReports />;
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
  } else if (path === '/catalog') {
    page = <CatalogPage />;
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
