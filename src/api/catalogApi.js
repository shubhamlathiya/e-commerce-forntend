// catalogApi.js
import apiClient from "./client";

export const getTabCategories = async (params = {}) => {
  const response = await apiClient.get("/api/tabCategory/tab-categories", { params });
  return response.data;
};

export const createTabCategory = async (data) => {
  const isFormData = data instanceof FormData;
  console.log(data)
  if (isFormData) {
    const response = await apiClient.post("/api/tabCategory/admin/tab-categories", data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }
  const response = await apiClient.post("/api/tabCategory/admin/tab-categories", data);
  return response.data;
};

export const updateTabCategory = async (id, data) => {
  const isFormData = data instanceof FormData;
  if (isFormData) {
    const response = await apiClient.put(`/api/tabCategory/admin/tab-categories/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  }
  const response = await apiClient.put(`/api/tabCategory/admin/tab-categories/${id}`, data);
  return response.data;
};

export const deleteTabCategory = async (id) => {
  const response = await apiClient.delete(`/api/tabCategory/admin/tab-categories/${id}`);
  return response.data;
};

export const getSingleTabCategory = async (id) => {
  const response = await apiClient.get(`/api/tabCategory/admin/tab-categories/${id}`);
  return response.data;
};

export const getCategories = async (params = {}) => {
  const response = await apiClient.get("/api/catalog/categories", { params });
  return response.data;
};

