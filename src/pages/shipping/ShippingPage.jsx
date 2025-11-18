import React, {useEffect, useState} from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TableDataLayer from "../../components/TableDataLayer";
import Swal from "sweetalert2";
import {toast, ToastContainer} from "react-toastify";
import {
    getShippingRules,
    createShippingRule,
    updateShippingRule,
    deleteShippingRule,
    getShippingZones,
    createShippingZone,
    updateShippingZone,
    deleteShippingZone,
} from "../../api/shippingAPI";

export default function ShippingPage() {
    const [rules, setRules] = useState([]);
    const [zones, setZones] = useState([]);
    const [ruleModalOpen, setRuleModalOpen] = useState(false);
    const [zoneModalOpen, setZoneModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState(null);
    const [currentZone, setCurrentZone] = useState(null);

    const [ruleForm, setRuleForm] = useState({
        title: "",
        minOrderValue: "",
        maxOrderValue: "",
        shippingCost: "",
        country: "",
        state: "",
        pincodes: "",
        status: true,
    });

    const [zoneForm, setZoneForm] = useState({
        zoneName: "",
        countries: "",
        states: "",
        pincodes: "",
        marketFees: "",
        status: true,
    });

    // Fetch rules and zones
    const fetchData = async () => {
        try {
            const [rulesRes, zonesRes] = await Promise.all([getShippingRules(), getShippingZones()]);
            setRules(Array.isArray(rulesRes) ? rulesRes : rulesRes?.data || []);
            setZones(Array.isArray(zonesRes) ? zonesRes : zonesRes?.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to fetch shipping data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ---- Handlers ----
    const openCreateRule = () => {
        setCurrentRule(null);
        setRuleForm({
            title: "",
            minOrderValue: "",
            maxOrderValue: "",
            shippingCost: "",
            country: "",
            state: "",
            pincodes: "",
            status: true
        });
        setRuleModalOpen(true);
    };

    const openEditRule = (rule) => {
        setCurrentRule(rule);
        setRuleForm({
            title: rule.title || "",
            minOrderValue: rule.minOrderValue || "",
            maxOrderValue: rule.maxOrderValue || "",
            shippingCost: rule.shippingCost || "",
            country: rule.country || "",
            state: rule.state || "",
            pincodes: Array.isArray(rule.pincodes) ? rule.pincodes.join(", ") : rule.pincodes || "",
            status: !!rule.status,
        });
        setRuleModalOpen(true);
    };

    const handleRuleSave = async (e) => {
        e.preventDefault();
        const payload = {
            ...ruleForm,
            pincodes: (ruleForm.pincodes || "").split(",").map(p => p.trim()).filter(Boolean),
            status: !!ruleForm.status,
        };
        try {
            if (currentRule?._id) {
                await updateShippingRule(currentRule._id, payload);
                toast.success("Rule updated");
            } else {
                await createShippingRule(payload);
                toast.success("Rule created");
            }
            setRuleModalOpen(false);
            fetchData();
        } catch {
            toast.error("Failed to save rule");
        }
    };

    const handleRuleDelete = (rule) => {
        Swal.fire({
            title: "Delete Rule?",
            text: `Are you sure you want to delete "${rule.title}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
        }).then(async (res) => {
            if (!res.isConfirmed) return;
            try {
                await deleteShippingRule(rule._id);
                toast.info("Rule deleted");
                fetchData();
            } catch {
                toast.error("Failed to delete rule");
            }
        });
    };

    const openCreateZone = () => {
        setCurrentZone(null);
        setZoneForm({
            zoneName: "",
            countries: "",
            states: "",
            pincodes: "",
            marketFees: "",
            status: true
        });
        setZoneModalOpen(true);
    };


    const openEditZone = (zone) => {
        setCurrentZone(zone);
        setZoneForm({
            zoneName: zone.zoneName || "",
            countries: Array.isArray(zone.countries) ? zone.countries.join(", ") : zone.countries || "",
            states: Array.isArray(zone.states) ? zone.states.join(", ") : zone.states || "",
            pincodes: Array.isArray(zone.pincodes) ? zone.pincodes.join(", ") : zone.pincodes || "",
            marketFees: zone.marketFees || "",   // ⭐ NEW FIELD
            status: !!zone.status,
        });
        setZoneModalOpen(true);
    };


    const handleZoneSave = async (e) => {
        e.preventDefault();
        const payload = {
            ...zoneForm,
            countries: (zoneForm.countries || "").split(",").map(c => c.trim()).filter(Boolean),
            states: (zoneForm.states || "").split(",").map(s => s.trim()).filter(Boolean),
            pincodes: (zoneForm.pincodes || "").split(",").map(p => p.trim()).filter(Boolean),

            marketFees: Number(zoneForm.marketFees) || 0,
            status: !!zoneForm.status,
        };

        try {
            if (currentZone?._id) {
                await updateShippingZone(currentZone._id, payload);
                toast.success("Zone updated");
            } else {
                await createShippingZone(payload);
                toast.success("Zone created");
            }
            setZoneModalOpen(false);
            fetchData();
        } catch {
            toast.error("Failed to save zone");
        }
    };


    const handleZoneDelete = (zone) => {
        Swal.fire({
            title: "Delete Zone?",
            text: `Are you sure you want to delete "${zone.zoneName}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete",
        }).then(async (res) => {
            if (!res.isConfirmed) return;
            try {
                await deleteShippingZone(zone._id);
                toast.info("Zone deleted");
                fetchData();
            } catch {
                toast.error("Failed to delete zone");
            }
        });
    };

    // ---- Badge helper ----
    const statusBadge = (active) => active ? "<span class='bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm'>Active</span>" : "<span class='bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm'>Inactive</span>";

    return (<MasterLayout>
        <Breadcrumb title="Shipping"/>

        {/* Shipping Rules Table */}
        <div className="card h-100 p-0 radius-12 mb-24">
            <div
                className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                <h6 className="text-lg mb-0">Shipping Rules</h6>
                <button className="btn btn-primary-600" onClick={openCreateRule}>
                    <i className="ri-add-line me-1"/> Add Rule
                </button>
            </div>
            <div className="card-body">
                <div style={{overflowX: "auto"}}>
                    <TableDataLayer
                        title="Rules List"
                        headers={["#", "Title", "Minorder", "Maxorder", "Shippingcost", "Country", "State", "Status"]}
                        data={rules.map((r, i) => ({
                            "#": i + 1,
                            title: r.title,
                            minorder: r.minOrderValue,
                            maxorder: r.maxOrderValue,
                            shippingcost: r.shippingCost,
                            country: r.country,
                            state: r.state,
                            status: statusBadge(r.status),
                            id: r._id,
                        }))}
                        onEdit={(row) => openEditRule(rules.find(r => r._id === row.id))}
                        onDelete={(row) => handleRuleDelete(rules.find(r => r._id === row.id))}
                    />
                </div>
            </div>
        </div>

        {/* Shipping Zones Table */}
        <div className="card h-100 p-0 radius-12 mb-24">
            <div
                className="card-header bg-neutral-100 border-bottom py-16 px-24 d-flex align-items-center justify-content-between">
                <h6 className="text-lg mb-0">Shipping Zones</h6>
                <button className="btn btn-primary-600" onClick={openCreateZone}>
                    <i className="ri-add-line me-1"/> Add Zone
                </button>
            </div>
            <div className="card-body p-24">
                <TableDataLayer
                    title="Zones List"
                    headers={["#", "Zonename", "Countries", "States", "Pincodes", "MarketFees"]}
                    data={zones.map((z, i) => ({
                        "#": i + 1,
                        zonename: z.zoneName,
                        countries: Array.isArray(z.countries) ? z.countries.join(", ") : z.countries,
                        states: Array.isArray(z.states) ? z.states.join(", ") : z.states,
                        pincodes: Array.isArray(z.pincodes) ? z.pincodes.join(", ") : z.pincodes,
                        marketfees: z.marketFees,
                        id: z._id,
                    }))}

                    onEdit={(row) => openEditZone(zones.find(z => z._id === row.id))}
                    onDelete={(row) => handleZoneDelete(zones.find(z => z._id === row.id))}
                />
            </div>
        </div>

        {/* Modals */}
        {ruleModalOpen && (<Modal
            title={currentRule?._id ? "Edit Rule" : "Add Rule"}
            form={ruleForm}
            setForm={setRuleForm}
            onSubmit={handleRuleSave}
            onClose={() => setRuleModalOpen(false)}
        />)}
        {zoneModalOpen && (<Modal
            title={currentZone?._id ? "Edit Zone" : "Add Zone"}
            form={zoneForm}
            setForm={setZoneForm}
            onSubmit={handleZoneSave}
            onClose={() => setZoneModalOpen(false)}
        />)}

        <ToastContainer position="top-right" autoClose={2000}/>
    </MasterLayout>);
}

function Modal({title, form, setForm, onSubmit, onClose}) {
    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show"></div>

            {/* Modal Wrapper */}
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                role="dialog"
                style={{
                    zIndex: 1050,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    overflow: "auto",
                }}
            >
                <div
                    className="modal-dialog modal-lg modal-dialog-centered"
                    style={{
                        maxWidth: "800px",
                        width: "100%",
                    }}
                >
                    <div className="modal-content radius-12 shadow-lg">
                        {/* Header */}
                        <div className="modal-header">
                            <h6 className="modal-title">{title}</h6>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                aria-label="Close"
                            />
                        </div>

                        {/* Form */}
                        <form onSubmit={onSubmit}>
                            <div className="modal-body">
                                {/* Two Column Grid */}
                                <div className="row g-3">
                                    {Object.keys(form)
                                        .filter((key) => key !== "status")
                                        .map((key) => (
                                            <div className="col-md-6" key={key}>
                                                <label className="form-label fw-medium">
                                                    {key.replace(/([A-Z])/g, " $1")}
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={form[key]}
                                                    onChange={(e) =>
                                                        setForm((f) => ({...f, [key]: e.target.value}))
                                                    }
                                                />
                                            </div>
                                        ))}
                                </div>

                                {/* Status Switch */}
                                <div className="mt-4 d-flex align-items-center justify-content-between">
                                    <label className="form-label mb-0 fw-medium">Status</label>
                                    <div className="form-switch switch-primary">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={!!form.status}
                                            onChange={(e) =>
                                                setForm((f) => ({...f, status: e.target.checked}))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-neutral-400"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary-600">
                                    {title.includes("Edit") ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
