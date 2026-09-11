import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { History } from "lucide-react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { relativeTime } from "../utils/relativeTime";

// Manual version history for a note. "Save version" snapshots the current
// editor HTML; "Restore" pushes a snapshot back into the live editor (which
// syncs to collaborators like any other edit).
export default function VersionHistoryDialog({
  open,
  noteId,
  canEdit,
  getCurrentHtml,
  title,
  userId,
  username,
  onRestore,
  onClose,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "notes", noteId, "versions"), orderBy("createdAt", "desc"))
      );
      setVersions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("[versions] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (open) {
      setConfirmId(null);
      load();
    }
  }, [open, load]);

  const saveVersion = async () => {
    setBusy(true);
    try {
      await addDoc(collection(db, "notes", noteId, "versions"), {
        html: getCurrentHtml(),
        title: title || "Untitled",
        createdBy: userId,
        createdByName: username || "Someone",
        createdAt: serverTimestamp(),
      });
      await load();
    } catch (err) {
      console.error("[versions] save failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const restore = (v) => {
    if (confirmId !== v.id) {
      setConfirmId(v.id);
      return;
    }
    onRestore(v.html);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <History size={18} /> Version history
      </DialogTitle>
      <DialogContent>
        {canEdit && (
          <Button
            variant="outlined"
            size="small"
            onClick={saveVersion}
            disabled={busy}
            sx={{ mb: 2 }}
          >
            {busy ? "Saving…" : "Save current version"}
          </Button>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : versions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No saved versions yet.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {versions.map((v) => (
              <Box
                key={v.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  py: 0.75,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {relativeTime(v.createdAt) || "Just now"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {v.createdByName || "Someone"}
                  </Typography>
                </Box>
                {canEdit && (
                  <Button
                    size="small"
                    color={confirmId === v.id ? "error" : "primary"}
                    onClick={() => restore(v)}
                  >
                    {confirmId === v.id ? "Confirm" : "Restore"}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
