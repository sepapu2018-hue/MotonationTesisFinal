import axios from "axios";

// Cambiamos a la URL exacta del backend para evitar ambigüedades
const api = axios.create({
  baseURL: "http://localhost:5001/api", 
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;

export function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Error desconocido";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (d?.msg) return d.msg;
  return String(d);
}