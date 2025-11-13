// src/lib/authSession.ts
import {jwtDecode} from "jwt-decode";

type Decoded = { exp: number; id: string; role: string };

const TOKEN_KEY = "token";
const USER_KEY  = "user";   // optional, if you store a user object too

export function saveSession(token: string, user?: any) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUserNew(): { token: string; decoded: Decoded; user?: any } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<Decoded>(token);
    // expired?
    if (decoded.exp * 1000 <= Date.now()) {
      clearSession();
      return null;
    }
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : undefined;
    return { token, decoded, user };
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let logoutTimer: number | null = null;

/** Call after login to auto-logout exactly at token expiry */
export function scheduleAutoLogout(token: string, onLogout: () => void) {
  try {
    const { exp } = jwtDecode<Decoded>(token);
    const msLeft = exp * 1000 - Date.now();
    if (logoutTimer) window.clearTimeout(logoutTimer);
    if (msLeft <= 0) return onLogout();
    logoutTimer = window.setTimeout(() => onLogout(), msLeft) as unknown as number;
  } catch {
    onLogout();
  }
}
