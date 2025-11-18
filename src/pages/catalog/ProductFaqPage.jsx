import React, {useEffect, useMemo, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {toast, ToastContainer} from "react-toastify";
import {useDispatch, useSelector} from "react-redux";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import {
    getAllFaqs,
    getFaqById,
    createFaq,
    updateFaq,
    deleteFaq,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
    setPage,
    setLimit,
} from "../../features/catalog/productFaqSlice";

import ProductApi from "../../api/productApi";

const ProductFaqPage = () => {
    const dispatch = useDispatch();
    const {
        items = [],
        form = {productId: "", question: "", answer: ""},
        modalOpen = false,
        current = null,
        status = "idle",
        error = null,
        page = 1,
        limit = 10,
        total = 0,
    } = useSelector((s) => s.productFaqs || {});

    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [answerHtml, setAnswerHtml] = useState("");

    useEffect(() => {
        const loadProducts = async () => {
            setLoadingProducts(true);
            try {
                const data = await ProductApi.getProducts();
                const items = data?.data.items || data?.data || data || [];
                setProducts(items);
            } catch (e) {
                console.error(e);
                toast.error("Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };
        loadProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products;
        return (products || []).filter((p) => String(p.title || p.name || "").toLowerCase().includes(q));
    }, [products, productSearch]);

    useEffect(() => {
        dispatch(getAllFaqs({page, limit}));
    }, [dispatch, page, limit]);

    // Sync rich text editor content with existing HTML answer when modal opens
    useEffect(() => {
        if (modalOpen) {
            const html = String(form.answer || "");
            setAnswerHtml(html);
        }
    }, [modalOpen, form.answer]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => {
            const pid = String(it.productId || "").toLowerCase();
            const question = String(it.question || "").toLowerCase();
            return pid.includes(q) || question.includes(q);
        });
    }, [items, search]);

    const productOptions = useMemo(() => {
        const opts = (products || []).map((p) => ({
            value: p._id || p.id,
            label: p.title || p.name || String(p._id || p.id),
            thumb: p.thumbnailUrl || p.thumbnail || p.thumb || p.thumbnailPath || "",
        }));
        const q = productSearch.trim().toLowerCase();
        return q ? opts.filter((o) => o.label.toLowerCase().includes(q)) : opts;
    }, [products, productSearch]);

    const selectedProductOption = useMemo(() => {
        const val = form.productId || "";
        if (!val) return null;
        return productOptions.find((o) => String(o.value) === String(val)) || { value: val, label: String(val) };
    }, [form.productId, productOptions]);

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const productId = String(form.productId || "").trim();
        const question = String(form.question || "").trim();
        const answer = String(form.answer || "").trim();

        if (!productId) {
            toast.error("Please select a product");
            return;
        }
        if (!question || !answer) {
            toast.error("Question and Answer are required");
            return;
        }
        // Removed text length limit for rich text answers

        const payload = {productId, question, answer};

        try {
            if (current?._id || current?.id) {
                const id = current._id || current.id;
                await dispatch(updateFaq({id, data: payload})).unwrap();
                toast.success("FAQ updated");
            } else {
                await dispatch(createFaq(payload)).unwrap();
                toast.success("FAQ created");
            }
            dispatch(getAllFaqs({page, limit}));
            dispatch(closeModal());
            dispatch(resetForm());
        } catch (err) {
            toast.error("Error occurred");
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete FAQ",
            text: "Are you sure you want to delete this FAQ?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                await dispatch(deleteFaq(id)).unwrap();
                toast.info("FAQ deleted");
                dispatch(getAllFaqs({page, limit}));
            } catch (err) {
                toast.error("Deletion failed");
            }
        });
    };

    const openCreate = () => {
        dispatch(resetForm());
        dispatch(openCreateModal());
    };

    const openEdit = async (faq) => {
        const id = faq?._id || faq?.id;

        if (!id) {
            dispatch(openEditModal(faq));
            return;
        }
        try {
            const result = await dispatch(getFaqById(id)).unwrap();
            const full = result?.data || result || {};
            dispatch(openEditModal(full));
        } catch (err) {
            // Fallback to provided row data if fetch fails
            dispatch(openEditModal(faq));
        }
    };

    const productNameMap = useMemo(() => {
        const map = {};
        (products || []).forEach((p) => {
            const id = p._id || p.id;
            const title = p.title || p.name || "-";
            if (id) map[id] = title;
        });
        return map;
    }, [products]);

    const headers = ["#", "Product", "Question"];
    const rows = filteredItems.map((faq, i) => ({
        "#": (page - 1) * limit + i + 1,
        product: productNameMap[faq.productId] || faq.title || faq.productTitle || String(faq.productId || "-"),
        question: faq.question,
        // answer: (faq.answer || "").length > 60 ? `${faq.answer.slice(0, 60)}…` : faq.answer,
        id: faq._id || faq.id,
    }));

    return (
        <MasterLayout>
            <Breadcrumb title="Catalog / Product FAQs"/>

            <div className="card h-100 p-0 radius-12">
                <div
                    className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                    <h6 className="text-lg mb-0">Product FAQs</h6>
                    <div className="d-flex gap-2 align-items-center">
                        <button className="btn btn-primary-600" onClick={openCreate}>
                            <i className="ri-add-line me-1"/> Add FAQ
                        </button>
                    </div>
                </div>

                <div className="card-body p-24">
                    <TableDataLayer
                        title="FAQ List"
                        headers={headers}
                        data={rows}
                        onView={(row) => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                        onEdit={(row) => openEdit(row)}
                        onDelete={(row) => handleDelete(row.id)}
                    />

                    {expandedId && (
                        <div className="mt-3 p-3 border radius-8 bg-neutral-50">
                            <div className="d-flex align-items-start justify-content-between">
                                <div>
                                    <strong>Answer Preview</strong>
                                    <div className="mb-0 mt-2" dangerouslySetInnerHTML={{
                                        __html: items.find((it) => (it._id || it.id) === expandedId)?.answer || ""
                                    }} />
                                </div>
                                <button className="btn btn-sm btn-neutral-400" onClick={() => setExpandedId(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {modalOpen && (
                <>
                    <style>{`
                      .faq-editor .ql-container { height: 280px; }
                      .faq-editor .ql-editor { height: 220px; overflow-y: auto; }
                    `}</style>
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
                        <div className="modal-dialog modal-lg modal-dialog-centered" style={{ maxWidth: "900px" }}>
                            <div className="modal-content radius-12">
                                <div className="modal-header">
                                    <h6 className="modal-title">{current?._id ? "Edit FAQ" : "Add FAQ"}</h6>
                                    <button type="button" className="btn-close" onClick={() => dispatch(closeModal())}/>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">Product</label>
                                                    <Select
                                                        classNamePrefix="select"
                                                        placeholder="Search and select a product"
                                                        isClearable
                                                        isLoading={loadingProducts}
                                                        options={productOptions}
                                                        value={selectedProductOption}
                                                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                                        menuPosition="fixed"
                                                        styles={{ menuPortal: (base) => ({ ...base, zIndex: 2000 }) }}
                                                        onChange={(opt) => dispatch(setFormField({
                                                            field: "productId",
                                                            value: opt?.value || ""
                                                        }))}
                                                        onMenuOpen={() => {
                                                            // trigger load if empty
                                                            if ((products || []).length === 0 && !loadingProducts) {
                                                                (async () => {
                                                                    setLoadingProducts(true);
                                                                    try {
                                                                        const resp = await ProductApi.getProducts({page: 1, limit: 200});
                                                                        const items = resp?.data.items || resp?.data || resp || [];
                                                                        setProducts(items);
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        toast.error("Failed to load products");
                                                                    } finally {
                                                                        setLoadingProducts(false);
                                                                    }
                                                                })();
                                                            }
                                                        }}
                                                        onInputChange={(input) => setProductSearch(input)}
                                                        formatOptionLabel={(opt) => {
                                                            const imgBase =  "http://localhost:8000";
                                                            const thumbUrl = opt.thumb
                                                                ? (opt.thumb.startsWith("http") ? opt.thumb : `${imgBase}${opt.thumb}`)
                                                                : "";
                                                            return (
                                                                <div className="d-flex align-items-center gap-8">
                                                                    {thumbUrl ? (
                                                                        <img src={thumbUrl} alt="thumb" style={{
                                                                            width: 24,
                                                                            height: 24,
                                                                            objectFit: "cover",
                                                                            borderRadius: 4
                                                                        }}/>
                                                                    ) : (
                                                                        <span className="badge bg-neutral-200" style={{width: 24, height: 24}}/>
                                                                    )}
                                                                    <span>{opt.label}</span>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label">Question *</label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${!form.question?.trim() ? "is-invalid" : ""}`}
                                                        value={form.question || ""}
                                                        onChange={(e) => dispatch(setFormField({
                                                            field: "question",
                                                            value: e.target.value
                                                        }))}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="mb-2">
                                                    <label className="form-label">Answer *</label>
                                                    <div className={`border rounded ${!form.answer?.trim() ? "is-invalid" : ""}`} style={{ overflow: "hidden" }}>
                                                        <ReactQuill
                                                            theme="snow"
                                                            value={answerHtml}
                                                            onChange={(html) => {
                                                                setAnswerHtml(html);
                                                                dispatch(setFormField({ field: "answer", value: html }));
                                                            }}
                                                            placeholder="Write the answer..."
                                                            className="faq-editor"
                                                            style={{ height: 280 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-neutral-400"
                                                onClick={() => dispatch(closeModal())}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary-600">
                                            {current?._id ? "Update" : "Create"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick
                            pauseOnHover draggable/>
        </MasterLayout>
    );
};

export default ProductFaqPage;
