import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import {
  listCoupons,
  createCoupon as apiCreateCoupon,
  updateCoupon as apiUpdateCoupon,
  deleteCoupon as apiDeleteCoupon,
} from "../../api/couponsApi";

const initialState = {
  items: [],
  loading: false,
  error: null,
  statusFilter: "all",
  search: "",
  page: 1,
  limit: 20,
  total: 0,
};

export const getAllCoupons = createAsyncThunk(
  "coupons/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await listCoupons(params);
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load coupons";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const createCoupon = createAsyncThunk(
  "coupons/create",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await apiCreateCoupon(payload);
      toast.success("Coupon created");
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to create coupon";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await apiUpdateCoupon(id, payload);
      toast.success("Coupon updated");
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update coupon";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/delete",
  async (id, { rejectWithValue }) => {
    try {
      const data = await apiDeleteCoupon(id);
      toast.success("Coupon deleted");
      return { id, data };
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete coupon";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const couponsSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCoupons.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        // Support both {items,total} and array
        state.items = Array.isArray(payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
        state.total = payload.total || state.items.length;
      })
      .addCase(getAllCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load coupons";
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        const created = action.payload;
        if (created && created._id) {
          state.items = [created, ...state.items];
        }
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((x) => (x._id === updated._id ? updated : x));
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        const { id } = action.payload || {};
        state.items = state.items.filter((x) => x._id !== id);
      });
  },
});

export const { setStatusFilter } = couponsSlice.actions;
export default couponsSlice.reducer;
