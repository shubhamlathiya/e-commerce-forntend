import apiClient from "./client";

const BASE_URL = "/api/promotions/bogo";

export const listBogoOffers = async (params = {}) => {
  const { page = 1, limit = 20, status, active } = params;
  const res = await apiClient.get(BASE_URL, { params: { page, limit, status, active } });
  return res.data;
};

export const createBogoOffer = async (payload) => {
  const res = await apiClient.post(BASE_URL, payload);
  return res.data;
};

export const updateBogoOffer = async (id, payload) => {
  const res = await apiClient.patch(`${BASE_URL}/${id}`, payload);
  return res.data;
};

export const deleteBogoOffer = async (id) => {
  const res = await apiClient.delete(`${BASE_URL}/${id}`);
  return res.data;
};

export default {
  listBogoOffers,
  createBogoOffer,
  updateBogoOffer,
  deleteBogoOffer,
};

