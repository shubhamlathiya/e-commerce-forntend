import apiClient from "./client";

const BASE_URL = "/api/loyalty";

export const getAccount = async (userId) => {
  const { data } = await apiClient.get(`${BASE_URL}/account/${userId}`);
  return data;
};

export const upsertAccount = async (userId, payload) => {
  const { data } = await apiClient.put(`${BASE_URL}/account/${userId}`, payload);
  return data;
};

export const addTransaction = async (userId, payload) => {
  const { data } = await apiClient.post(`${BASE_URL}/history/${userId}`, payload);
  return data;
};

export const getHistory = async (userId) => {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/history/${userId}`);
    return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  } catch (err) {
    // If API not available, return empty list (fallback to local)
    return [];
  }
};

export const listUsers = async (query) => {
  const { data } = await apiClient.get(`/api/users`, { params: { search: query || undefined } });
  return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
};

export const listOrders = async (params = {}) => {
  const { data } = await apiClient.get(`/api/orders`, { params });
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items.map((o) => ({
    id: o._id || o.id,
    number: o.number || o.orderNumber || undefined,
    userId: o.userId || (o.user && (o.user._id || o.user.id)),
    total: o.total || o.amount || 0,
    date: o.date || o.createdAt || o.updatedAt,
  }));
};

