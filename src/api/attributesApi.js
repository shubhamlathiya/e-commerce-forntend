import apiClient from "./client";

const BASE = "/api/catalog/attributes";

export const listAttributes = (params = {}) => {
  const { page = 1, limit = 10 } = params || {};
  return apiClient
    .get(BASE, { params: { page, limit } })
    .then((res) => res.data);
};

export const getAttributeById = (id) => {
  return apiClient.get(`${BASE}/${id}`).then((res) => res.data);
};

export const createAttribute = (payload) => {
  return apiClient.post(BASE, payload).then((res) => res.data);
};

export const updateAttribute = (id, payload) => {
  return apiClient.patch(`${BASE}/${id}`, payload).then((res) => res.data);
};

export const deleteAttribute = (id) => {
  return apiClient.delete(`${BASE}/${id}`).then((res) => res.data);
};

export default {
  listAttributes,
  getAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
};

