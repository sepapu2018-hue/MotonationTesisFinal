import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { CartProvider } from "@/context/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";

// Admin pages
import Login from "@/pages/Login";
import ForgotPasswordStaff from "@/pages/ForgotPasswordStaff";
import ResetPasswordStaff from "@/pages/ResetPasswordStaff";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Suppliers from "@/pages/Suppliers";
import Movements from "@/pages/Movements";
import Users from "@/pages/Users";
import Kardex from "@/pages/Kardex";
import Orders from "@/pages/Orders";
import Reviews from "@/pages/Reviews";
import AuditLog from "@/pages/AuditLog";
import Reports from "@/pages/Reports";
import NoAccess from "@/pages/NoAccess";

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
              <ScrollToTop />
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
                <Route path="/admin/olvide" element={<ForgotPasswordStaff />} />
                <Route path="/admin/restablecer" element={<ResetPasswordStaff />} />
                <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="sin-acceso" element={<NoAccess />} />
                  <Route path="dashboard" element={<ProtectedRoute permission="view_dashboard"><Dashboard /></ProtectedRoute>} />
                  <Route path="productos" element={<ProtectedRoute permission="view_products"><Products /></ProtectedRoute>} />
                  <Route path="categorias" element={<ProtectedRoute permission="view_categories"><Categories /></ProtectedRoute>} />
                  <Route path="proveedores" element={<ProtectedRoute permission="view_suppliers"><Suppliers /></ProtectedRoute>} />
                  <Route path="movimientos" element={<ProtectedRoute permission="create_sale"><Movements /></ProtectedRoute>} />
                  <Route path="kardex" element={<ProtectedRoute permission="view_kardex"><Kardex /></ProtectedRoute>} />
                  <Route path="pedidos" element={<ProtectedRoute permission="view_orders"><Orders /></ProtectedRoute>} />
                  <Route path="resenas" element={<ProtectedRoute permission="view_reviews"><Reviews /></ProtectedRoute>} />
                  <Route path="reportes" element={<ProtectedRoute permission="view_reports"><Reports /></ProtectedRoute>} />
                  <Route path="usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
                  <Route path="auditoria" element={<ProtectedRoute adminOnly><AuditLog /></ProtectedRoute>} />
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
