import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { X } from "lucide-react";
import { getUserProfile } from "../utils/getUserProfile";

export default function ShareDialog({
  open,
  noteId,
  note,
  currentUserId,
  canManage,
  onAdd,
  onRemove,
  onClose,
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);

  const collaborators = note?.collaborators || [];
  const viewers = note?.viewers || [];
  const ownerId = note?.userId;

  useEffect(() => {
    let active = true;
    setLoadingPeople(true);
    const ids = [
      ...(ownerId ? [{ uid: ownerId, role: "owner" }] : []),
      ...collaborators.map((uid) => ({ uid, role: "editor" })),
      ...viewers.map((uid) => ({ uid, role: "viewer" })),
    ];
    Promise.all(
      ids.map(({ uid, role: r }) =>
        getUserProfile(uid).then((p) => ({ uid, role: r, ...(p || {}) }))
      )
    )
      .then((res) => {
        if (active) setPeople(res);
      })
      .finally(() => active && setLoadingPeople(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, collaborators.join(","), viewers.join(",")]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setBusy(true);
    try {
      await onAdd(noteId, email, role);
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not add collaborator.");
    } finally {
      setBusy(false);
    }
  };

  const initialOf = (p) => (p.displayName || p.email || "U").charAt(0).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600 }}>
        Share note
      </DialogTitle>
      <DialogContent>
        {canManage ? (
          <Box component="form" onSubmit={handleAdd} sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add by email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              size="small"
              select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ minWidth: 104 }}
            >
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </TextField>
            <Button type="submit" variant="contained" disabled={busy || !email.trim()}>
              Invite
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Only the owner can manage who has access.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "4px", py: 0.25 }}>
            {error}
          </Alert>
        )}

        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          People with access
        </Typography>

        {loadingPeople ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {people.map((p) => {
              const isOwner = p.role === "owner";
              const roleLabel =
                p.role === "owner" ? "Owner" : p.role === "viewer" ? "Viewer" : "Editor";
              return (
                <Box
                  key={p.uid}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}
                >
                  <Avatar
                    src={p.photoURL || undefined}
                    variant="square"
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      borderRadius: "4px",
                      bgcolor: "primary.main",
                      color: "#fff",
                    }}
                  >
                    {initialOf(p)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                      {p.displayName || p.email || "Unknown"}
                      {p.uid === currentUserId ? " (you)" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {roleLabel}
                      {p.email ? ` · ${p.email}` : ""}
                    </Typography>
                  </Box>
                  {canManage && !isOwner && (
                    <IconButton size="small" onClick={() => onRemove(noteId, p.uid)}>
                      <X size={15} />
                    </IconButton>
                  )}
                </Box>
              );
            })}
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
