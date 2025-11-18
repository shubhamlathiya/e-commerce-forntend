import apiClient from "./client";

// Base paths
const BASE_SETTINGS = "/api/settings";

// Business Settings
export const getBusinessSettings = async () => {
  const { data } = await apiClient.get(`${BASE_SETTINGS}/business`);
  return data;
};

export const updateBusinessSettings = async (id, payload) => {
  if (id) {
    const { data } = await apiClient.put(`${BASE_SETTINGS}/business/${id}`, payload);
    return data;
  } else {
    const { data } = await apiClient.post(`${BASE_SETTINGS}/business`, payload);
    return data;
  }
};

// Email Settings
export const getEmailSettings = async () => {
  const { data } = await apiClient.get(`${BASE_SETTINGS}/email`);
  return data;
};

export const updateEmailSettings = async (payload) => {
  const { data } = await apiClient.put(`${BASE_SETTINGS}/email`, payload);
  return data;
};

// reCAPTCHA Settings
export const getRecaptchaSettings = async () => {
  const { data } = await apiClient.get(`${BASE_SETTINGS}/recaptcha`);

  return data;
};

export const updateRecaptchaSettings = async (payload) => {
  const { data } = await apiClient.put(`${BASE_SETTINGS}/recaptcha`, payload);
  return data;
};

// Payment Gateways
export const getPaymentGateways = async () => {
  const { data } = await apiClient.get(`${BASE_SETTINGS}/payment-gateways`);
  return data;
};

export const createPaymentGateway = async (payload) => {
  const { data } = await apiClient.post(`${BASE_SETTINGS}/payment-gateways`, payload);
  return data;
};

export const updatePaymentGateway = async (id, payload) => {
  const { data } = await apiClient.put(`${BASE_SETTINGS}/payment-gateways/${id}`, payload);
  return data;
};

export const deletePaymentGateway = async (id) => {
  const { data } = await apiClient.delete(`${BASE_SETTINGS}/payment-gateways/${id}`);
  return data;
};

export default {
  getBusinessSettings,
  updateBusinessSettings,
  getEmailSettings,
  updateEmailSettings,
  getRecaptchaSettings,
  updateRecaptchaSettings,
  getPaymentGateways,
  createPaymentGateway,
  updatePaymentGateway,
  deletePaymentGateway,
};