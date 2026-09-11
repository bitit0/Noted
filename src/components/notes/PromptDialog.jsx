import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

export default function PromptDialog({
  open,
  title,
  label,
  initial = "",
  submitLabel = "Save",
  onClose,
  onSubmit,
}) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setValue(initial);
  }, [initial, open]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    try {
      await onSubmit(value);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
          {title}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="text">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!value.trim() || busy}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
