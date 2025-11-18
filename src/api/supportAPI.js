import apiClient from "./client";

// Enquiries API
export const listEnquiries = async ({ page = 1, limit = 10, search = "", status = "" } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  const { data } = await apiClient.get(`/api/support/enquiries`, { params });
  return data;
};

export const getEnquiry = async (id) => {
  const { data } = await apiClient.get(`/api/support/enquiries/${id}`);
  return data;
};

export const createEnquiry = async (payload) => {
  const { data } = await apiClient.post(`/api/support/enquiries`, payload);
  return data;
};

export const updateEnquiry = async (id, payload) => {
  const { data } = await apiClient.put(`/api/support/enquiries/${id}`, payload);
  return data;
};

export const deleteEnquiry = async (id) => {
  const { data } = await apiClient.delete(`/api/support/enquiries/${id}`);
  return data;
};

// Tickets API
export const listTickets = async ({ page = 1, limit = 10, search = "", status = "", priority = "", scope = "all" } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  if (priority) params.priority = priority;
  const endpoint = scope === "my" ? "/api/support/tickets/my" : "/api/support/tickets";
  const { data } = await apiClient.get(endpoint, { params });
  return data;
};

export const getTicket = async (id) => {
  const { data } = await apiClient.get(`/api/support/tickets/${id}`);
  return data;
};

export const createTicket = async (payload) => {
  const { data } = await apiClient.post(`/api/support/tickets`, payload);
  return data;
};

export const updateTicket = async (id, payload) => {
  const { data } = await apiClient.put(`/api/support/tickets/${id}`, payload);
  return data;
};

export const deleteTicket = async (id) => {
  const { data } = await apiClient.delete(`/api/support/tickets/${id}`);
  return data;
};

// Helpers
export const formatDateTime = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch (e) {
    return String(iso);
  }
};

