import apiClient from "./client";

// Helper to include only provided keys
const only = (obj, keys) => keys.reduce((acc, k) => {
  if (obj[k] !== undefined && obj[k] !== null) acc[k] = obj[k];
  return acc;
}, {});

// Rules API
export const getShippingRules = async () => {
  const { data } = await apiClient.get("/api/shipping/rules");

  return data;
};

export const createShippingRule = async (payload) => {
  const allowed = [
    "title",
    "minOrderValue",
    "maxOrderValue",
    "shippingCost",
    "country",
    "state",
    "postalCodes",
    "status",
  ];
  const body = only(payload || {}, allowed);
  const { data } = await apiClient.post("/api/shipping/rules", body);
  return data;
};

export const updateShippingRule = async (id, payload) => {
  const allowed = [
    "title",
    "minOrderValue",
    "maxOrderValue",
    "shippingCost",
    "country",
    "state",
    "postalCodes",
    "status",
  ];
  const body = only(payload || {}, allowed);
  const { data } = await apiClient.put(`/api/shipping/rules/${id}`, body);
  return data;
};

export const deleteShippingRule = async (id) => {
  const { data } = await apiClient.delete(`/api/shipping/rules/${id}`);
  return data;
};

// Zones API
export const getShippingZones = async () => {
  const { data } = await apiClient.get("/api/shipping/zones");

  return data;
};

export const createShippingZone = async (payload) => {
  const allowed = ["zoneName", "countries", "states", "pincodes", "status"];
  const body = only(payload || {}, allowed);
  const { data } = await apiClient.post("/api/shipping/zones", body);
  return data;
};

export const updateShippingZone = async (id, payload) => {
  const allowed = ["zoneName", "countries", "states", "pincodes", "status"];
  const body = only(payload || {}, allowed);
  const { data } = await apiClient.put(`/api/shipping/zones/${id}`, body);
  return data;
};

export const deleteShippingZone = async (id) => {
  const { data } = await apiClient.delete(`/api/shipping/zones/${id}`);
  return data;
};

export default {
  getShippingRules,
  createShippingRule,
  updateShippingRule,
  deleteShippingRule,
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
};

