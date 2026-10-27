import { useEffect } from "react";
import axios from "axios";
import { getToken, getTokenExpiry, isTokenValid, logout, setToken } from "@/lib/auth";

const REFRESH_BEFORE_MS = 5 * 60 * 1000; // refresh 5 menit sebelum habis
const IDLE_LIMIT_MS = 10 * 60 * 1000;    // tidak aktif > 10 menit = tidak di-refresh
// const IDLE_LIMIT_MS =  20 * 1000;    // tidak aktif > 10 menit = tidak di-refresh
const ACTIVITY_KEY = "last-activity";

const markActive = () => localStorage.setItem(ACTIVITY_KEY, String(Date.now()));

const isIdle = () => {
  const last = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0);
  return Date.now() - last > IDLE_LIMIT_MS;
};

export default function useTokenRefresh() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      clearTimeout(timer);

      const token = getToken();
      if (!isTokenValid(token)) return;

      const remaining = getTokenExpiry(token!)! - Date.now();
      const refreshBefore = Math.min(REFRESH_BEFORE_MS, remaining / 2);
      timer = setTimeout(doRefresh, Math.max(remaining - refreshBefore, 0));
    };

    const doRefresh = async () => {
      // User tidak aktif: jangan diperpanjang, biarkan token habis sendiri
      if (isIdle()) return;

      const tokenUsed = getToken();

      const run = async () => {
        if (getToken() !== tokenUsed && isTokenValid(getToken())) {
          schedule();
          return;
        }
        try {
          const { data } = await axios.post("/api/refresh", null, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
              Accept: "application/json",
            },
          });
          setToken(data.access_token);
        } catch {
          if (getToken() !== tokenUsed && isTokenValid(getToken())) {
            schedule();
            return;
          }
          logout();
        }
      };

      if ("locks" in navigator) {
        await navigator.locks.request("token-refresh", run);
      } else {
        await run();
      }
    };

    // Catat aktivitas, dibatasi maksimal sekali per 5 detik
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return;
      lastWrite = now;
      markActive();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!isTokenValid(getToken())) {
        logout();
        return;
      }
      markActive(); // user kembali ke tab = aktif
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== "token") return;
      if (e.newValue) schedule();
      else window.location.href = "/signin";
    };
    window.addEventListener("storage", onStorage);

    markActive(); // masuk dashboard dihitung aktivitas
    schedule();
    window.addEventListener("token-changed", schedule);

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("token-changed", schedule);
    };
  }, []);
}