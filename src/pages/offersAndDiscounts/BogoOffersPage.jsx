import React, {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {toast} from "react-hot-toast";
import {
    getAllBogoOffers, createBogo, updateBogo, deleteBogo, setStatusFilter,
} from "../../features/offersAndDiscounts/bogoSlice";
import {getAllCategories} from "../../features/catalog/categoriesSlice";
import MasterLayout from "../../masterLayout/MasterLayout";
import Select from "react-select";
import Swal from "sweetalert2";
import {getProducts} from "../../features/catalog/productsSlice";

const BogoOffersPage = () => {
    const dispatch = useDispatch();
    const {items = [], loading, statusFilter = "all", activeOnly = false} = useSelector((s) => s.bogo || {});
    const {items: categoriesItems = []} = useSelector((s) => s.categories || {});

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [list, setList] = useState([]);

    const [products, setProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [searchBuy, setSearchBuy] = useState("");
    const [searchGet, setSearchGet] = useState("");

    // Form State
    const [form, setForm] = useState({
        id: undefined,
        title: "",
        buyQuantity: 1,
        buyType: "product",
        buyItemIds: [],
        getQuantity: 1,
        getType: "product",
        getItemIds: [],
        discountType: "free",
        discountValue: "",
        startDate: "",
        endDate: "",
        status: true,
    });

    const resetForm = () => {
        setForm({
            id: undefined,
            title: "",
            buyQuantity: 1,
            buyType: "product",
            buyItemIds: [],
            getQuantity: 1,
            getType: "product",
            getItemIds: [],
            discountType: "free",
            discountValue: "",
            startDate: "",
            endDate: "",
            status: true,
        });
    };

    // ===========================
    // Loaders
    // ===========================
    const loadProducts = async () => {
        try {
            const data = await getProducts({page: 1, limit: 100});
            const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
            setProducts(list);
            setProductOptions(list.map((p) => ({
                value: p._id,
                label: p.name || p.title || p.sku || p._id,
                thumbnail: p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || "",
            })));
        } catch {
            setProductOptions([]);
        }
    };

    const loadCategories = async () => {
        const res = await dispatch(getAllCategories());
        const list = res?.payload?.items || res?.payload || categoriesItems || [];
        setCategoryOptions((Array.isArray(list) ? list : []).map((c) => ({
            value: c._id, label: c.name || c.title || c._id,
        })));
    };

    // ===========================
    // Fetch BOGO Offers
    // ===========================
    const fetchBogoOffers = async (filter = statusFilter, active = activeOnly) => {
        const res = await dispatch(getAllBogoOffers({
            status: filter === "all" ? undefined : filter, active: active || undefined,
        }));
        const fetched = res?.payload?.data || res?.payload?.items || res?.payload || [];
        setList(Array.isArray(fetched) ? fetched : []);
    };

    useEffect(() => {
        fetchBogoOffers();
        loadProducts();
        loadCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Removed unused derived option filters; selects use base options directly

    // ===========================
    // Table Data
    // ===========================
    const tableHeaders = ["Title", "Discount Type", "Start Date", "End Date", "Status",];

    const sourceData = Array.isArray(items) && items.length > 0 ? items : list;

    const tableData = Array.isArray(sourceData) ? sourceData.map((item) => {
        const statusText = item.status === "active" || item.status === true ? "Active" : "Inactive";
        const statusBadge = statusText === "Active" ? `<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>${statusText}</span>` : `<span class='bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm'>${statusText}</span>`;
        return {
            title: item.title || "-",
            // buyquantity: item.buy?.quantity ?? 0,
            // getquantity: item.get?.quantity ?? 0,
            discounttype: item.get?.discountType || "free",
            startdate: item.startDate ? new Date(item.startDate).toLocaleString() : "-",
            enddate: item.endDate ? new Date(item.endDate).toLocaleString() : "-",
            status: statusBadge,
            _id: item._id,
        };
    }) : [];

    // ===========================
    // Actions
    // ===========================
    const openCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (row) => {
        const target = (Array.isArray(items) ? items : []).find((x) => x._id === row._id) || (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
        if (!target) return;
        const buyType = Array.isArray(target?.buy?.products) ? "product" : Array.isArray(target?.buy?.categories) ? "category" : "product";
        const getType = Array.isArray(target?.get?.products) ? "product" : Array.isArray(target?.get?.categories) ? "category" : "product";

        setForm({
            id: target._id,
            title: target.title || "",
            buyQuantity: target.buy?.quantity ?? 1,
            buyType,
            buyItemIds: buyType === "product" ? target.buy?.products || [] : target.buy?.categories || [],
            getQuantity: target.get?.quantity ?? 1,
            getType,
            getItemIds: getType === "product" ? target.get?.products || [] : target.get?.categories || [],
            discountType: target.get?.discountType || "free",
            discountValue: target.get?.discountType !== "free" ? target.get?.value ?? "" : "",
            startDate: target.startDate ? String(target.startDate).slice(0, 16) : "",
            endDate: target.endDate ? String(target.endDate).slice(0, 16) : "",
            status: target.status === "active" || !!target.status,
        });
        setShowModal(true);
    };

    const handleDelete = async (row) => {
        const target = (Array.isArray(items) ? items : []).find((x) => x._id === row._id) || (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
        if (!target) return;
        const res = await Swal.fire({
            title: "Delete discount?", icon: "warning", showCancelButton: true,
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },});
        if (!res.isConfirmed) return;
        dispatch(deleteBogo(target._id)).then(() => fetchBogoOffers());
    };

    const openView = (row) => {
        const target = (Array.isArray(items) ? items : []).find((x) => x._id === row._id) || (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
        if (!target) return;
        setViewItem(target);
        setShowViewModal(true);
    };

    // ===========================
    // Validation + Submit
    // ===========================
    const validateForm = () => {
        const errs = [];
        if (!String(form.title).trim()) errs.push("Title is required");
        if (!(Number(form.buyQuantity) > 0)) errs.push("Buy quantity must be > 0");
        if (!(Number(form.getQuantity) > 0)) errs.push("Get quantity must be > 0");
        if (!Array.isArray(form.buyItemIds) || !form.buyItemIds.length) errs.push("Select at least one Buy item");
        if (!Array.isArray(form.getItemIds) || !form.getItemIds.length) errs.push("Select at least one Get item");
        if (form.discountType !== "free" && !(Number(form.discountValue) > 0)) errs.push("Discount value required");
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) errs.push("End date must be after start date");

        if (errs.length) {
            errs.forEach((e) => toast.error(e));
            return false;
        }
        return true;
    };

    const submitForm = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            title: String(form.title).trim(),
            buy: {
                quantity: Number(form.buyQuantity),
                products: form.buyType === "product" ? form.buyItemIds : [],
                categories: form.buyType === "category" ? form.buyItemIds : [],
            },
            get: {
                quantity: Number(form.getQuantity),
                products: form.getType === "product" ? form.getItemIds : [],
                categories: form.getType === "category" ? form.getItemIds : [],
                discountType: form.discountType, ...(form.discountType !== "free" ? {value: parseFloat(form.discountValue) || 0} : {}),
            },
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            status: form.status ? "active" : "inactive",
        };

        const action = form.id ? updateBogo({id: form.id, payload}) : createBogo(payload);

        const res = await dispatch(action);
        if (!res.error) {
            setShowModal(false);
            resetForm();
            fetchBogoOffers();
        }
    };

    // ===========================
    // Filters
    // ===========================
    const statusFilterChange = (e) => {
        const v = e.target.value;
        dispatch(setStatusFilter(v));
        fetchBogoOffers(v, activeOnly);
    };

    // Removed unused activeOnlyChange handler

    const resolveProductName = (id) => {
        const p = products.find((x) => String(x._id) === String(id));
        return p?.name || p?.title || id;
    };
    const resolveCategoryName = (id) => {
        const c = categoryOptions.find((x) => String(x.value) === String(id));
        return c?.label || id;
    };
    return (<MasterLayout>
            <Breadcrumb title="BOGO Offers"/>

            <div className="d-flex align-items-center justify-content-between mb-16">
                <div className="d-flex align-items-center gap-8">
                    <label className="form-label mb-0">Status</label>
                    <select className="form-select" style={{maxWidth: 180}} value={statusFilter}
                            onChange={statusFilterChange}>
                        <option value="all">All</option>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                    </select>
                </div>

                <button className="btn btn-primary-600" onClick={openCreate}>
                    <i className="ri-add-line me-1"/> New BOGO Offer
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    <div style={{ overflowX: "auto" }}>
                    {loading ? (<div className="text-center py-24">Loading…</div>) : (<TableDataLayer
                            title="BOGO Offers"
                            headers={tableHeaders}
                            data={tableData}
                            onView={(row) => openView(row)}
                            onEdit={(row) => openEdit(row)}
                            onDelete={(row) => handleDelete(row)}
                        />)}
                    </div>
                </div>
            </div>

            {showModal && (<>
                    <div
                        className="modal-backdrop fade show"

                    ></div>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        style={{
                            zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{form.id ? "Edit" : "Create"} BOGO Offer</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}/>
                                </div>

                                <form onSubmit={submitForm}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-12">
                                                <label className="form-label">Title *</label>
                                                <input type="text"
                                                       className={`form-control ${!form.title?.trim() ? "is-invalid" : ""}`}
                                                       value={form.title}
                                                       onChange={(e) => setForm({...form, title: e.target.value})}
                                                       required/>
                                            </div>

                                            <div className="col-md-12">
                                                <hr/>
                                                <h6 className="mb-0">Buy</h6></div>
                                            <div className="col-md-3">
                                                <label className="form-label">Quantity *</label>
                                                <input type="number" min={1} className="form-control"
                                                       value={form.buyQuantity}
                                                       onChange={(e) => setForm({...form, buyQuantity: e.target.value})}
                                                       required/>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Type *</label>
                                                <select className="form-select" value={form.buyType} onChange={(e) => {
                                                    const v = e.target.value;
                                                    setForm({...form, buyType: v, buyItemIds: []});
                                                    setSearchBuy("");
                                                }} required>
                                                    <option value="product">Product</option>
                                                    <option value="category">Category</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Select {form.buyType} (multi-select)
                                                    *</label>
                                                <Select
                                                    isMulti
                                                    options={form.buyType === "product" ? productOptions : categoryOptions}
                                                    value={(form.buyType === "product" ? productOptions : categoryOptions).filter((opt) => (form.buyItemIds || []).some((id) => String(id) === String(opt.value)))}
                                                    onChange={(selected) => setForm({
                                                        ...form, buyItemIds: (selected || []).map((o) => o.value)
                                                    })}
                                                    classNamePrefix="react-select"
                                                    placeholder={`Select ${form.buyType}(s)`}
                                                />
                                            </div>

                                            <div className="col-md-12">
                                                <hr/>
                                                <h6 className="mb-0">Get</h6></div>
                                            <div className="col-md-3">
                                                <label className="form-label">Quantity *</label>
                                                <input type="number" min={1} className="form-control"
                                                       value={form.getQuantity}
                                                       onChange={(e) => setForm({...form, getQuantity: e.target.value})}
                                                       required/>
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Type *</label>
                                                <select className="form-select" value={form.getType} onChange={(e) => {
                                                    const v = e.target.value;
                                                    setForm({...form, getType: v, getItemIds: []});
                                                    setSearchGet("");
                                                }} required>
                                                    <option value="product">Product</option>
                                                    <option value="category">Category</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Select {form.getType} (multi-select)
                                                    *</label>
                                                <Select
                                                    isMulti
                                                    options={form.getType === "product" ? productOptions : categoryOptions}
                                                    value={(form.getType === "product" ? productOptions : categoryOptions).filter((opt) => (form.getItemIds || []).some((id) => String(id) === String(opt.value)))}
                                                    onChange={(selected) => setForm({
                                                        ...form, getItemIds: (selected || []).map((o) => o.value)
                                                    })}
                                                    classNamePrefix="react-select"
                                                    placeholder={`Select ${form.getType}(s)`}
                                                />
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">Discount Type *</label>
                                                <select className="form-select" value={form.discountType}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setForm({
                                                                ...form,
                                                                discountType: v,
                                                                discountValue: v === "free" ? "" : form.discountValue
                                                            });
                                                        }} required>
                                                    <option value="free">free</option>
                                                    <option value="percent">percent</option>
                                                    <option value="flat">flat</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Discount
                                                    Value {form.discountType !== "free" ? "*" : ""}</label>
                                                <input type="number" min={0} className="form-control"
                                                       value={form.discountValue}
                                                       onChange={(e) => setForm({
                                                           ...form, discountValue: e.target.value
                                                       })}
                                                       disabled={form.discountType === "free"}
                                                       required={form.discountType !== "free"}/>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Priority</label>
                                                <input type="number" min={0} className="form-control"
                                                       value={form.priority || ""}
                                                       onChange={(e) => setForm({...form, priority: e.target.value})}/>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Start Date</label>
                                                <input type="datetime-local" className="form-control"
                                                       value={form.startDate}
                                                       onChange={(e) => setForm({...form, startDate: e.target.value})}/>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">End Date</label>
                                                <input type="datetime-local" className="form-control"
                                                       value={form.endDate}
                                                       onChange={(e) => setForm({...form, endDate: e.target.value})}/>
                                            </div>

                                            <div className="col-md-12">
                                                <div className="form-switch">
                                                    <input className="form-check-input" type="checkbox" id="offerStatus"
                                                           checked={!!form.status}
                                                           onChange={(e) => setForm({
                                                               ...form, status: e.target.checked
                                                           })}/>
                                                    <label className="form-check-label"
                                                           htmlFor="offerStatus">Active</label>
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

            {showViewModal && (<>
                    <div
                        className="modal-backdrop fade show"

                    ></div>
                    <div
                        className="modal fade show d-block"
                        tabIndex="-1"
                        role="dialog"
                        style={{
                            zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">BOGO Offer Details</h5>
                                    <button type="button" className="btn-close"
                                            onClick={() => setShowViewModal(false)}/>
                                </div>
                                <div className="modal-body">
                                    {viewItem ? (<div className="row g-3">
                                            <div className="col-md-12"><h6 className="mb-8">{viewItem.title || '-'}</h6>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="fw-medium mb-4">Buy</div>
                                                <div>Quantity: {viewItem.buy?.quantity ?? '-'}</div>
                                                <div
                                                    className="mt-2">Products: {(Array.isArray(viewItem.buy?.products) ? viewItem.buy.products : []).map(resolveProductName).join(', ') || '-'}</div>
                                                <div
                                                    className="mt-2">Categories: {(Array.isArray(viewItem.buy?.categories) ? viewItem.buy.categories : []).map(resolveCategoryName).join(', ') || '-'}</div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="fw-medium mb-4">Get</div>
                                                <div>Quantity: {viewItem.get?.quantity ?? '-'}</div>
                                                <div>Discount Type: {viewItem.get?.discountType || '-'}</div>
                                                {viewItem.get?.discountType !== 'free' && (
                                                    <div>Discount Value: {viewItem.get?.value ?? '-'}</div>)}
                                                <div
                                                    className="mt-2">Products: {(Array.isArray(viewItem.get?.products) ? viewItem.get.products : []).map(resolveProductName).join(', ') || '-'}</div>
                                                <div
                                                    className="mt-2">Categories: {(Array.isArray(viewItem.get?.categories) ? viewItem.get.categories : []).map(resolveCategoryName).join(', ') || '-'}</div>
                                            </div>
                                            <div className="col-md-6 mt-3">
                                                <div>Start
                                                    Date: {viewItem.startDate ? new Date(viewItem.startDate).toLocaleString() : '-'}</div>
                                            </div>
                                            <div className="col-md-6 mt-3">
                                                <div>End
                                                    Date: {viewItem.endDate ? new Date(viewItem.endDate).toLocaleString() : '-'}</div>
                                            </div>
                                            <div className="col-md-6 mt-3">
                                                <div>Status: {(viewItem.status === 'active' || viewItem.status === true) ? 'Active' : 'Inactive'}</div>
                                            </div>
                                            <div className="col-md-6 mt-3">
                                                <div>Created
                                                    At: {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleString() : '-'}</div>
                                                <div>Updated
                                                    At: {viewItem.updatedAt ? new Date(viewItem.updatedAt).toLocaleString() : '-'}</div>
                                            </div>
                                        </div>) : (<div className="text-center py-24">No details available</div>)}
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

export default BogoOffersPage;
