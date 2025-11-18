import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "../../api/autoDiscountApi";
import apiClient from "../../api/client";

// Thunks
export const getAutoDiscounts = createAsyncThunk(
  "autoDiscounts/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await api.listAutoDiscounts(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createAutoDiscount = createAsyncThunk(
  "autoDiscounts/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/api/promotions/auto-discount", payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateAutoDiscount = createAsyncThunk(
  "autoDiscounts/update",
  async ({ id, data: body }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.patch(`/api/promotions/auto-discount/${id}`, body);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteAutoDiscount = createAsyncThunk(
  "autoDiscounts/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/promotions/auto-discount/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

const slice = createSlice({
  name: "autoDiscounts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAutoDiscounts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getAutoDiscounts.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload || {};
        const items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        state.items = items;
        const page = payload?.page ?? payload?.meta?.page ?? state.page;
        const limit = payload?.limit ?? payload?.meta?.limit ?? state.limit;
        const total = payload?.total ?? payload?.meta?.total ?? items.length;
        const totalPages = payload?.totalPages ?? payload?.meta?.totalPages ?? Math.max(1, Math.ceil(total / (limit || 1)));
        state.page = page;
        state.limit = limit;
        state.total = total;
        state.totalPages = totalPages;
      })
      .addCase(getAutoDiscounts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createAutoDiscount.fulfilled, (state, action) => {
        const created = action.payload?.data || action.payload;
        if (created) state.items.unshift(created);
        toast.success("Auto discount created");
      })
      .addCase(createAutoDiscount.rejected, (state, action) => {
        toast.error(action.payload || action.error.message || "Failed to create auto discount");
      })
      .addCase(updateAutoDiscount.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        const idx = state.items.findIndex((t) => (t.id || t._id) === (updated?.id || updated?._id));
        if (idx >= 0) state.items[idx] = updated;
        toast.success("Auto discount updated");
      })
      .addCase(updateAutoDiscount.rejected, (state, action) => {
        toast.error(action.payload || action.error.message || "Failed to update auto discount");
      })
      .addCase(deleteAutoDiscount.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((t) => (t.id || t._id) !== id);
        toast.success("Auto discount deleted");
      })
      .addCase(deleteAutoDiscount.rejected, (state, action) => {
        toast.error(action.payload || action.error.message || "Failed to delete auto discount");
      });
  },
});

export default slice.reducer;
