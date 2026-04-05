import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import Orders from "./pages/Orders/Orders";
import OrderDetail from "./pages/Orders/OrderDetail";
import UserProfile from "./pages/UserProfile/UserProfile";
import Wishlist from "./pages/Wishlist/Wishlist";
import HelpSupport from "./pages/HelpSupport/HelpSupport";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import AuthCallback from "./pages/Auth/AuthCallback";
import Departments from "./pages/Departments/Departments";
import Brands from "./pages/Brands/Brands";
import Categories from "./pages/Categories/Categories";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import api from "./api";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminOrders from "./pages/Admin/AdminOrders";
import AdminProducts from "./pages/Admin/AdminProducts";
import AdminCategories from "./pages/Admin/AdminCategories";
import AdminDepartments from "./pages/Admin/AdminDepartments";
import AdminBrands from "./pages/Admin/AdminBrands";
import AdminBanners from "./pages/Admin/AdminBanners";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminPayments from "./pages/Admin/AdminPayments";
import AdminInventory from "./pages/Admin/AdminInventory";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminOrderDetail from "./pages/Admin/AdminOrderDetail";

const queryClient = new QueryClient();

function App() {
  const { isAuthenticated, token, hydrate } = useAuthStore();
  const { setCart } = useCartStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated && token) {
      api
        .get("/cart")
        .then((res) => {
          setCart(res.data.items || [], res.data.total || 0);
        })
        .catch(() => {
          setCart([], 0);
        });
    } else {
      setCart([], 0);
    }
  }, [isAuthenticated, token, setCart]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="departments" element={<Departments />} />
            <Route path="brands" element={<Brands />} />
            <Route path="categories" element={<Categories />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="help" element={<HelpSupport />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="inventory" element={<AdminInventory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
