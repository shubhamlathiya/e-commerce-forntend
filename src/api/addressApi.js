import apiClient from "./client";

// List addresses with optional filters: userId, city, country, search, page, limit, sort
export const listAddresses = async ({ userId, city = "", country = "", search = "", page = 1, limit = 10, sort = "updatedAt:desc" } = {}) => {
  const params = { page, limit };
  if (userId) params.userId = userId;
  if (city) params.city = city;
  if (country) params.country = country;
  if (search) params.search = search;
  if (sort) params.sort = sort;
  const { data } = await apiClient.get(`/api/address`, { params });
  return data;
};

export const createAddress = async (payload) => {
  const { data } = await apiClient.post(`/api/address`, payload);
  return data;
};

export const updateAddress = async (id, payload) => {
  const { data } = await apiClient.put(`/api/address/${id}`, payload);
  return data;
};

export const deleteAddress = async (id) => {
  const { data } = await apiClient.delete(`/api/address/${id}`);
  return data;
};

export const setDefaultAddress = async (id) => {
  const { data } = await apiClient.post(`/api/address/${id}/default`);
  return data;
};

// Normalizers for common response shapes
export const normalizeList = (res) => {
  if (!res) return { items: [], count: 0 };
  const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  const count = typeof res?.count === "number" ? res.count : items.length;
  return { items, count };
};

