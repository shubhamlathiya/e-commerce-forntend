import apiClient from "./client";

const BASE_URL = "/api/promotions/combo";

export const listComboOffers = async (params = {}) => {
  const { page = 1, limit = 20, status } = params;
  const res = await apiClient.get(BASE_URL, { params: { page, limit, status } });
  return res.data;
};

export const createComboOffer = async (payload) => {
  const res = await apiClient.post(BASE_URL, payload);
  return res.data;
};

export const updateComboOffer = async (id, payload) => {
  const res = await apiClient.patch(`${BASE_URL}/${id}`, payload);
  return res.data;
};

export const deleteComboOffer = async (id) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export default {
  listComboOffers,
  createComboOffer,
  updateComboOffer,
  deleteComboOffer,
};

