import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { getToken, getTokenExpiry, isTokenValid, logout } from "@/lib/auth";
import useTokenRefresh from "@/hooks/useTokenRefresh";

export default function ProtectedRoute() {
  const [token, setTokenState] = useState(getToken());

  useTokenRefresh();

  // Sinkronkan state saat token diperbarui oleh hook refresh
  useEffect(() => {
  const sync = () => setTokenState(getToken());
  window.addEventListener("token-changed", sync);
  window.addEventListener("storage", sync);
  return () => {
    window.removeEventListener("token-changed", sync);
    window.removeEventListener("storage", sync);
  };
}, []);

  // Logout otomatis tepat saat token habis (dijadwalkan ulang tiap token baru)
  useEffect(() => {
    if (!token) return;
    const exp = getTokenExpiry(token);
    if (!exp) return;
    const timer = setTimeout(logout, Math.max(exp - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [token]);

  if (!isTokenValid(token)) {
    localStorage.removeItem("token");
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}