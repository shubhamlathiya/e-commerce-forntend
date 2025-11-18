import apiClient from "./client";

const BASE = "/api/catalog/shipping-classes";

export const listShippingClasses = async (params = {}) => {
  const { data } = await apiClient.get(BASE, { params });
  return data;
};

export const getShippingClass = async (id) => {
  const { data } = await apiClient.get(`${BASE}/${id}`);
  return data;
};

export const createShippingClass = async (payload) => {
  const { data } = await apiClient.post(BASE, payload);
  return data;
};

export const updateShippingClass = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE}/${id}`, payload);
  return data;
};

export const deleteShippingClass = async (id) => {
  const { data } = await apiClient.delete(`${BASE}/${id}`);
  return data;
};

export default {
  listShippingClasses,
  getShippingClass,
  createShippingClass,
  updateShippingClass,
  deleteShippingClass,
};
