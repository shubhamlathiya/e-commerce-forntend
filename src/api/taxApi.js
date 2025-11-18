import apiClient from "./client";

export const listTaxRules = async () => {
  const { data } = await apiClient.get("/api/tax");
  return data;
};

export const createTaxRule = async (payload) => {
  const { data } = await apiClient.post("/api/tax", payload);
  return data;
};

export const updateTaxRule = async (id, payload) => {
  const { data } = await apiClient.patch(`/api/tax/${id}`, payload);
  return data;
};

export const deleteTaxRule = async (id) => {
  const { data } = await apiClient.delete(`/api/tax/${id}`);
  return data;
};

export default {
  listTaxRules,
  createTaxRule,
  updateTaxRule,
  deleteTaxRule,
};

