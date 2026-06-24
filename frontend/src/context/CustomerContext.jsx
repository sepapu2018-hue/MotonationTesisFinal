import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);

  const checkSession = useCallback(async () => {
    try {
      const { data } = await api.get("/customer/me");
      setCustomer(data);
    } catch {
      setCustomer(false);
    }
  }, []);

  useEffect(() => { checkSession(); }, [checkSession]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/customer/login", { email, password });
      setCustomer(data);
      return data;
    } catch (err) {
      setCustomer(false);
      throw new Error(formatApiError(err));
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post("/customer/register", payload);
      setCustomer(data);
      return data;
    } catch (err) {
      setCustomer(false);
      throw new Error(formatApiError(err));
    }
  };

  const logout = async () => {
    try { await api.post("/customer/logout"); } catch {}
    setCustomer(false);
  };

  const updateProfile = async (payload) => {
    try {
      const { data } = await api.put("/customer/me", payload);
      setCustomer(data);
      return data;
    } catch (err) {
      throw new Error(formatApiError(err));
    }
  };

  return (
    <CustomerContext.Provider value={{ customer, login, register, logout, updateProfile, refresh: checkSession }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  return useContext(CustomerContext);
}