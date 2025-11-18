import apiClient from "./client";

const BASE = "/api/catalog/product-faqs";

export const listFaqs = async ({ page = 1, limit = 50, productId } = {}) => {
  const params = { page, limit };
  if (productId) params.productId = productId;
  const { data } = await apiClient.get(BASE, { params });
  return data;
};

export const createFaq = async (payload) => {
  const { data } = await apiClient.post(BASE, payload);
  return data;
};

export const updateFaq = async (id, payload) => {
  const { data } = await apiClient.patch(`${BASE}/${id}`, payload);
  return data;
};

export const deleteFaq = async (id) => {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return data;
};

export default {
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};

