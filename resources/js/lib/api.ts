import axios from "axios";
import { getToken, logout } from "@/lib/auth";

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes("/login");
    if (err.response?.status === 401 && !isLoginRequest) {
      logout();
    }
    return Promise.reject(err);
  }
);

export default api;