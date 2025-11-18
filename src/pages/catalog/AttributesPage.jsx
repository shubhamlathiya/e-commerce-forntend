import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
    getAllAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
} from "../../features/catalog/attributesSlice";

const AttributesPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {
        items = [],
        form,
        modalOpen,
        current,
        page: slicePage,
        limit: sliceLimit,
    } = useSelector((s) => s.attributes || {});

    const [page, setPage] = useState(Number(slicePage) || 1);
    const limit = Number(sliceLimit) || 10;

    useEffect(() => {
        dispatch(getAllAttributes({ page, limit }));
    }, [dispatch, page, limit]);

    const slugify = (str) => (str || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const handleSubmit = async (e) => {
        e.preventDefault();

        // convert comma-separated string to [{id, label}]
        const formattedValues = form.values
            ?.filter((v) => v && v.trim())
            .map((v) => ({
                id: v.toLowerCase().replace(/\s+/g, "-"),
                label: v.trim(),
            }));

        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            type: form.type,
            values: formattedValues,
            isFilter: form.isFilter,
            status: form.status,
        };

        try {
            if (current?._id) {
                await dispatch(updateAttribute({ id: current._id, data: payload })).unwrap();
                toast.success("Attribute updated successfully");
            } else {
                await dispatch(createAttribute(payload)).unwrap();
                toast.success("Attribute created successfully");
            }
            dispatch(getAllAttributes({ page, limit }));
            dispatch(resetForm());
            dispatch(closeModal());
        } catch {
            toast.error("Failed to save attribute");
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Attribute?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
            customClass: {
                title: "text-md fw-semibold",
                htmlContainer: "text-sm",
                confirmButton: "btn btn-sm btn-danger",
                cancelButton: "btn btn-sm btn-light",
                popup: "p-3 rounded-3",
            },
        }).then(async (res) => {
            if (res.isConfirmed) {
                try {
                    await dispatch(deleteAttribute(id)).unwrap();
                    toast.info("Attribute deleted");
                    dispatch(getAllAttributes({ page, limit }));
                } catch {
                    toast.error("Failed to delete attribute");
                }
            }
        });
    };

    const openCreate = () => {
        dispatch(resetForm());
        dispatch(openCreateModal());
    };

    const openEdit = (attr) => {
        let valueArray = [];

        // Handle both array and string cases safely
        if (Array.isArray(attr.values)) {
            // It's an array of {id, label} objects
            valueArray = attr.values.map((v) => v.label);
        } else if (typeof attr.values === "string") {
            // It's a comma-separated string
            valueArray = attr.values.split(",").map((v) => v.trim());
        }

        dispatch(
            openEditModal({
                ...attr,
                values: valueArray,
            })
        );
    };


    return (
        <MasterLayout>
            <Breadcrumb title="Catalog / Attributes" />
            <div className="card h-100 p-0 radius-12">
                <div className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                    <h6 className="text-lg mb-0">Attributes</h6>
                    <button className="btn btn-primary-600" onClick={openCreate}>
                        <i className="ri-add-line me-1" /> Add Attribute
                    </button>
                </div>

                <div className="card-body p-24">
                    <TableDataLayer
                        title="Attribute List"
                        headers={["#", "Attribute Name", "Slug", "Type", "Status", "Is Filter"]}
                        data={(items || []).map((a, i) => {
                            const statusBadge = a.status
                                ? "<span class='badge bg-success'>Active</span>"
                                : "<span class='badge bg-secondary'>Inactive</span>";
                            const filterBadge = a.isFilter
                                ? "<span class='badge bg-primary'>Yes</span>"
                                : "<span class='badge bg-light text-dark'>No</span>";
                            return {
                                "#": (page - 1) * limit + i + 1,
                                attributename: a.name || "-",
                                slug: a.slug || "-",
                                type: a.type || "-",
                                status: statusBadge,
                                isfilter: filterBadge,
                                id: a._id || a.id,
                                raw: a,
                            };
                        })}
                        onView={(row) => navigate(`/attributes/${row.id}`)}
                        onEdit={(row) => openEdit(row)}
                        onDelete={(row) => handleDelete(row.id)}
                    />
                </div>
            </div>

            {/* Modal with bluish backdrop */}
            {modalOpen && (
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
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content radius-12 shadow-lg">
                                <div className="modal-header  text-white">
                                    <h6 className="modal-title mb-0">
                                        {current?._id ? "Edit Attribute" : "Add Attribute"}
                                    </h6>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-black"
                                        onClick={() => dispatch(closeModal())}
                                    ></button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.attributename || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const autoSlug = slugify(val);
                                                        dispatch(setFormField({ field: "name", value: val }));
                                                        // Auto-generate slug when user hasn't set it or matches previous pattern
                                                        if (!form.slug || form.slug === slugify(form.name || "")) {
                                                            dispatch(setFormField({ field: "slug", value: autoSlug }));
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Slug</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form.slug || ""}
                                                    onChange={(e) =>
                                                        dispatch(setFormField({ field: "slug", value: e.target.value }))
                                                    }
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Type</label>
                                                <select
                                                    className="form-select"
                                                    value={form.type}
                                                    onChange={(e) =>
                                                        dispatch(setFormField({ field: "type", value: e.target.value }))
                                                    }
                                                >
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="select">Select</option>
                                                    <option value="multiselect">Multi Select</option>
                                                </select>
                                            </div>

                                            <div className="col-md-6">
                                                <label className="form-label">Values (comma separated)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Example: Red, Blue, Green"
                                                    value={form.values?.join(", ") || ""}
                                                    onChange={(e) =>
                                                        dispatch(
                                                            setFormField({
                                                                field: "values",
                                                                value: e.target.value.split(",").map((v) => v.trim()),
                                                            })
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="col-12 d-flex justify-content-between mt-2">
                                                <div className="form-switch d-flex align-items-center gap-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={!!form.isFilter}
                                                        onChange={(e) =>
                                                            dispatch(setFormField({ field: "isFilter", value: e.target.checked }))
                                                        }
                                                    />
                                                    <label className="form-check-label">Use for Filters</label>
                                                </div>


                                                <div className="form-switch switch-success d-flex align-items-center gap-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        role="switch"
                                                        checked={!!form.status}
                                                        onChange={(e) =>
                                                            dispatch(setFormField({ field: "status", value: e.target.checked }))
                                                        }
                                                    />
                                                    <label
                                                        className="form-check-label line-height-1 fw-medium text-secondary-light"
                                                        htmlFor="Active"
                                                    >
                                                        Active
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-neutral-400"
                                            onClick={() => dispatch(closeModal())}
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-primary-600">
                                            {current?._id ? "Update Attribute" : "Create Attribute"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ToastContainer position="top-right" autoClose={2000} />
        </MasterLayout>
    );
};

export default AttributesPage;
