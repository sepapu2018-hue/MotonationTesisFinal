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
import Suppliers from "@/pages/Suppliers";
import Movements from "@/pages/Movements";
import Alerts from "@/pages/Alerts";
import Users from "@/pages/Users";
import Kardex from "@/pages/Kardex";
import Orders from "@/pages/Orders";
import Reviews from "@/pages/Reviews";

// Public pages
import Home from "@/pages/public/Home";
import Shop from "@/pages/public/Shop";
import ProductDetail from "@/pages/public/ProductDetail";
import Cart from "@/pages/public/Cart";
import Checkout from "@/pages/public/Checkout";
import MyOrders from "@/pages/public/MyOrders";
import Account from "@/pages/public/Account";
import CustomerLogin from "@/pages/public/CustomerLogin";
import CustomerRegister from "@/pages/public/CustomerRegister";
import ForgotPassword from "@/pages/public/ForgotPassword";
import ResetPassword from "@/pages/public/ResetPassword";

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
                  <Route path="/mi-cuenta" element={<Account />} />
                  <Route path="/cuenta/entrar" element={<CustomerLogin />} />
                  <Route path="/cuenta/registro" element={<CustomerRegister />} />
                  <Route path="/cuenta/olvide" element={<ForgotPassword />} />
                  <Route path="/cuenta/restablecer" element={<ResetPassword />} />
                </Route>

                {/* Panel administrativo */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="productos" element={<Products />} />
                  <Route path="categorias" element={<Categories />} />
                  <Route path="proveedores" element={<Suppliers />} />
                  <Route path="movimientos" element={<Movements />} />
                  <Route path="kardex" element={<Kardex />} />
                  <Route path="pedidos" element={<Orders />} />
                  <Route path="resenas" element={<Reviews />} />
                  <Route path="alertas" element={<Alerts />} />
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
