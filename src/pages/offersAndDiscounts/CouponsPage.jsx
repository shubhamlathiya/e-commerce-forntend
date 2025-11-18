import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {toast} from "react-hot-toast";
import Swal from "sweetalert2";
import Select from "react-select";
import {
    getAllCoupons, createCoupon, updateCoupon, deleteCoupon, setStatusFilter,
} from "../../features/offersAndDiscounts/couponsSlice";
import {getProducts} from "../../features/catalog/productsSlice";

import apiClient from "../../api/client";
import MasterLayout from "../../masterLayout/MasterLayout";
import productApi from "../../api/productApi";

const listUsers = async () => {
    const {data} = await apiClient.get("/api/users");
    return data;
};

const CouponsPage = () => {
    const dispatch = useDispatch();
    const {items = [], loading, statusFilter = "all", error} = useSelector((s) => s.coupons || {});

    // Filters
    const [search, setSearch] = useState("");

    // Reference data for multi-selects
    const [productOptions, setProductOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);

    const [form, setForm] = useState({
        id: undefined,
        code: "",
        type: "percent", // percent | flat
        value: "",
        minOrderAmount: "",
        maxDiscount: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
        usagePerUser: "",
        allowedUsers: [],
        allowedCategories: [],
        allowedProducts: [],
        allowedBrands: [],
        status: true,
    });

    const resetForm = () => {
        setForm({
            id: undefined,
            code: "",
            type: "percent",
            value: "",
            minOrderAmount: "",
            maxDiscount: "",
            startDate: "",
            endDate: "",
            usageLimit: "",
            usagePerUser: "",
            allowedUsers: [],
            allowedCategories: [],
            allowedProducts: [],
            allowedBrands: [],
            status: true,
        });
    };

    const loadRefs = async () => {
        try {
            const prodData = await getProducts({page: 1, limit: 200});
            const prodList = Array.isArray(prodData?.items) ? prodData.items : Array.isArray(prodData) ? prodData : [];
            setProductOptions((Array.isArray(prodList) ? prodList : []).map((p) => ({
                value: p._id,
                label: p.name || p.title || p.sku || p._id,
                thumbnail: p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || "",
            })));

            const catData = await productApi.getCategories();
            const catList = Array.isArray(catData.data) ? catData.data : Array.isArray(catData) ? catData : [];
            setCategoryOptions((Array.isArray(catList) ? catList : []).map((c) => ({
                value: c._id, label: c.name || c.title || c.slug || c._id
            })));


            const brData = await productApi.getBrands();
            const brList = Array.isArray(brData?.data) ? brData.data : Array.isArray(brData) ? brData : [];
            setBrandOptions((Array.isArray(brList) ? brList : []).map((b) => ({
                value: b._id, label: b.name || b.title || b.slug || b._id
            })));

            const usData = await listUsers();
            const usList = Array.isArray(usData?.items) ? usData.items : Array.isArray(usData) ? usData : [];
            setUserOptions((Array.isArray(usList) ? usList : []).map((u) => ({
                value: u._id, label: u.name || u.fullName || u.email || u._id
            })));
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        dispatch(getAllCoupons({status: statusFilter === "all" ? undefined : statusFilter, search}));
        loadRefs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounce search by 500ms
    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(getAllCoupons({status: statusFilter === "all" ? undefined : statusFilter, search}));
        }, 500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    // Surface API error as toast (ensures UI doesn't break)
    useEffect(() => {
        if (error) {
            toast.error("Failed to load coupons");
        }
    }, [error]);

    const currency = (n) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return String(n || "");
        try {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(v);
        } catch (e) {
            return `₹${v.toFixed(2)}`;
        }
    };

    const formatValue = (type, value) => {
        if (type === "percent") return `${Number(value)}%`;
        return currency(value);
    };

    const isExpired = (endDate) => (endDate ? new Date(endDate) < new Date() : false);

    const tableHeaders = ["Code", "Type", "Value", "Min Order Amount", "Max Discount", "Status", "Start Date", "End Date",];

    const tableData = (Array.isArray(items) ? items : []).map((it) => {
        const statusActive = it.status === "active" || it.status === true;
        const expired = isExpired(it.endDate);
        const statusBadge = statusActive && !expired
            ? '<span class="px-24 py-4 rounded-pill fw-medium text-sm bg-success-focus text-success-main">active</span>'
            : '<span class="px-24 py-4 rounded-pill fw-medium text-sm bg-warning-focus text-warning-main">inactive</span>';

        return {
            code: it.code || "",
            type: it.type || "",
            value: formatValue(it.type, it.value),
            minorderamount: typeof it.minOrderAmount === "number" ? currency(it.minOrderAmount) : (it.minOrderAmount || ""),
            maxdiscount: typeof it.maxDiscount === "number" ? currency(it.maxDiscount) : (it.maxDiscount || ""),
            status: statusBadge,
            startdate: it.startDate ? new Date(it.startDate).toLocaleString() : "",
            enddate: it.endDate ? new Date(it.endDate).toLocaleString() : "",
            _id: it._id,
        };
    });

    const openCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const [showModal, setShowModal] = useState(false);

    const openEdit = (row) => {
        const target = items.find((x) => x._id === row._id);
        if (!target) return;
        setForm({
            id: target._id,
            code: String(target.code || "").toUpperCase(),
            type: target.type || "percent",
            value: target.value ?? "",
            minOrderAmount: target.minOrderAmount ?? "",
            maxDiscount: target.maxDiscount ?? "",
            startDate: target.startDate ? String(target.startDate).slice(0, 16) : "",
            endDate: target.endDate ? String(target.endDate).slice(0, 16) : "",
            usageLimit: target.usageLimit ?? "",
            usagePerUser: target.usagePerUser ?? "",
            allowedUsers: Array.isArray(target.allowedUsers) ? target.allowedUsers.map((u) => u._id || u) : [],
            allowedCategories: Array.isArray(target.allowedCategories) ? target.allowedCategories.map((c) => c._id || c) : [],
            allowedProducts: Array.isArray(target.allowedProducts) ? target.allowedProducts.map((p) => p._id || p) : [],
            allowedBrands: Array.isArray(target.allowedBrands) ? target.allowedBrands.map((b) => b._id || b) : [],
            status: target.status === "active" || !!target.status,
        });
        setShowModal(true);
    };

    const handleDelete = async (row) => {
        const target = items.find((x) => x._id === row._id);
        if (!target) return;
        const result = await Swal.fire({
            title: "Delete coupon?",
            text: `Code: ${target.code}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!result.isConfirmed) return;
        dispatch(deleteCoupon(target._id)).then((res) => {
            if (res.error) return;
            toast.success("Coupon deleted");
            dispatch(getAllCoupons({status: statusFilter === "all" ? undefined : statusFilter, search}));
        });
    };

    // View modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    const openView = (row) => {
        const target = items.find((x) => x._id === row._id);
        if (!target) return;
        setViewItem(target);
        setShowViewModal(true);
    };

    const validateForm = () => {
        const errs = [];
        const code = String(form.code || "").trim().toUpperCase();
        if (!code) errs.push("Code is required");
        if (!/^[A-Z0-9_-]+$/.test(code)) errs.push("Code must be uppercase letters, numbers, - or _");
        if (!form.type || !["percent", "flat"].includes(form.type)) errs.push("Type must be percent or flat");
        if (!(Number(form.value) > 0)) errs.push("Value must be a positive number");
        const moa = form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount);
        const md = form.maxDiscount === "" ? 0 : Number(form.maxDiscount);
        if (moa < 0) errs.push("Min order amount must be ≥ 0");
        if (md < 0) errs.push("Max discount must be ≥ 0");
        if (!form.startDate || !form.endDate) errs.push("Start and End dates are required");
        if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) errs.push("End date must be after start date");
        const ul = form.usageLimit === "" ? 0 : Number(form.usageLimit);
        const upu = form.usagePerUser === "" ? 0 : Number(form.usagePerUser);
        if (ul < 0 || !Number.isFinite(ul)) errs.push("Usage limit must be an integer ≥ 0");
        if (upu < 0 || !Number.isFinite(upu)) errs.push("Per user limit must be an integer ≥ 0");
        if (errs.length) {
            errs.forEach((e) => toast.error(e));
            return false;
        }
        return true;
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        const payload = {
            code: String(form.code).toUpperCase(),
            type: form.type,
            value: Number(form.value),
            minOrderAmount: form.minOrderAmount === "" ? undefined : Number(form.minOrderAmount),
            maxDiscount: form.maxDiscount === "" ? undefined : Number(form.maxDiscount),
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            usageLimit: form.usageLimit === "" ? undefined : Number(form.usageLimit),
            usagePerUser: form.usagePerUser === "" ? undefined : Number(form.usagePerUser),
            allowedUsers: form.allowedUsers,
            allowedCategories: form.allowedCategories,
            allowedProducts: form.allowedProducts,
            allowedBrands: form.allowedBrands,
            status: form.status ? "active" : "inactive",
        };
        const refresh = () => dispatch(getAllCoupons({
            status: statusFilter === "all" ? undefined : statusFilter, search
        }));
        if (form.id) {
            dispatch(updateCoupon({id: form.id, payload})).then((res) => {
                if (res.error) return;
                setShowModal(false);
                resetForm();
                refresh();
            });
        } else {
            dispatch(createCoupon(payload)).then((res) => {
                if (res.error) return;
                setShowModal(false);
                resetForm();
                refresh();
            });
        }
    };

    // Support both native event and react-select option
    const statusFilterChange = (input) => {
        const v = typeof input === "string" ? input : (input && (input.value ?? input.target?.value)) || "all";
        dispatch(setStatusFilter(v));
        dispatch(getAllCoupons({status: v === "all" ? undefined : v, search}));
    };

    const performSearch = (e) => {
        e.preventDefault();
        dispatch(getAllCoupons({status: statusFilter === "all" ? undefined : statusFilter, search}));
    };

    // Multi-select handlers
    const updateMultiSelect = (key, values) => {
        setForm({...form, [key]: values});
    };


    return (<MasterLayout>
        <Breadcrumb title="Coupons"/>

        <div className="d-flex flex-wrap align-items-center justify-content-between mb-16 gap-8">
            <form className="d-flex align-items-center gap-8" onSubmit={performSearch}>
                <input className="form-control" placeholder="Search code or name…" value={search}
                       onChange={(e) => setSearch(e.target.value)} style={{maxWidth: 280}}/>
                <button className="btn btn-light" type="submit"><i className="ri-search-line"/> Search</button>
            </form>

            <div className="d-flex align-items-center gap-8" style={{minWidth: 220}}>
                <label className="form-label mb-0">Status</label>
                <div style={{minWidth: 180}}>
                    <Select
                        classNamePrefix="react-select"
                        isSearchable={false}
                        options={[
                            {label: "All", value: "all"},
                            {label: "active", value: "active"},
                            {label: "inactive", value: "inactive"},
                        ]}
                        value={[
                            {label: "All", value: "all"},
                            {label: "active", value: "active"},
                            {label: "inactive", value: "inactive"},
                        ].find((o) => o.value === statusFilter)}
                        onChange={statusFilterChange}
                    />
                </div>
            </div>

            <button className="btn btn-primary-600" onClick={openCreate}>
                <i className="ri-add-line me-1"/> New Coupon
            </button>
        </div>

        <div className="card">
            <div className="card-body">
                <div style={{overflowX: "auto"}}>
                    {loading ? (
                        <div className="text-center py-24">Loading coupons…</div>
                    ) : (
                        <TableDataLayer
                            title="Coupons"
                            headers={tableHeaders}
                            data={tableData}
                            onView={(row) => openView(row)}
                            onEdit={(row) => openEdit(row)}
                            onDelete={(row) => handleDelete(row)}
                        />
                    )}
                </div>
            </div>
        </div>

        {showModal && (
            <>
                <div
                    className="modal-backdrop fade show"

                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        zIndex: 1050,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{form.id ? "Edit" : "Create"} Coupon</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}/>
                            </div>

                            <form onSubmit={submitForm}>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Code *</label>
                                            <input type="text"
                                                   className={`form-control ${!form.code?.trim() ? "is-invalid" : ""}`}
                                                   value={form.code} onChange={(e) => setForm({
                                                ...form, code: e.target.value.toUpperCase()
                                            })} required/>
                                            <div className="form-text">Uppercase only</div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Type *</label>
                                            <select className="form-select" value={form.type}
                                                    onChange={(e) => setForm({...form, type: e.target.value})} required>
                                                <option value="percent">percent</option>
                                                <option value="flat">flat</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Value *</label>
                                            <input type="number" min={0} step="0.01" className="form-control"
                                                   value={form.value}
                                                   onChange={(e) => setForm({...form, value: e.target.value})}
                                                   required/>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Min Order Amount</label>
                                            <input type="number" min={0} step="0.01" className="form-control"
                                                   value={form.minOrderAmount} onChange={(e) => setForm({
                                                ...form, minOrderAmount: e.target.value
                                            })}/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Max Discount</label>
                                            <input type="number" min={0} step="0.01" className="form-control"
                                                   value={form.maxDiscount}
                                                   onChange={(e) => setForm({...form, maxDiscount: e.target.value})}/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Usage Limit</label>
                                            <input type="number" min={0} step="1" className="form-control"
                                                   value={form.usageLimit}
                                                   onChange={(e) => setForm({...form, usageLimit: e.target.value})}/>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Per User Limit</label>
                                            <input type="number" min={0} step="1" className="form-control"
                                                   value={form.usagePerUser}
                                                   onChange={(e) => setForm({...form, usagePerUser: e.target.value})}/>
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Start Date *</label>
                                            <input type="datetime-local" className="form-control" value={form.startDate}
                                                   onChange={(e) => setForm({...form, startDate: e.target.value})}
                                                   required/>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">End Date *</label>
                                            <input type="datetime-local" className="form-control" value={form.endDate}
                                                   onChange={(e) => setForm({...form, endDate: e.target.value})}
                                                   required/>
                                        </div>

                                        <div className="col-md-12">
                                            <hr/>
                                            <h6 className="mb-0">Allowed Users/Catalog</h6></div>

                                        <div className="col-md-4">
                                            <label className="form-label">Allowed Users</label>
                                            <Select
                                                isMulti
                                                isSearchable
                                                options={userOptions}
                                                value={(userOptions || []).filter((opt) => (form.allowedUsers || []).includes(opt.value))}
                                                onChange={(selected) => updateMultiSelect("allowedUsers", (selected || []).map((o) => o.value))}
                                                classNamePrefix="react-select"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Allowed Categories</label>
                                            <Select
                                                isMulti
                                                isSearchable
                                                options={categoryOptions}
                                                value={(categoryOptions || []).filter((opt) => (form.allowedCategories || []).includes(opt.value))}
                                                onChange={(selected) => updateMultiSelect("allowedCategories", (selected || []).map((o) => o.value))}
                                                classNamePrefix="react-select"
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Allowed Brands</label>
                                            <Select
                                                isMulti
                                                isSearchable
                                                options={brandOptions}
                                                value={(brandOptions || []).filter((opt) => (form.allowedBrands || []).includes(opt.value))}
                                                onChange={(selected) => updateMultiSelect("allowedBrands", (selected || []).map((o) => o.value))}
                                                classNamePrefix="react-select"
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <label className="form-label">Allowed Products</label>
                                            <Select
                                                isMulti
                                                isSearchable
                                                options={productOptions}
                                                value={(productOptions || []).filter((opt) => (form.allowedProducts || []).includes(opt.value))}
                                                onChange={(selected) => updateMultiSelect("allowedProducts", (selected || []).map((o) => o.value))}
                                                classNamePrefix="react-select"
                                            />
                                        </div>

                                        <div className="col-md-12">
                                            <div className="form-check form-switch">
                                                <input className="form-check-input" type="checkbox" id="couponStatus"
                                                       checked={!!form.status}
                                                       onChange={(e) => setForm({...form, status: e.target.checked})}/>
                                                <label className="form-check-label"
                                                       htmlFor="couponStatus">Active</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-neutral-400"
                                            onClick={() => setShowModal(false)}>Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary-600">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </>)}

        {showViewModal && (
            <>
                <div
                    className="modal-backdrop fade show"

                ></div>
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    role="dialog"
                    style={{
                        zIndex: 1050,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">View Coupon</h5>
                                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}/>
                            </div>
                            <div className="modal-body">
                                {viewItem ? (<div className="row g-3">
                                    <div className="col-md-6"><strong>Code:</strong> {viewItem.code}</div>
                                    <div className="col-md-6"><strong>Type:</strong> {viewItem.type}</div>
                                    <div className="col-md-6">
                                        <strong>Value:</strong> {formatValue(viewItem.type, viewItem.value)}</div>
                                    <div className="col-md-6">
                                        <strong>Status:</strong> {viewItem.status === "active" || viewItem.status === true ? "active" : "inactive"}
                                    </div>
                                    <div className="col-md-6"><strong>Min Order
                                        Amount:</strong> {currency(viewItem.minOrderAmount)}</div>
                                    <div className="col-md-6"><strong>Max
                                        Discount:</strong> {currency(viewItem.maxDiscount)}</div>
                                    <div className="col-md-6"><strong>Start
                                        Date:</strong> {viewItem.startDate ? new Date(viewItem.startDate).toLocaleString() : ""}
                                    </div>
                                    <div className="col-md-6"><strong>End
                                        Date:</strong> {viewItem.endDate ? new Date(viewItem.endDate).toLocaleString() : ""}
                                    </div>
                                    <div className="col-md-12"><strong>Usage
                                        Limit:</strong> {viewItem.usageLimit ?? "-"}</div>
                                    <div className="col-md-12"><strong>Per User
                                        Limit:</strong> {viewItem.usagePerUser ?? "-"}</div>
                                    <div className="col-md-12">
                                        <strong>Allowed Users:</strong>
                                        <div>{(viewItem.allowedUsers || []).map((id) => (userOptions.find((o) => String(o.value) === String(id))?.label || id)).join(", ") || "-"}</div>
                                    </div>
                                    <div className="col-md-12">
                                        <strong>Allowed Categories:</strong>
                                        <div>{(viewItem.allowedCategories || []).map((id) => (categoryOptions.find((o) => String(o.value) === String(id))?.label || id)).join(", ") || "-"}</div>
                                    </div>
                                    <div className="col-md-12">
                                        <strong>Allowed Brands:</strong>
                                        <div>{(viewItem.allowedBrands || []).map((id) => (brandOptions.find((o) => String(o.value) === String(id))?.label || id)).join(", ") || "-"}</div>
                                    </div>
                                    <div className="col-md-12">
                                        <strong>Allowed Products:</strong>
                                        <div>{(viewItem.allowedProducts || []).map((id) => (productOptions.find((o) => String(o.value) === String(id))?.label || id)).join(", ") || "-"}</div>
                                    </div>
                                </div>) : null}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-neutral-400"
                                        onClick={() => setShowViewModal(false)}>Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>)}
    </MasterLayout>);
};

export default CouponsPage;
