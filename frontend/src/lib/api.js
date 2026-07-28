import axios from "axios";

// En local, el frontend (puerto 3000) y el backend (puerto 5001) corren en
// procesos/dominios distintos, así que hace falta la URL absoluta. En
// cualquier dominio desplegado (Vercel: principal, de rama o de preview) las
// llamadas van por ruta relativa: `vercel.json` las reenvía al backend sin
// salir del mismo origen, para que la cookie de sesión no se trate como de
// terceros (los navegadores móviles la bloquean si el origen es distinto,
// lo que rompía el login/checkout en celular).
const isLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const BACKEND_URL = isLocalhost ? (process.env.REACT_APP_BACKEND_URL || "http://localhost:5001") : "";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// El access token dura poco (8h) a propósito; el refresh token (7 días) existe
// para renovarlo solo. Sin esto, cualquier sesión abierta más de 8h se cae con
// 401 "No autenticado" en la próxima acción (ej. justo al pagar el checkout).
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthAction = original?.url?.includes("/login") || original?.url?.includes("/refresh") || original?.url?.includes("/register");

    if (err.response?.status === 401 && original && !original._retry && !isAuthAction) {
      original._retry = true;
      const refreshUrl = window.location.pathname.startsWith("/admin") ? "/auth/refresh" : "/customer/refresh";
      try {
        refreshPromise = refreshPromise || api.post(refreshUrl).finally(() => { refreshPromise = null; });
        await refreshPromise;
        return api(original);
      } catch {
        // El refresh también falló: la sesión expiró de verdad, se deja fluir el 401 original.
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Error desconocido";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (d?.msg) return d.msg;
  return String(d);
}