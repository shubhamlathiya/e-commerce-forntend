import React from "react";

export default function ConfirmModal({ show, title = "Confirm Action", message = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop d-block">
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">{title}</h6>
              <button type="button" className="btn-close" onClick={onCancel} />
            </div>
            <div className="modal-body two-col">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onCancel}>{cancelText}</button>
              <button className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
