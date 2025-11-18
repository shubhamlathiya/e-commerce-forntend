import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSeoField } from "../features/catalog/productSeoSlice";

const ProductSeoForm = ({ productId, onSubmit, onCancel, creating = false, maxDesc = 500 }) => {
    const dispatch = useDispatch();
    const { seo = {} } = useSelector((s) => s.productSeo || {});
    const descLen = (seo.metaDescription || "").length;

    const setField = (field, value) => dispatch(setSeoField({ field, value }));

    return (
        <form onSubmit={onSubmit}>
            <div className="modal-body">
                {creating && (
                    <div className="mb-3">
                        <label className="form-label">Product ID</label>
                        <input type="text" className="form-control" value={productId || ""} disabled />
                    </div>
                )}

                <div className="mb-3">
                    <label className="form-label">Meta Title *</label>
                    <input
                        type="text"
                        className={`form-control ${!seo.metaTitle?.trim() ? "is-invalid" : ""}`}
                        value={seo.metaTitle || ""}
                        onChange={(e) => setField("metaTitle", e.target.value)}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Meta Description *</label>
                    <textarea
                        rows={4}
                        className={`form-control ${!seo.metaDescription?.trim() || descLen > maxDesc ? "is-invalid" : ""}`}
                        value={seo.metaDescription || ""}
                        onChange={(e) => setField("metaDescription", e.target.value)}
                        required
                    />
                    <div className="form-text d-flex justify-content-between">
                        <span>Max {maxDesc} characters</span>
                        <span>{descLen}/{maxDesc}</span>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">Keywords (comma separated)</label>
                    <input
                        type="text"
                        className="form-control"
                        value={(Array.isArray(seo.keywords) ? seo.keywords.join(", ") : seo.keywords || "")}
                        onChange={(e) => setField("keywords", e.target.value)}
                        placeholder="e.g. shoes, running, lightweight"
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Slug</label>
                    <input
                        type="text"
                        className="form-control"
                        value={seo.slug || ""}
                        onChange={(e) => setField("slug", e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Canonical URL</label>
                    <input
                        type="text"
                        className="form-control"
                        value={seo.canonicalUrl || ""}
                        onChange={(e) => setField("canonicalUrl", e.target.value)}
                    />
                </div>
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-neutral-400" onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary-600">
                    Save
                </button>
            </div>
        </form>
    );
};

export default ProductSeoForm;

