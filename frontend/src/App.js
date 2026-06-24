import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { CartProvider } from "@/context/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";

// Admin pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Movements from "@/pages/Movements";
import Alerts from "@/pages/Alerts";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Kardex from "@/pages/Kardex";
import Finance from "@/pages/Finance";

// Public pages
import Home from "@/pages/public/Home";
import Shop from "@/pages/public/Shop";
import ProductDetail from "@/pages/public/ProductDetail";
import Cart from "@/pages/public/Cart";
import Checkout from "@/pages/public/Checkout";
import MyOrders from "@/pages/public/MyOrders";
import CustomerLogin from "@/pages/public/CustomerLogin";
import CustomerRegister from "@/pages/public/CustomerRegister";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CustomerProvider>
          <CartProvider>
            <BrowserRouter>
              <Toaster position="bottom-right" richColors theme="dark" />
              <Routes>
                {/* Tienda pública */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/tienda" element={<Shop />} />
                  <Route path="/producto/:sku" element={<ProductDetail />} />
                  <Route path="/carrito" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/mis-pedidos" element={<MyOrders />} />
                  <Route path="/cuenta/entrar" element={<CustomerLogin />} />
                  <Route path="/cuenta/registro" element={<CustomerRegister />} />
                </Route>

                {/* Panel administrativo */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="productos" element={<Products />} />
                  <Route path="categorias" element={<Categories />} />
                  <Route path="movimientos" element={<Movements />} />
                  <Route path="kardex" element={<Kardex />} />
                  <Route path="alertas" element={<Alerts />} />
                  <Route path="reportes" element={<Reports />} />
                  <Route path="finanzas" element={<Finance />} />
                  <Route path="usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </CustomerProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
