import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import Home from './pages/Home/Home'
import Products from './pages/Products/Products'
import ProductDetail from './pages/ProductDetail/ProductDetail'
import Cart from './pages/Cart/Cart'
import Checkout from './pages/Checkout/Checkout'
import Orders from './pages/Orders/Orders'
import OrderDetail from './pages/Orders/OrderDetail'
import UserProfile from './pages/UserProfile/UserProfile'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import { useAuthStore } from './stores/authStore'
import { useCartStore } from './stores/cartStore'
import api from './api'

const queryClient = new QueryClient()

function App() {
  const { isAuthenticated, token, hydrate } = useAuthStore()
  const { setCart } = useCartStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (isAuthenticated && token) {
      api.get('/cart')
        .then((res) => {
          setCart(res.data.items || [], res.data.total || 0)
        })
        .catch(() => {
          setCart([], 0)
        })
    } else {
      setCart([], 0)
    }
  }, [isAuthenticated, token, setCart])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
