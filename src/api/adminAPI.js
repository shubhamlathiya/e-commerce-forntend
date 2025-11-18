import apiClient from "./client";

export const listUsers = async ({ page = 1, limit = 10, search = "", role = "", status = "" } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (role) params.role = role;
  if (status) params.status = status;
  const { data } = await apiClient.get(`/api/admin/users`, { params });
  return data;
};

export const getUser = async (userId) => {
  const { data } = await apiClient.get(`/api/admin/users/${userId}`);
  return data;
};

export const patchUserStatus = async (userId, status) => {
  const { data } = await apiClient.patch(`/api/admin/users/${userId}/status`, { status });
  return data;
};

export const patchUserRoles = async (userId, roles) => {
  const { data } = await apiClient.patch(`/api/admin/users/${userId}/roles`, { roles });
  return data;
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch (e) {
    return String(iso);
  }
};

