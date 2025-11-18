import apiClient from "./client";

// Product Pricing
export const listProductPricing = async (params = {}) => {
  // Supports optional query params: productId, variantId, status
  const { data } = await apiClient.get("/api/pricing/product", { params });
  return data;
};

// Get product pricing for a specific product/variant
export const getProductPricing = async ({ productId, variantId } = {}) => {
  const params = {};
  if (productId) params.productId = productId;
  if (variantId) params.variantId = variantId;
  const { data } = await apiClient.get("/api/pricing/product", { params });
  return data;
};

export const upsertProductPricing = async (payload) => {

  const { data } = await apiClient.put("/api/pricing/product", payload);
  return data;
};

// Some backends accept DELETE with body for composite keys
export const deleteProductPricing = async (identifier) => {
  // identifier may be { id } or { productId, variantId }
  const { data } = await apiClient.delete("/api/pricing/product", { data: identifier });
  return data;
};

// Tier Pricing
export const listTierPricing = async () => {
  const { data } = await apiClient.get("/api/pricing/tier");
  return data;
};

export const createTierPricing = async (payload) => {
  const { data } = await apiClient.post("/api/pricing/tier", payload);
  return data;
};

export const deleteTierPricing = async (id) => {
  const { data } = await apiClient.delete(`/api/pricing/tier/${id}`);
  return data;
};

// Special Pricing
export const listSpecialPricing = async () => {
  const { data } = await apiClient.get("/api/pricing/special");

  return data;
};

export const createSpecialPricing = async (payload) => {
  const { data } = await apiClient.post("/api/pricing/special", payload);
  return data;
};

export const deleteSpecialPricing = async (id) => {
  const { data } = await apiClient.delete(`/api/pricing/special/${id}`);
  return data;
};

// Resolve effective price
export const resolvePrice = async (params = {}) => {
  // optional query params such as productId, variantId
  const { data } = await apiClient.get("/api/pricing/resolve", { params });
  return data;
};

export default {
  listProductPricing,
  getProductPricing,
  upsertProductPricing,
  deleteProductPricing,
  listTierPricing,
  createTierPricing,
  deleteTierPricing,
  listSpecialPricing,
  createSpecialPricing,
  deleteSpecialPricing,
  resolvePrice,
};
