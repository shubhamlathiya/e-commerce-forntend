import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, isTokenExpired, clearToken, LOGIN_PATH } from "../utils/auth";

// ProtectedRoute: prevents rendering of protected content until auth is validated
// Props:
// - children: protected content
// - loginPath: optional override of login route (defaults to '/sign-in')
// - tokenKey: optional token key name (defaults to 'authToken')
export default function ProtectedRoute({ children, loginPath = LOGIN_PATH, tokenKey = "authToken" }) {
  const location = useLocation();

  // Read token from storage/cookies
  const token = getToken(tokenKey);

  // If no token: redirect to login immediately
  if (!token) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Validate token
  const expired = isTokenExpired(token);
  if (expired) {
    clearToken(tokenKey);
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Token valid: render protected content
  return children;
}

