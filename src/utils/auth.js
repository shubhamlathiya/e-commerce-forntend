// Centralized auth utilities for token management and validation
// - getToken: read JWT from localStorage or cookies
// - isTokenExpired: decode JWT and check exp
// - isAuthenticated: token exists and is not expired
// - logout: clear token and navigate to login
// - refreshToken: placeholder for future session extension

import jwtDecode from "jwt-decode";

// Configurable login path; default to '/sign-in' to match current routes
export const LOGIN_PATH = "/sign-in";

export function getToken(key = "authToken") {
  try {
    const fromStorage = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (fromStorage) return fromStorage;

    // Fallback to cookies
    if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp(`(^|; )${key}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (!decoded || typeof decoded !== "object" || !decoded.exp) return true;
    const expiryMs = decoded.exp * 1000;
    return Date.now() >= expiryMs;
  } catch (err) {
    return true;
  }
}

export function isAuthenticated(key = "authToken") {
  const token = getToken(key);
  if (!token) return false;
  return !isTokenExpired(token);
}

export function clearToken(key = "authToken") {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
    if (typeof document !== "undefined") {
      // Clear cookie
      document.cookie = `${key}=; Max-Age=0; path=/`;
    }
  } catch (e) {}
}

export function logout(navigate, key = "authToken", loginPath = LOGIN_PATH) {
  clearToken(key);
  try {
    if (typeof navigate === "function") {
      navigate(loginPath, { replace: true });
    } else if (typeof window !== "undefined") {
      window.location.replace(loginPath);
    }
  } catch (e) {}
}

// Placeholder - implement your refresh token logic here
// Return true if refresh succeeds and sets a new access token
export async function refreshToken() {
  return false;
}

export default {
  LOGIN_PATH,
  getToken,
  isTokenExpired,
  isAuthenticated,
  clearToken,
  logout,
  refreshToken,
};

