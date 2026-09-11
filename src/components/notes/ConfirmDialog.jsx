import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  onClose,
  onConfirm,
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText color="text.secondary">{body}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button
          onClick={confirm}
          variant="contained"
          color="error"
          disabled={busy}
          sx={{ bgcolor: "error.main", "&:hover": { bgcolor: "error.dark" } }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
