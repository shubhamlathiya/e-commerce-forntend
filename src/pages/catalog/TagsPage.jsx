import React, {useEffect, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {toast, ToastContainer} from "react-toastify";
import {useDispatch, useSelector} from "react-redux";
import {
    getAllTags,
    createTag,
    updateTag,
    deleteTag,
    openCreateModal,
    openEditModal,
    closeModal,
    setFormField,
    resetForm,
} from "../../features/catalog/tagsSlice";

const TagsPage = () => {
    const dispatch = useDispatch();
    const {
        items = [],
        form = {name: "", slug: "", status: true},
        modalOpen = false,
        current = null,
        page: slicePage = 1,
        limit: sliceLimit = 10,
    } = useSelector((s) => s.tags || {});
    //
    const [page] = useState(Number(slicePage) || 1);
    const limit = Number(sliceLimit) || 10;

    useEffect(() => {

        dispatch(getAllTags({page, limit}));
    }, [dispatch, page, limit]);

    // useEffect(() => {
    //     if (slicePage && slicePage !== page) setPage(Number(slicePage));
    // }, [slicePage]);

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const payload = {
            name: (form.name || "").trim(),
            slug: (form.slug || "").trim() || undefined,
            status: !!form.status,
        };

        try {
            if (current?._id || current?.id) {
                const id = current._id || current.id;
                await dispatch(updateTag({id, data: payload})).unwrap();
                toast.success(" Tag updated");
            } else {
                await dispatch(createTag(payload)).unwrap();
                toast.success("Tag created");
            }
            dispatch(getAllTags({page, limit}));
            dispatch(closeModal());
            dispatch(resetForm());
        } catch (err) {
            toast.error(" Save failed. Please try again.");
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Tag",
            text: "Are you sure you want to delete this tag?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc3545",
            customClass: {
                title: "text-sm",
                popup: "p-2",
                confirmButton: "btn-sm",
                cancelButton: "btn-sm",
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                await dispatch(deleteTag(id)).unwrap();
                toast.info(" Tag deleted");
                dispatch(getAllTags({page, limit}));
            } catch (err) {
                toast.error(" Deletion failed");
            }
        });
    };

    const openCreate = () => {
        dispatch(resetForm());
        dispatch(openCreateModal());
    };

    const openEdit = (tag) => {
        dispatch(openEditModal({...tag, status: !!tag.status}));
    };

    return (
        <MasterLayout>
            <Breadcrumb title="Catalog / Tags"/>
            <div className="card h-100 p-0 radius-12">
                <div
                    className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                    <h6 className="text-lg mb-0">Tags</h6>
                    <button className="btn btn-primary-600" onClick={openCreate}>
                        <i className="ri-add-line me-1"/> Add Tag
                    </button>
                </div>

                <div className="card-body p-24">
                    <div style={{ overflowX: "auto" }}>
                        <TableDataLayer
                            title="Tag List"
                            headers={["#", "name", "slug", "status"]}
                            data={items.map((tag, i) => {
                                const statusBadge = tag.status
                                    ? `<span class='badge bg-success-600 rounded-pill'>Active</span>`
                                    : `<span class='badge bg-danger-600 rounded-pill'>Inactive</span>`;
                                return {
                                    "#": (page - 1) * limit + i + 1,
                                    name: tag.name,
                                    slug: tag.slug,
                                    status: statusBadge,
                                    id: tag._id,
                                };
                            })}
                            onView={(row) => console.log("👁️ View clicked:", row)}
                            onEdit={(row) => openEdit(row)}
                            onDelete={(row) => handleDelete(row.id)}
                        />
                    </div>
                </div>
            </div>

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
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content radius-12">
                                <div className="modal-header">
                                    <h6 className="modal-title">
                                        {current?._id ? "Edit Tag" : "Add Tag"}
                                    </h6>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => dispatch(closeModal())}
                                    />
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={form.name || ""}
                                                onChange={(e) =>
                                                    dispatch(
                                                        setFormField({field: "name", value: e.target.value})
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Slug</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={form.slug || ""}
                                                onChange={(e) =>
                                                    dispatch(
                                                        setFormField({field: "slug", value: e.target.value})
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="mb-3 d-flex align-items-center justify-content-between">
                                            <label className="form-label mb-0">Status</label>
                                            <div className="form-switch switch-primary">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={!!form.status}
                                                    onChange={(e) =>
                                                        dispatch(
                                                            setFormField({
                                                                field: "status",
                                                                value: e.target.checked,
                                                            })
                                                        )
                                                    }
                                                />
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
                                            {current?._id ? "Update" : "Create"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Toast Container — required once */}
            <ToastContainer
                position="top-right"
                autoClose={2000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
            />
        </MasterLayout>
    );
};

export default TagsPage;
