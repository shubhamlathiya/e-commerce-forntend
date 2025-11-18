import React, { useState } from "react";

export default function OrderActionMenu({ isAdmin, onView, onUpdateStatus, onProcess }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dropdown">
      <button className="btn btn-sm btn-outline-secondary" onClick={() => setOpen((v) => !v)}>
        Actions
      </button>
      {open && (
        <div className="dropdown-menu show" style={{ position: "absolute" }}>
          <button className="dropdown-item" onClick={() => { setOpen(false); onView?.(); }}>View</button>
          {isAdmin && (
            <>
              <button className="dropdown-item" onClick={() => { setOpen(false); onUpdateStatus?.(); }}>Update Status</button>
              <button className="dropdown-item" onClick={() => { setOpen(false); onProcess?.("return"); }}>Process Return</button>
              <button className="dropdown-item" onClick={() => { setOpen(false); onProcess?.("replacement"); }}>Process Replacement</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

