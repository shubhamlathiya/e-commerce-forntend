import apiClient from "./client";

export const listSeo = async () => {
  const { data } = await apiClient.get("/api/catalog/seo");
  return data;
};

export const getSeo = (productId) => apiClient.get(`/api/catalog/seo/${productId}`);
export const updateSeo = (productId, payload) => apiClient.put(`/api/catalog/seo/${productId}`, payload);
export const deleteSeo = (productId) => apiClient.delete(`/api/catalog/seo/${productId}`);
