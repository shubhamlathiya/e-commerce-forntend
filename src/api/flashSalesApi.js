import apiClient from "./client";

const BASE_URL = "/api/promotions/flash-sales";

export const listFlashSales = async (params = {}) => {
  const { page = 1, limit = 20, status, search } = params;
  const { data } = await apiClient.get(BASE_URL, { params: { page, limit, status, search } });
  return data;
};

export const createFlashSale = async (payload) => {
  const { data } = await apiClient.post(BASE_URL, payload);
  return data;
};

export const updateFlashSale = async (id, payload) => {
  const { data } = await apiClient.patch(`${BASE_URL}/${id}`, payload);
  return data;
};

export const deleteFlashSale = async (id) => {
  const { data } = await apiClient.delete(`${BASE_URL}/${id}`);
  return data;
};

export default {
  listFlashSales,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
};
