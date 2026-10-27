export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function getTokenExpiry(token: string): number | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null; // ke milidetik
  } catch {
    return null;
  }
}

export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const exp = getTokenExpiry(token);
  return exp !== null && exp > Date.now();
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("token-changed"));
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("last-activity");
  window.location.href = "/signin";
}