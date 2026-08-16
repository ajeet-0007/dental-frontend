import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClientProvider, dehydrate } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./queryClient";
import Seo from "./components/seo/Seo";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import ScrollToTop from "./components/ScrollToTop";
import NotFound from "./pages/NotFound/NotFound";
import Departments from "./pages/Departments/Departments";
import Brands from "./pages/Brands/Brands";
import Categories from "./pages/Categories/Categories";
import HelpSupport from "./pages/HelpSupport/HelpSupport";
import BrandDetail from "./pages/BrandDetail/BrandDetail";
import CategoryDetail from "./pages/CategoryDetail/CategoryDetail";
import DepartmentDetail from "./pages/DepartmentDetail/DepartmentDetail";
import { GalleryPage } from "./pages/Gallery";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import api from "./api";

const Cart = lazy(() => import("./pages/Cart/Cart"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/Checkout/PaymentSuccess"));
const Orders = lazy(() => import("./pages/Orders/Orders"));
const OrderDetail = lazy(() => import("./pages/Orders/OrderDetail"));
const UserProfile = lazy(() => import("./pages/UserProfile/UserProfile"));
const Wishlist = lazy(() => import("./pages/Wishlist/Wishlist"));
const HowToUseVideo = lazy(() => import("./pages/ProductDetail/HowToUseVideo"));
const Returns = lazy(() => import("./pages/Returns/Returns"));
const ReturnDetail = lazy(() => import("./pages/Returns/ReturnDetail"));
const InitiateReturn = lazy(() => import("./pages/Returns/InitiateReturn"));
const Login = lazy(() => import("./pages/Auth/Login"));
const Register = lazy(() => import("./pages/Auth/Register"));
const AuthCallback = lazy(() => import("./pages/Auth/AuthCallback"));
const ForgotPassword = lazy(() => import("./pages/Auth/ForgotPassword"));
const AdminLayout = lazy(() => import("./pages/Admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/Admin/AdminOrders"));
const AdminProducts = lazy(() => import("./pages/Admin/AdminProducts"));
const AdminProductFilters = lazy(() => import("./pages/Admin/AdminProductFilters"));
const AdminCategories = lazy(() => import("./pages/Admin/AdminCategories"));
const AdminDepartments = lazy(() => import("./pages/Admin/AdminDepartments"));
const AdminBrands = lazy(() => import("./pages/Admin/AdminBrands"));
const AdminHomepageBrands = lazy(() => import("./pages/Admin/AdminHomepageBrands"));
const AdminHomepageCategories = lazy(() => import("./pages/Admin/AdminHomepageCategories"));
const AdminHomepageDepartments = lazy(() => import("./pages/Admin/AdminHomepageDepartments"));
const AdminBanners = lazy(() => import("./pages/Admin/AdminBanners"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const AdminPayments = lazy(() => import("./pages/Admin/AdminPayments"));
const AdminInventory = lazy(() => import("./pages/Admin/AdminInventory"));
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin"));
const AdminOrderDetail = lazy(() => import("./pages/Admin/AdminOrderDetail"));
const AdminShipping = lazy(() => import("./pages/Admin/AdminShipping"));
const AdminBulkUpload = lazy(() => import("./pages/Admin/AdminBulkUpload"));
const AdminEntityBulkUpload = lazy(() => import("./pages/Admin/AdminEntityBulkUpload"));
const AdminVerification = lazy(() => import("./pages/Admin/AdminVerification"));
const AdminLogs = lazy(() => import("./pages/Admin/AdminLogs"));
const AdminLogDetail = lazy(() => import("./pages/Admin/AdminLogDetail"));
const AdminGallery = lazy(() => import("./pages/Admin/AdminGallery"));
// import ChatPage from "./pages/Chat/ChatPage";

const PRIVATE_PATH_PATTERN =
  /^\/(login|register|forgot-password|auth\/callback|admin|cart|checkout|payment-success|orders|returns|profile|wishlist)(\/|$)/;

function RouteSeo() {
  const location = useLocation();
  const isPrivate = PRIVATE_PATH_PATTERN.test(location.pathname);
  if (!isPrivate) return null;
  return <Seo noindex />;
}

function PageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const { setCart } = useCartStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    window.__DENTZOO_SNAPSHOT__ = () => dehydrate(queryClient);
    return () => {
      window.__DENTZOO_SNAPSHOT__ = undefined;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get("/cart")
        .then((res) => {
          setCart(Array.isArray(res.data) ? res.data : (res.data?.items || []), res.data.length || 0);
        })
        .catch(() => {
          setCart([], 0);
        });
    } else {
      setCart([], 0);
    }
  }, [isAuthenticated, setCart]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <HelmetProvider>
        <BrowserRouter>
        <ScrollToTop />
        <RouteSeo />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="products/:slug/how-to-use" element={<HowToUseVideo />} />
            <Route path="departments" element={<Departments />} />
            <Route path="departments/:slug" element={<DepartmentDetail />} />
            <Route path="brands" element={<Brands />} />
            <Route path="brands/:slug" element={<BrandDetail />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<CategoryDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:orderId/return" element={<InitiateReturn />} />
            <Route path="returns" element={<Returns />} />
            <Route path="returns/:id" element={<ReturnDetail />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="help" element={<HelpSupport />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="gallery/:slug" element={<GalleryPage />} />
            <Route path="*" element={<NotFound />} />
            {/* <Route path="chat" element={<ChatPage />} /> */}
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="product-filters" element={<AdminProductFilters />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="homepage-brands" element={<AdminHomepageBrands />} />
            <Route path="homepage-categories" element={<AdminHomepageCategories />} />
            <Route path="homepage-departments" element={<AdminHomepageDepartments />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="bulk-upload" element={<AdminBulkUpload />} />
            <Route path="entity-bulk-upload" element={<AdminEntityBulkUpload />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="logs/:id" element={<AdminLogDetail />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="gallery" element={<AdminGallery />} />
          </Route>
        </Routes>
        </Suspense>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
