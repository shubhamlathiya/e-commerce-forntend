import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import attributesApi from "../../api/attributesApi";

const AttributeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attr, setAttr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: "", label: "" });
  const [editingIndex, setEditingIndex] = useState(null);

  const loadAttribute = () => {
    if (!id) return;
    setLoading(true);
    attributesApi
      .getAttributeById(id)
      .then((data) => {
        const item = data?.item || data?.data || data;
        setAttr(item || null);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to load attribute");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAttribute();
  }, [id]);

  const headers = ["Value Label", "Value ID"];

  const rows = useMemo(() => {
    const values = Array.isArray(attr?.values) ? attr.values : [];
    return values.map((v, i) => ({
      valuelabel: v.label || "-",
      valueid: v.id || "-",
      index: i,
      raw: v,
    }));
  }, [attr]);

  const openAddValue = () => {
    setEditingIndex(null);
    setForm({ id: "", label: "" });
    setShowModal(true);
  };

  const openEditValue = (row) => {
    setEditingIndex(row.index);
    setForm({ id: row.raw?.id || "", label: row.raw?.label || "" });
    setShowModal(true);
  };

  const saveValue = (e) => {
    e.preventDefault();
    const currentValues = Array.isArray(attr?.values) ? [...attr.values] : [];
    if (!form.label.trim() || !form.id.trim()) {
      toast.error("Value ID and Label are required");
      return;
    }
    const payloadValues = (() => {
      if (editingIndex !== null && editingIndex >= 0) {
        currentValues[editingIndex] = { id: form.id.trim(), label: form.label.trim() };
        return currentValues;
      }
      // prevent duplicate ids
      const exists = currentValues.some((v) => String(v.id) === String(form.id.trim()));
      if (exists) {
        toast.error("Value ID already exists");
        return null;
      }
      return [...currentValues, { id: form.id.trim(), label: form.label.trim() }];
    })();

    if (!payloadValues) return;

    attributesApi
      .updateAttribute(attr._id || attr.id, { values: payloadValues })
      .then(() => {
        toast.success(editingIndex !== null ? "Value updated" : "Value added");
        setShowModal(false);
        setEditingIndex(null);
        setForm({ id: "", label: "" });
        loadAttribute();
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || "Failed to save value");
      });
  };

  const deleteValue = (row) => {
    Swal.fire({
      title: "Delete Value?",
      text: `Remove value '${row.raw?.label || row.raw?.id}' from attribute?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      customClass: {
        title: "text-md fw-semibold",
        htmlContainer: "text-sm",
        confirmButton: "btn btn-sm btn-danger",
        cancelButton: "btn btn-sm btn-light",
        popup: "p-3 rounded-3",
      },
    }).then((res) => {
      if (!res.isConfirmed) return;
      const currentValues = Array.isArray(attr?.values) ? [...attr.values] : [];
      const nextValues = currentValues.filter((_, i) => i !== row.index);
      attributesApi
        .updateAttribute(attr._id || attr.id, { values: nextValues })
        .then(() => {
          toast.info("Value deleted");
          loadAttribute();
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || "Failed to delete value");
        });
    });
  };

  const statusBadge = attr?.status
    ? "<span class='badge bg-success'>Active</span>"
    : "<span class='badge bg-secondary'>Inactive</span>";

  const filterBadge = attr?.isFilter
    ? "<span class='badge bg-primary'>Yes</span>"
    : "<span class='badge bg-light text-dark'>No</span>";

  return (
    <MasterLayout>
      <div className="container-fluid">
        <Breadcrumb title="Catalog / Attribute Details" />

        <div className="card mb-24">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h6 className="mb-0">Attribute Details</h6>
            <div className="d-flex gap-8">
              <button className="btn btn-neutral-400" onClick={() => navigate("/catalog/attributes")}>Back to List</button>
              <button className="btn btn-primary-600" onClick={openAddValue}>Add Value</button>
            </div>
          </div>
          <div className="card-body">
            {loading || !attr ? (
              <div>Loading...</div>
            ) : (
              <>
                <div className="mb-16">
                  <div className="d-flex flex-wrap gap-16 align-items-center">
                    <div><strong>Name:</strong> {attr.name || "-"}</div>
                    <div><strong>Type:</strong> {attr.type || "-"}</div>
                    <div><strong>Filter:</strong> <span dangerouslySetInnerHTML={{ __html: filterBadge }} /></div>
                    <div><strong>Status:</strong> <span dangerouslySetInnerHTML={{ __html: statusBadge }} /></div>
                    <div><strong>Created:</strong> {attr.createdAt ? new Date(attr.createdAt).toLocaleString() : "-"}</div>
                  </div>
                </div>

                <TableDataLayer
                  title="Attribute Values"
                  headers={headers}
                  data={rows}
                  onView={(row) => {
                    Swal.fire({ title: "Value", html: `<pre style='text-align:left'>${JSON.stringify(row.raw, null, 2)}</pre>` });
                  }}
                  onEdit={openEditValue}
                  onDelete={deleteValue}
                />
              </>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">{editingIndex !== null ? "Edit Value" : "Add Value"}</h6>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={saveValue}>
                  <div className="modal-body">
                    <div className="mb-12">
                      <label className="form-label">Value ID</label>
                      <input type="text" className="form-control" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required />
                    </div>
                    <div className="mb-12">
                      <label className="form-label">Value Label</label>
                      <input type="text" className="form-control" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-neutral-400" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary-600">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    </MasterLayout>
  );
};

export default AttributeDetailsPage;

