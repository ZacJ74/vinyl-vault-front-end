import React from 'react';

function Modal({ isOpen, onClose, title, message, type = 'alert', onConfirm = null }) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          {type === 'confirm' ? (
            <>
              <button className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-confirm" onClick={handleConfirm}>
                Confirm
              </button>
            </>
          ) : (
            <button className="btn btn-ok" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;