import apiClient from "./client";

const BASE_URL = "/api/auth/2fa";

export const enable2FA = async (method) => {
  const { data } = await apiClient.post(`${BASE_URL}/enable`, { method });
  return data;
};

export const verify2FA = async ({ method, token }) => {
  const { data } = await apiClient.post(`${BASE_URL}/verify`, { method, token });
  return data;
};

export const disable2FA = async (password) => {
  const { data } = await apiClient.post(`${BASE_URL}/disable`, { password });
  return data;
};

export const authenticate2FA = async ({ userId, token, method }) => {
  const { data } = await apiClient.post(`${BASE_URL}/authenticate`, { userId, token, method });
  return data;
};

export const get2FAStatus = async () => {
  const { data } = await apiClient.get(`${BASE_URL}/status`);
  return data;
};

export default {
  enable2FA,
  verify2FA,
  disable2FA,
  authenticate2FA,
  get2FAStatus,
};
