import React, { useEffect, useMemo, useState } from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSingleTabCategory, updateTabCategory, getCategories } from "../../api/catalogApi";

const toSlug = (str = "") => str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, " ").replace(/-+/g, " ");

const EditTabCategoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    status: true,
    sortOrder: 0,
    categories: [],
    color: "#4CAF72",
    headerColor: "#4CAF72",
    lightColor: "#CFF5DE"
  });
  const [iconFile, setIconFile] = useState(null);
  const [existingIcon, setExistingIcon] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTab();
  }, [id]);

  const loadCategories = async () => {
    try {
      const res = await getCategories({ limit: 1000 });
      const cats = Array.isArray(res?.data) ? res.data : (res?.data?.items || res?.items || res || []);
      const opts = cats.map((c) => ({ value: c._id || c.id, label: c.name }));
      setCategoryOptions(opts);
    } catch {
      setCategoryOptions([]);
    }
  };

  const loadTab = async () => {
    try {
      setLoading(true);
      const res = await getSingleTabCategory(id);
      const t = res?.data || res || {};

      // Handle categories array - ensure we get IDs
      const categories = Array.isArray(t.categories)
          ? t.categories.map(c => c._id || c.id || c)
          : [];

      // Handle categoryIds if provided separately
      const categoryIds = Array.isArray(t.categoryIds)
          ? t.categoryIds.map(id => id._id || id.id || id)
          : [];

      // Use categories first, fall back to categoryIds
      const finalCategories = categories.length > 0 ? categories : categoryIds;

      setForm({
        name: t.name || "",
        slug: t.slug || "",
        status: t.status !== false,
        sortOrder: Number(t.sortOrder || 0),
        categories: finalCategories,
        color: t.color || "#4CAF72",
        headerColor: t.headerColor || "#4CAF72",
        lightColor: t.lightColor || "#CFF5DE"
      });

      if (t.icon) {
        setExistingIcon(`${process.env.REACT_APP_API_BASE_URL}${t.icon}`);

      }
    } catch (error) {
      console.error("Load tab error:", error);
      toast.error(error.response?.data?.message || "Failed to load tab category");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryOptions = useMemo(() =>
          categoryOptions.filter((o) => (form.categories || []).includes(o.value)),
      [categoryOptions, form.categories]
  );

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!form.name?.trim()) {
      toast.error("Tab name is required");
      return;
    }

    if (!form.categories || form.categories.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    payload.append("name", (form.name || "").trim());

    if ((form.slug || "").trim()) {
      payload.append("slug", (form.slug || "").trim());
    }

    payload.append("status", form.status.toString());
    payload.append("sortOrder", String(Number(form.sortOrder) || 0));

    // Add colors
    payload.append("color", form.color || "#4CAF72");
    payload.append("headerColor", form.headerColor || "#4CAF72");
    payload.append("lightColor", form.lightColor || "#CFF5DE");

    // Add categories - using categories[] format
    (form.categories || []).forEach((cid) => {
      payload.append("categories[]", cid);
    });

    // Add icon file if exists
    if (iconFile) {
      payload.append("image", iconFile);
    }

    try {
      await updateTabCategory(id, payload);
      toast.success("Tab category updated successfully");
      navigate("/tab-categories");
    } catch(error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Error updating tab category");
    } finally {
      setSubmitting(false);
    }
  };

  // Color presets for quick selection (same as create page)
  const colorPresets = [
    { name: "Green", color: "#4CAF72", headerColor: "#4CAF72", lightColor: "#CFF5DE" },
    { name: "Pink", color: "#D84F80", headerColor: "#D84F80", lightColor: "#FFD6E5" },
    { name: "Blue", color: "#3A9AEF", headerColor: "#3A9AEF", lightColor: "#D8ECFF" },
    { name: "Teal", color: "#33B5CC", headerColor: "#33B5CC", lightColor: "#D6F6FF" },
    { name: "Orange", color: "#E89A23", headerColor: "#E89A23", lightColor: "#FFE8C8" },
    { name: "Purple", color: "#A466E8", headerColor: "#A466E8", lightColor: "#E8D6FF" }
  ];

  if (loading) {
    return (
        <MasterLayout>
          <Breadcrumb title="Catalog / Tab Categories / Edit" />
          <div className="card h-100 p-0 radius-12">
            <div className="card-body p-24 d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </MasterLayout>
    );
  }

  return (
      <MasterLayout>
        <Breadcrumb title="Catalog / Tab Categories / Edit" />
        <div className="card h-100 p-0 radius-12">
          <div className="card-header py-16 px-24 bg-base border-0">
            <h6 className="text-lg mb-0">Edit Tab Category</h6>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body p-24">
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Name *</label>
                    <input
                        className="form-control"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          name: e.target.value,
                          slug: toSlug(e.target.value)
                        }))}
                        required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Slug</label>
                    <input
                        className="form-control"
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    />
                    <small className="text-muted">Leave empty to auto-generate from name</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <div className="form-switch switch-purple d-flex align-items-center gap-3">
                      <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="tab-active-switch"
                          checked={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
                      />
                      <label className="form-check-label line-height-1 fw-medium text-secondary-light" htmlFor="tab-active-switch">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Sort Order</label>
                    <input
                        type="number"
                        className="form-control"
                        value={form.sortOrder}
                        onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                    />
                    <small className="text-muted">Lower numbers appear first</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Icon Upload</label>
                    <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                    />
                    <small className="text-muted">Recommended size: 100x100px</small>

                    {existingIcon && !iconFile && (
                        <div className="mt-2">
                          <span className="text-muted me-2">Current icon:</span>
                          <img
                              src={existingIcon}
                              alt="Current icon"
                              style={{ width: 50, height: 50, objectFit: 'contain' }}
                              className="border rounded p-1"
                          />
                        </div>
                    )}

                    {iconFile && (
                        <div className="mt-2">
                          <span className="text-muted me-2">New icon selected:</span>
                          <span className="fw-medium">{iconFile.name}</span>
                        </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign Categories *</label>
                    <Select
                        isMulti
                        options={categoryOptions}
                        value={selectedCategoryOptions}
                        onChange={(sel) => setForm((f) => ({
                          ...f,
                          categories: (sel || []).map((s) => s.value)
                        }))}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder="Select categories"
                        required
                    />
                    <small className="text-muted">Select categories to include in this tab</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Color Presets</label>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {colorPresets.map((preset, index) => (
                          <button
                              key={index}
                              type="button"
                              className="btn btn-sm"
                              style={{
                                backgroundColor: preset.color,
                                color: '#fff',
                                border: '1px solid #ddd'
                              }}
                              onClick={() => setForm(f => ({
                                ...f,
                                color: preset.color,
                                headerColor: preset.headerColor,
                                lightColor: preset.lightColor
                              }))}
                              title={preset.name}
                          >
                            {preset.name}
                          </button>
                      ))}
                    </div>

                    <div className="row g-3">
                      <div className="col-4">
                        <label className="form-label">Main Color</label>
                        <input
                            type="color"
                            className="form-control form-control-color"
                            value={form.color}
                            onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                            title="Choose main color"
                        />
                        <input
                            type="text"
                            className="form-control form-control-sm mt-1"
                            value={form.color}
                            onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))}
                            placeholder="#4CAF72"
                        />
                      </div>

                      <div className="col-4">
                        <label className="form-label">Header Color</label>
                        <input
                            type="color"
                            className="form-control form-control-color"
                            value={form.headerColor}
                            onChange={(e) => setForm(f => ({ ...f, headerColor: e.target.value }))}
                            title="Choose header color"
                        />
                        <input
                            type="text"
                            className="form-control form-control-sm mt-1"
                            value={form.headerColor}
                            onChange={(e) => setForm(f => ({ ...f, headerColor: e.target.value }))}
                            placeholder="#4CAF72"
                        />
                      </div>

                      <div className="col-4">
                        <label className="form-label">Light Color</label>
                        <input
                            type="color"
                            className="form-control form-control-color"
                            value={form.lightColor}
                            onChange={(e) => setForm(f => ({ ...f, lightColor: e.target.value }))}
                            title="Choose light color"
                        />
                        <input
                            type="text"
                            className="form-control form-control-sm mt-1"
                            value={form.lightColor}
                            onChange={(e) => setForm(f => ({ ...f, lightColor: e.target.value }))}
                            placeholder="#CFF5DE"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Color Preview</label>
                    <div className="border rounded p-3">
                      <div className="d-flex gap-3 mb-2">
                        <div
                            className="rounded"
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: form.color || '#4CAF72'
                            }}
                        ></div>
                        <div
                            className="rounded"
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: form.headerColor || '#4CAF72'
                            }}
                        ></div>
                        <div
                            className="rounded"
                            style={{
                              width: 40,
                              height: 40,
                              backgroundColor: form.lightColor || '#CFF5DE'
                            }}
                        ></div>
                      </div>
                      <div className="text-muted">
                        Main: {form.color || '#4CAF72'} | Header: {form.headerColor || '#4CAF72'} | Light: {form.lightColor || '#CFF5DE'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer border-0 p-24 pt-0 d-flex justify-content-end gap-2">
              <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => navigate("/tab-categories")}
                  disabled={submitting}
              >
                Cancel
              </button>
              <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !form.name || form.categories.length === 0}
              >
                {submitting ? 'Updating...' : 'Update Tab Category'}
              </button>
            </div>
          </form>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </MasterLayout>
  );
};

export default EditTabCategoryPage;