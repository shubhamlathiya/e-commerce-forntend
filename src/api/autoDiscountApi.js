import apiClient from "./client";

const BASE_URL = "/api/promotions/auto-discount";

export const listAutoDiscounts = async (params = {}) => {
  const { page = 1, limit = 20, search } = params || {};
  const { data } = await apiClient.get(BASE_URL, { params: { page, limit, search } });
  return data;
};

export const createAutoDiscount = async (payload) => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

export const updateAutoDiscount = async (id, payload) => {
  const { data } = await apiClient.patch(`${BASE_URL}/${id}`, payload);
  return data;
};

export const deleteAutoDiscount = async (id) => {
  const { data } = await apiClient.delete(`${BASE_URL}/${id}`);
  return data;
};

export default {
  listAutoDiscounts,
  createAutoDiscount,
  updateAutoDiscount,
  deleteAutoDiscount,
};
