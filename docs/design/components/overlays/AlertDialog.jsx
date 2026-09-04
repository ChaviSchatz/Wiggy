import React from "react";
import { Button } from "../core/Button.jsx";
import { Dialog } from "./Dialog.jsx";

// Destructive and irreversible actions only. Solid danger confirm.
export function AlertDialog({ open, onClose, title, description, confirmLabel = "מחיקה", cancelLabel = "ביטול", onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width={420}
      footer={
        <>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
        </>
      }
    />
  );
}
