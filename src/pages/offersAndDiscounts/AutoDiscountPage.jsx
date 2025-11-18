import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import {ToastContainer, toast} from "react-toastify";
import Swal from "sweetalert2";
import {
    getAutoDiscounts,
    createAutoDiscount,
    updateAutoDiscount,
    deleteAutoDiscount
} from "../../features/offersAndDiscounts/autoDiscountSlice";
import {getAllCategories} from "../../features/catalog/categoriesSlice";
import {getAllBrands} from "../../features/catalog/brandsSlice";
import Select from "react-select";
import ProductApi from "../../api/productApi";

const AutoDiscountPage = () => {
    const dispatch = useDispatch();
    const {items, status} = useSelector((s) => s.autoDiscounts);
    const categories = useSelector((s) => s.categories.items);
    const brands = useSelector((s) => s.brands.items);

    // Lookup options
    const [productOptions, setProductOptions] = useState([]);

    const categoryOptions = useMemo(() => (categories || []).map((c) => ({
        value: c.id || c._id,
        label: c.name || c.title || c.slug || String(c.id || c._id),
        image: c.image,
    })), [categories]);

    const brandOptions = useMemo(() => (brands || []).map((b) => ({
        value: b.id || b._id,
        label: b.name || b.title || b.slug || String(b.id || b._id),
        logo: b.logo,
    })), [brands]);

    const getProductLabel = (id) => {
        if (!id) return "";
        const opt = productOptions.find((o) => String(o.value) === String(id));
        return opt?.label || String(id);
    };
    const getCategoryLabel = (id) => {
        if (!id) return "";
        const opt = categoryOptions.find((o) => String(o.value) === String(id));
        return opt?.label || String(id);
    };
    const getBrandLabel = (id) => {
        if (!id) return "";
        const opt = brandOptions.find((o) => String(o.value) === String(id));
        return opt?.label || String(id);
    };

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        id: undefined,
        title: "",
        discountType: "flat",
        value: "",
        minCartValue: "",
        applicableToType: "product", // product | category | brand | all
        applicableIds: [],
        priority: "",
        startDate: "",
        endDate: "",
        status: true,
    });

    const resetForm = () => setForm({
        id: undefined,
        title: "",
        discountType: "flat",
        value: "",
        minCartValue: "",
        applicableToType: "product",
        applicableIds: [],
        priority: "",
        startDate: "",
        endDate: "",
        status: true,
    });

    const validatePayload = (p) => {
        if (!p.title || String(p.title).trim() === "") return "Title is required";
        if (!p.discountType || !["flat", "percent"].includes(p.discountType)) return "Select a valid discount type";
        if (isNaN(p.value) || Number(p.value) <= 0) return "Value must be greater than 0";
        const minVal = Number(p.minCartValue);
        if (isNaN(minVal) || minVal < 0) return "Minimum cart value must be a number ≥ 0";
        const at = p.applicableTo;
        if (!at || typeof at !== "object") return "Applicable To must be an object";
        if (!["product", "category", "brand", "all"].includes(at.type)) return "Select a valid applicable type";
        if (at.type !== "all") {
            if (!Array.isArray(at.ids) || at.ids.length === 0) return "Select at least one ID for Applicable To";
        }
        const pr = Number(p.priority);
        if (!Number.isInteger(pr) || pr < 0) return "Priority must be an integer ≥ 0";
        if (p.startDate && isNaN(Date.parse(p.startDate))) return "Start date is invalid";
        if (p.endDate && isNaN(Date.parse(p.endDate))) return "End date is invalid";
        return null;
    };

    const payload = useMemo(() => ({
        title: form.title,
        discountType: form.discountType,
        value: parseFloat(form.value),
        minCartValue: parseFloat(form.minCartValue) || 0,
        applicableTo: {
            type: form.applicableToType,
            ids: form.applicableToType === "all" ? [] : (form.applicableIds || []),
        },
        priority: form.priority !== "" ? Number(form.priority) : 1,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        status: form.status ? "active" : "inactive",
    }), [form]);

    const loadProducts = async () => {
        try {
            const {data} = await ProductApi.getProducts({page: 1, limit: 200});

            const items = Array.isArray(data) ? data : data?.items || data?.data || data?.results || [];
            setProductOptions((Array.isArray(items) ? items : []).map((p) => ({
                value: p.id || p._id,
                label: p.title || p.name || p.slug || String(p.id || p._id),
                image: p.image,
            })));
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to load products");
        }
    };

    useEffect(() => {
        dispatch(getAutoDiscounts({page: 1, limit: 50}));
        dispatch(getAllCategories({page: 1, limit: 200}));
        dispatch(getAllBrands({page: 1, limit: 200}));
        loadProducts();
    }, [dispatch]);

    const headers = [
        "#",
        "Title",
        "Discount Type",
        "Value",
        "Applicable To",
        "Start Date",
        "End Date",
        "Status",
    ];

    const rows = (Array.isArray(items) ? items : []).map((d , index) => {
        const at = d.applicableTo;
        let applicableText = "All";
        if (at && typeof at === "object") {
            const type = at.type || "all";
            const ids = Array.isArray(at.ids) ? at.ids : [];
            if (type === "all") {
                applicableText = "All";
            } else {
                const labelFn = type === "product" ? getProductLabel : type === "category" ? getCategoryLabel : getBrandLabel;
                const names = ids.map(labelFn).filter(Boolean);
                if (names.length === 0) {
                    applicableText = `${type}: ${ids.length} selected`;
                } else {
                    applicableText = `${type}: ${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ""}`;
                }
            }
        } else {
            const type = d.applicableTo || "all";
            if (type === "product") applicableText = `product: ${getProductLabel(d.applicableId)}`;
            else if (type === "category") applicableText = `category: ${getCategoryLabel(d.applicableId)}`;
            else if (type === "brand") applicableText = `brand: ${getBrandLabel(d.applicableId)}`;
            else applicableText = "All";
        }
        return {
            "#":  index +1,
            title: d.title,
            discounttype: d.discountType,
            value: d.value,
            applicableto: applicableText,
            startdate: d.startDate ? new Date(d.startDate).toLocaleString() : "",
            enddate: d.endDate ? new Date(d.endDate).toLocaleString() : "",
            status: (d.status === "active" || d.status === true) ? "Active" : "Inactive",
            id: d.id || d._id,
            raw: d,
        };
    });

    const onEdit = (row) => {
        const d = row.raw;
        let type = "product";
        let ids = [];
        if (d.applicableTo && typeof d.applicableTo === "object") {
            type = d.applicableTo.type || "product";
            ids = Array.isArray(d.applicableTo.ids) ? d.applicableTo.ids : [];
        } else {
            type = d.applicableTo || "product";
            ids = d.applicableId ? [d.applicableId] : [];
        }
        setForm({
            id: d.id || d._id,
            title: d.title || "",
            discountType: d.discountType || "flat",
            value: d.value ?? "",
            minCartValue: d.minCartValue ?? "",
            applicableToType: type,
            applicableIds: ids,
            priority: d.priority ?? "",
            startDate: d.startDate ? new Date(d.startDate).toISOString().slice(0, 16) : "",
            endDate: d.endDate ? new Date(d.endDate).toISOString().slice(0, 16) : "",
            status: (d.status === "active" || d.status === true),
        });
        setShowModal(true);
    };

    const onDelete = async (row) => {
        const res = await Swal.fire({
            title: "Delete discount?", icon: "warning", showCancelButton: true,
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        });
        if (!res.isConfirmed) return;
        try {
            await dispatch(deleteAutoDiscount(row.id)).unwrap();
        } catch (err) {
            toast.error(err?.message || "Failed to delete");
        }
    };

    const submitForm = async (e) => {
        e.preventDefault();
        const errMsg = validatePayload(payload);
        if (errMsg) {
            toast.error(errMsg);
            return;
        }
        try {

            if (form.id) {
                await dispatch(updateAutoDiscount({id: form.id, data: payload})).unwrap();
            } else {
                await dispatch(createAutoDiscount(payload)).unwrap();
            }
            setShowModal(false);
            resetForm();
            dispatch(getAutoDiscounts({page: 1, limit: 50}));
        } catch (err) {
            toast.error(err?.message || "Failed to save discount");
        }
    };

    return (
        <MasterLayout>
            <div className="container-fluid">
                <Breadcrumb title="Offers & Discounts / Auto Discounts"/>

                <div className="card mb-24">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h6 className="mb-0">Auto Discounts</h6>
                        <button className="btn btn-primary-600" onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}>Add Discount
                        </button>
                    </div>
                    <div className="card-body">
                        <div style={{overflowX: "auto"}}>
                            {status === "loading" ? (
                                <div>Loading...</div>
                            ) : (
                                <TableDataLayer headers={headers} data={rows} onEdit={onEdit} onDelete={onDelete}
                                                onView={(row) => Swal.fire({
                                                    title: "Discount",
                                                    html: `<pre style='text-align:left'>${JSON.stringify(row.raw, null, 2)}</pre>`
                                                })}/>
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
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h6 className="modal-title">{form.id ? "Edit" : "Add"} Auto Discount</h6>
                                        <button type="button" className="btn-close"
                                                onClick={() => setShowModal(false)}></button>
                                    </div>
                                    <form onSubmit={submitForm}>
                                        <div className="modal-body">
                                            <div className="row g-3">
                                                <div className="col-md-12">
                                                    <label className="form-label">Title</label>
                                                    <input className="form-control" value={form.title}
                                                           onChange={(e) => setForm({...form, title: e.target.value})}
                                                           required/>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">Discount Type</label>
                                                    <select className="form-select" value={form.discountType}
                                                            onChange={(e) => setForm({
                                                                ...form,
                                                                discountType: e.target.value
                                                            })} required>
                                                        <option value="flat">flat</option>
                                                        <option value="percent">percent</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Value</label>
                                                    <input type="number" min="0.01" step="0.01" className="form-control"
                                                           value={form.value}
                                                           onChange={(e) => setForm({...form, value: e.target.value})}
                                                           required/>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Minimum Cart Value</label>
                                                    <input type="number" min="0" step="0.01" className="form-control"
                                                           value={form.minCartValue} onChange={(e) => setForm({
                                                        ...form,
                                                        minCartValue: e.target.value
                                                    })}/>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">Applicable To (Select multiple if
                                                        needed)</label>
                                                    <select
                                                        className="form-select"
                                                        value={form.applicableToType}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setForm({...form, applicableToType: v, applicableIds: []});
                                                        }}
                                                        required
                                                    >
                                                        <option value="product">product</option>
                                                        <option value="category">category</option>
                                                        <option value="brand">brand</option>
                                                        <option value="all">all</option>
                                                    </select>
                                                </div>

                                                {form.applicableToType !== "all" && (
                                                    <div className="col-md-8">
                                                        <label
                                                            className="form-label">Select {form.applicableToType}</label>
                                                        <Select
                                                            isMulti
                                                            options={form.applicableToType === "product" ? productOptions : form.applicableToType === "category" ? categoryOptions : brandOptions}
                                                            value={(form.applicableToType === "product" ? productOptions : form.applicableToType === "category" ? categoryOptions : brandOptions).filter((opt) => (form.applicableIds || []).some((id) => String(id) === String(opt.value)))}
                                                            onChange={(selected) => setForm({
                                                                ...form,
                                                                applicableIds: (selected || []).map((o) => o.value)
                                                            })}
                                                            placeholder={`Select ${form.applicableToType}(s)`}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                )}

                                                <div className="col-md-4">
                                                    <label className="form-label">Priority</label>
                                                    <input type="number" min="0" step="1" className="form-control"
                                                           value={form.priority}
                                                           onChange={(e) => setForm({
                                                               ...form,
                                                               priority: e.target.value
                                                           })}/>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">Start Date</label>
                                                    <input type="datetime-local" className="form-control"
                                                           value={form.startDate}
                                                           onChange={(e) => setForm({
                                                               ...form,
                                                               startDate: e.target.value
                                                           })}/>
                                                </div>
                                                <div className="col-md-4">
                                                    <label className="form-label">End Date</label>
                                                    <input type="datetime-local" className="form-control"
                                                           value={form.endDate}
                                                           onChange={(e) => setForm({
                                                               ...form,
                                                               endDate: e.target.value
                                                           })}/>
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">Status</label>
                                                    <div className="form-check">
                                                        <input className="form-check-input" type="checkbox"
                                                               id="discountStatus" checked={form.status}
                                                               onChange={(e) => setForm({
                                                                   ...form,
                                                                   status: e.target.checked
                                                               })}/>
                                                        <label className="form-check-label"
                                                               htmlFor="discountStatus">Active</label>
                                                    </div>
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label">JSON Preview</label>
                                                    <pre className="bg-neutral-50 p-12 radius-8" style={{
                                                        maxHeight: 240,
                                                        overflow: "auto"
                                                    }}>{JSON.stringify(payload, null, 2)}</pre>
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
                    </>
                )}

                <ToastContainer position="top-right" autoClose={2000}/>
            </div>
        </MasterLayout>
    );
};

export default AutoDiscountPage;
