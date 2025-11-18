import apiClient from "./client";

// Helpers
const only = (obj, keys) => keys.reduce((acc, k) => {
  if (obj[k] !== undefined && obj[k] !== null) acc[k] = obj[k];
  return acc;
}, {});

const BASE_URL = "/api/refunds";

// List refunds with pagination, search, and filters
export const listRefunds = async (params = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status,
    mode,
    userId,
    orderId,
  } = params;
  const query = {};
  if (page) query.page = page;
  if (limit) query.limit = limit;
  if (search && search.trim()) query.search = search.trim();
  if (status) query.status = status;
  if (mode) query.mode = mode;
  if (userId) query.userId = userId;
  if (orderId) query.orderId = orderId;

  const { data } = await apiClient.get(BASE_URL, { params: query });
  return data;
};

// Get refund by ID
export const getRefund = async (id) => {
  const { data } = await apiClient.get(`${BASE_URL}/${id}`);
  return data;
};

// Create refund
export const createRefund = async (payload) => {
  const required = only(payload || {}, [
    "amount",
    "mode",
    "reason",
    "notes",
    "userId",
    "orderId",
    "status",
  ]);
  const { data } = await apiClient.post(BASE_URL, required);
  return data;
};

// Update refund
export const updateRefund = async (id, payload) => {
  const required = only(payload || {}, [
    "amount",
    "mode",
    "reason",
    "notes",
    "userId",
    "orderId",
    "status",
  ]);
  const { data } = await apiClient.put(`${BASE_URL}/${id}`, required);
  return data;
};

// Delete refund
export const deleteRefund = async (id) => {
  const { data } = await apiClient.delete(`${BASE_URL}/${id}`);
  return data;
};

export default {
  listRefunds,
  getRefund,
  createRefund,
  updateRefund,
  deleteRefund,
};
