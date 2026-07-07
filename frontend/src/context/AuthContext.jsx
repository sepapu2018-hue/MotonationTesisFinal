import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data); // Aquí data es el objeto user
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  // Paso 1: valida usuario/contraseña y dispara el código de verificación por correo.
  // No autentica todavía — devuelve un pending_token para el paso 2.
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      return data; // { ok, otp_required, pending_token, dev_otp_code? }
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  };

  // Paso 2: confirma el código recibido por correo y recién ahí abre la sesión.
  const verifyOtp = async (pendingToken, code) => {
    try {
      const { data } = await api.post("/auth/login/verify-otp", { pending_token: pendingToken, code });
      setUser(data.user);
      return data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  };

  const resendOtp = async (pendingToken) => {
    try {
      const { data } = await api.post("/auth/login/resend-otp", { pending_token: pendingToken });
      return data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, resendOtp, logout, refresh: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }