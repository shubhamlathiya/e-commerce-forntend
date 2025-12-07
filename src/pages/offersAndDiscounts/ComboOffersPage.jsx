import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {toast} from "react-hot-toast";
import {
    getAllComboOffers, createCombo, updateCombo, deleteCombo, setStatusFilter,
} from "../../features/offersAndDiscounts/comboSlice";
import MasterLayout from "../../masterLayout/MasterLayout";
import Swal from "sweetalert2";
import productApi from "../../api/productApi";
import Select from "react-select";

const ComboOffersPage = () => {
    const dispatch = useDispatch();
    const {items = [], loading, statusFilter = "all"} = useSelector((s) => s.combo || {});

    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewItem, setViewItem] = useState(null);
    const [products, setProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [list, setList] = useState([]);

    // Removed unused filteredProductOptions memo and local search state

    const [form, setForm] = useState({
        id: undefined,
        title: "",
        items: [{productId: "", quantity: 1}],
        comboPrice: "",
        startDate: "",
        endDate: "",
        status: true, // UI toggle; send enum later
    });

    const resetForm = () => {
        setForm({
            id: undefined,
            title: "",
            items: [{productId: "", quantity: 1}],
            comboPrice: "",
            startDate: "",
            endDate: "",
            status: true,
        });
    };

    const loadProducts = async () => {
        try {
            const {data} = await productApi.getProducts({page: 1, limit: 200});
            const list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
            setProducts(list);
            if (Array.isArray(list)) {
                setProductOptions(list.map((p) => ({
                    value: p._id,
                    label: p.name || p.title || p.sku || p._id,
                    thumbnail: p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || "",
                    thumb: p.thumbnail || p.image || (Array.isArray(p.images) && p.images[0]) || "",
                })));
            } else {
                setProductOptions([]); // fallback to empty options
            }
        } catch (e) {
            // silent
        }
    };

    useEffect(() => {
        dispatch(getAllComboOffers({status: statusFilter === "all" ? undefined : statusFilter})).then((res) => {
            const fetched = res?.payload?.data || res?.payload?.items || res?.payload || [];
            if (Array.isArray(fetched)) setList(fetched); else setList([]);
        });

        loadProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Local fetch to display backend response in table safely
    useEffect(() => {
        fetch('/api/promotions/combo')
            .then(res => res.json())
            .then(data => {
                if (data?.success && Array.isArray(data?.data)) {
                    setList(data.data);
                } else {
                    setList([]);
                }
            })
            .catch(() => setList([]));
    }, []);

    // Removed unused resolveProductInfo helper

    const tableHeaders = ["Title", "Items Count", "Combo Price", "Start Date", "End Date", "Status"];

    const tableData = Array.isArray(list) ? list.map((item) => {
        const statusText = (item.status === 'active' || item.status === true) ? 'Active' : 'Inactive';
        const statusBadge = statusText === 'Active' ? `<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>${statusText}</span>` : `<span class='bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm'>${statusText}</span>`;
        return {
            title: item.title || '-',
            itemscount: Array.isArray(item.items) ? item.items.length : 0,
            comboprice: item.comboPrice ?? 0,
            startdate: item.startDate ? new Date(item.startDate).toLocaleString() : '-',
            enddate: item.endDate ? new Date(item.endDate).toLocaleString() : '-',
            status: statusBadge,
            _id: item._id,
        };
    }) : [];

    const openCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (row) => {
        const target = (Array.isArray(items) ? items : []).find((x) => x._id === row._id) || (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
        if (!target) return;
        setForm({
            id: target._id,
            title: target.title || "",
            items: Array.isArray(target.items) ? target.items.map((it) => ({
                productId: it.productId || it.product || it.id, quantity: it.quantity || 1
            })) : [{productId: "", quantity: 1}],
            comboPrice: target.comboPrice ?? "",
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
        dispatch(deleteCombo(target._id));
    };

    const resolveProductName = (pid) => {
        const p = (Array.isArray(products) ? products : []).find((x) => String(x._id) === String(pid));
        return p?.name || p?.title || pid;
    };

    const openView = (row) => {
        const target = (Array.isArray(items) ? items : []).find((x) => x._id === row._id) || (Array.isArray(list) ? list : []).find((x) => x._id === row._id);
        if (!target) return;
        setViewItem(target);
        setShowViewModal(true);
    };

    const validateForm = () => {
        const errs = [];
        if (!String(form.title).trim()) errs.push("Title is required");
        const validItems = Array.isArray(form.items) && form.items.length > 0 && form.items.every((it) => String(it.productId).trim() && Number(it.quantity) > 0);
        if (!validItems) errs.push("Add at least one product with quantity > 0");
        if (!(parseFloat(form.comboPrice) > 0)) errs.push("Combo price must be a positive number");
        if (!form.startDate || !form.endDate) errs.push("Start and End dates are required");
        if (form.startDate && isNaN(Date.parse(form.startDate))) errs.push("Start date is invalid");
        if (form.endDate && isNaN(Date.parse(form.endDate))) errs.push("End date is invalid");
        if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) errs.push("End date must be after start date");
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
            title: String(form.title).trim(),
            items: (Array.isArray(form.items) ? form.items : []).map((it) => ({
                productId: it.productId, quantity: parseInt(it.quantity, 10)
            })),
            comboPrice: parseFloat(form.comboPrice),
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            status: form.status ? "active" : "inactive",
        };
        if (form.id) {
            dispatch(updateCombo({id: form.id, payload})).then((res) => {
                if (res.error) return;
                setShowModal(false);
                resetForm();
                dispatch(getAllComboOffers({status: statusFilter === "all" ? undefined : statusFilter}));
            });
        } else {
            dispatch(createCombo(payload)).then((res) => {
                if (res.error) return;
                setShowModal(false);
                resetForm();
                dispatch(getAllComboOffers({status: statusFilter === "all" ? undefined : statusFilter}));
            });
        }
    };

    const statusFilterChange = (e) => {
        const v = e.target.value;
        dispatch(setStatusFilter(v));
        dispatch(getAllComboOffers({status: v === "all" ? undefined : v}));
    };

    const addItemRow = () => {
        setForm({...form, items: [...form.items, {productId: "", quantity: 1}]});
    };
    const updateItemRow = (idx, field, value) => {
        const next = [...form.items];
        next[idx] = {...next[idx], [field]: value};
        setForm({...form, items: next});
    };
    const removeItemRow = (idx) => {
        const next = form.items.filter((_, i) => i !== idx);
        setForm({...form, items: next.length ? next : [{productId: "", quantity: 1}]});
    };

    return (<MasterLayout>
            <Breadcrumb title="Combo Offers"/>

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
                    <i className="ri-add-line me-1"/> New Combo Offer
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    {loading ? (<div className="text-center py-24">Loading…</div>) : (<TableDataLayer
                            title="Combo Offers"
                            headers={tableHeaders}
                            data={tableData}
                            onView={(row) => openView(row)}
                            onEdit={(row) => openEdit(row)}
                            onDelete={(row) => handleDelete(row)}
                        />)}
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
                                    <h5 className="modal-title">{form.id ? "Edit" : "Create"} Combo Offer</h5>
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
                                                <h6 className="mb-0">Items</h6></div>
                                            {(Array.isArray(form.items) ? form.items : []).map((it, idx) => (
                                                <div className="col-md-12" key={idx}>
                                                    <div className="row g-2 align-items-end">
                                                        <div className="col-md-6">
                                                            <label className="form-label">Product *</label>
                                                            <Select
                                                                classNamePrefix="react-select"
                                                                placeholder={"Select product"}
                                                                isClearable
                                                                isSearchable
                                                                options={productOptions}
                                                                value={productOptions.find((opt) => String(opt.value) === String(it.productId)) || null}
                                                                onChange={(opt) => updateItemRow(idx, "productId", opt?.value || "")}
                                                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                                menuPosition="fixed"
                                                                styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                                                                formatOptionLabel={(opt) => {
                                                                    const imgBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

                                                                    const raw = opt.image || opt.thumb || opt.thumbnail;
                                                                    const thumbUrl = raw ? (String(raw).startsWith("http") ? String(raw) : `${imgBase}${raw}`) : "";
                                                                    return (
                                                                        <div className="d-flex align-items-center gap-8">
                                                                            {thumbUrl ? (
                                                                                <img src={thumbUrl} alt="thumb" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 4 }} />
                                                                            ) : (
                                                                                <span className="badge bg-neutral-200" style={{ width: 24, height: 24 }} />
                                                                            )}
                                                                            <span>{opt.label}</span>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <label className="form-label">Quantity *</label>
                                                            <input type="number" min={1} className="form-control"
                                                                   value={it.quantity}
                                                                   onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                                                                   required/>
                                                        </div>
                                                        <div className="col-md-2">
                                                            <button type="button" className="btn btn-neutral-400"
                                                                    onClick={() => removeItemRow(idx)}>
                                                                <i className="ri-delete-bin-line"/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>))}
                                            <div className="col-md-12">
                                                <button type="button" className="btn btn-light" onClick={addItemRow}>
                                                    <i className="ri-add-line me-1"/> Add Another Product
                                                </button>
                                            </div>

                                            <div className="col-md-4">
                                                <label className="form-label">Combo Price *</label>
                                                <input type="number" min={0} className="form-control"
                                                       value={form.comboPrice}
                                                       onChange={(e) => setForm({...form, comboPrice: e.target.value})}
                                                       required/>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">Start Date *</label>
                                                <input type="datetime-local" className="form-control"
                                                       value={form.startDate}
                                                       onChange={(e) => setForm({...form, startDate: e.target.value})}
                                                       required/>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">End Date *</label>
                                                <input type="datetime-local" className="form-control"
                                                       value={form.endDate}
                                                       onChange={(e) => setForm({...form, endDate: e.target.value})}
                                                       required/>
                                            </div>

                                            <div className="col-md-12">
                                                <div className="form-switch">
                                                    <input className="form-check-input" type="checkbox" id="comboStatus"
                                                           checked={!!form.status}
                                                           onChange={(e) => setForm({
                                                               ...form, status: e.target.checked
                                                           })}/>
                                                    <label className="form-check-label"
                                                           htmlFor="comboStatus">Active</label>
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
                                    <h5 className="modal-title">Combo Offer Details</h5>
                                    <button type="button" className="btn-close"
                                            onClick={() => setShowViewModal(false)}/>
                                </div>
                                <div className="modal-body">
                                    {viewItem ? (<div className="row g-3">
                                            <div className="col-md-12"><h6 className="mb-8">{viewItem.title || '-'}</h6>
                                            </div>
                                            <div className="col-md-12">
                                                <div className="fw-medium mb-4">Items</div>
                                                {(Array.isArray(viewItem.items) ? viewItem.items : []).length ? (
                                                    <ul className="list-unstyled mb-0">
                                                        {(viewItem.items).map((it, i) => (
                                                            <li key={i} className="d-flex align-items-center gap-8">
                                                                <span>Product:</span>
                                                                <span
                                                                    className="fw-medium">{resolveProductName(it.productId)}</span>
                                                                <span
                                                                    className="text-secondary-light">({it.productId})</span>
                                                                <span className="ms-auto">Qty: {it.quantity}</span>
                                                            </li>))}
                                                    </ul>) : (<div>-</div>)}
                                            </div>
                                            <div className="col-md-6 mt-3">Combo
                                                Price: {viewItem.comboPrice ?? '-'}</div>
                                            <div
                                                className="col-md-6 mt-3">Status: {(viewItem.status === 'active' || viewItem.status === true) ? 'Active' : 'Inactive'}</div>
                                            <div className="col-md-6 mt-3">Start
                                                Date: {viewItem.startDate ? new Date(viewItem.startDate).toLocaleString() : '-'}</div>
                                            <div className="col-md-6 mt-3">End
                                                Date: {viewItem.endDate ? new Date(viewItem.endDate).toLocaleString() : '-'}</div>
                                            <div className="col-md-12 mt-3">
                                                <hr/>
                                                <div className="fw-medium mb-4">Internal</div>
                                                <div>_id: {viewItem._id || '-'}</div>
                                                <div>__v: {typeof viewItem.__v !== 'undefined' ? viewItem.__v : '-'}</div>
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

export default ComboOffersPage;
