import apiClient from "./client";

// List variants (paginated, optional search)
export const listVariants = async ({ page = 1, limit = 20, search = "", productId } = {}) => {
  const params = { page, limit };
  if (search && search.trim()) params.search = search.trim();
  if (productId) params.productId = productId;
  const { data } = await apiClient.get("/api/catalog/variants", { params });
  return data;
};

// Create a variant
export const createVariant = async (payload) => {
  const { data } = await apiClient.post("/api/catalog/variants", payload);
  return data;
};

// Get variant details
export const getVariant = async (id) => {
  const { data } = await apiClient.get(`/api/catalog/variants/${id}`);
  return data;
};

// Update variant details
export const updateVariant = async (id, payload) => {

  const { data } = await apiClient.patch(`/api/catalog/variants/${id}`, payload);
  return data;
};

// Delete variant
export const deleteVariant = async (id) => {
  const { data } = await apiClient.delete(`/api/catalog/variants/${id}`);
  return data;
};

export default {
  listVariants,
  createVariant,
  getVariant,
  updateVariant,
  deleteVariant,
};
