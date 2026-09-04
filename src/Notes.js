import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "./firebaseConfig";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Tiptap from "./components/TiptapEditor/Tiptap.js";
import Sidebar from "./components/notes/Sidebar";
import ShareDialog from "./components/notes/ShareDialog";
import PromptDialog from "./components/notes/PromptDialog";
import ConfirmDialog from "./components/notes/ConfirmDialog";
import CollaboratorAvatars from "./components/notes/CollaboratorAvatars";
import { findUserByEmail } from "./components/utils/findUserByEmail";

const Notes = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [search, setSearch] = useState("");

  // dialog state
  const [prompt, setPrompt] = useState(null); // { kind, title, label, initial, onSubmit }
  const [confirm, setConfirm] = useState(null); // { title, body, onConfirm }
  const [shareNoteId, setShareNoteId] = useState(null);
  const [toast, setToast] = useState(null); // { msg, sev }

  const notify = useCallback((msg, sev = "success") => setToast({ msg, sev }), []);

  // ---- Realtime data ----
  useEffect(() => {
    if (!user) return undefined;

    const unsubFolders = onSnapshot(
      query(collection(db, "folders"), where("createdBy", "==", user.uid)),
      (snap) => setFolders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("[notes] folders listener:", err)
    );

    let owned = [];
    let shared = [];
    const merge = () => {
      const byId = new Map();
      owned.forEach((n) => byId.set(n.id, n));
      shared.forEach((n) => {
        if (!byId.has(n.id)) byId.set(n.id, n);
      });
      setNotes(Array.from(byId.values()));
    };

    const unsubOwned = onSnapshot(
      query(collection(db, "notes"), where("userId", "==", user.uid)),
      (snap) => {
        owned = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        merge();
      },
      (err) => console.error("[notes] owned listener:", err)
    );

    const unsubShared = onSnapshot(
      query(collection(db, "notes"), where("collaborators", "array-contains", user.uid)),
      (snap) => {
        shared = snap.docs.map((d) => ({ id: d.id, ...d.data(), shared: true }));
        merge();
      },
      (err) => console.error("[notes] shared listener:", err)
    );

    return () => {
      unsubFolders();
      unsubOwned();
      unsubShared();
    };
  }, [user]);

  // Keep selection valid.
  useEffect(() => {
    if (selectedNoteId && !notes.some((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  // ---- Actions ----
  const createNote = useCallback(
    async (title, folderId = null) => {
      if (!user) return;
      const ref = await addDoc(collection(db, "notes"), {
        title: title?.trim() || "Untitled",
        userId: user.uid,
        collaborators: [],
        folderId: folderId || null,
        snapshot: "",
        ydocState: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSelectedNoteId(ref.id);
    },
    [user]
  );

  const createFolder = useCallback(
    async (name) => {
      if (!user || !name?.trim()) return;
      await addDoc(collection(db, "folders"), {
        name: name.trim(),
        parentId: null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      notify("Folder created");
    },
    [user, notify]
  );

  const renameNote = useCallback((id, title) => {
    return updateDoc(doc(db, "notes", id), { title: title.trim() || "Untitled" });
  }, []);

  const renameFolder = useCallback((id, name) => {
    return updateDoc(doc(db, "folders", id), { name: name.trim() || "Untitled" });
  }, []);

  const deleteNote = useCallback(
    async (id) => {
      await deleteDoc(doc(db, "notes", id));
      if (selectedNoteId === id) setSelectedNoteId(null);
      notify("Note deleted");
    },
    [selectedNoteId, notify]
  );

  const deleteFolder = useCallback(async (folderId) => {
    // Un-file this folder's notes, then remove the folder.
    const snap = await getDocs(
      query(collection(db, "notes"), where("folderId", "==", folderId))
    );
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { folderId: null })));
    await deleteDoc(doc(db, "folders", folderId));
    notify("Folder deleted");
  }, [notify]);

  const moveNote = useCallback((noteId, folderId) => {
    return updateDoc(doc(db, "notes", noteId), { folderId: folderId || null });
  }, []);

  const addCollaboratorByEmail = useCallback(
    async (noteId, email) => {
      const found = await findUserByEmail(email);
      if (!found) throw new Error("No Noted user found with that email.");
      if (found.uid === user.uid) throw new Error("That's you — you already own this note.");
      await updateDoc(doc(db, "notes", noteId), {
        collaborators: arrayUnion(found.uid),
      });
      return found;
    },
    [user]
  );

  // ---- Dialog openers ----
  const openNewNote = (folderId = null) =>
    setPrompt({
      title: "New note",
      label: "Note title",
      initial: "",
      submitLabel: "Create",
      onSubmit: (v) => createNote(v, folderId),
    });

  const openNewFolder = () =>
    setPrompt({
      title: "New folder",
      label: "Folder name",
      initial: "",
      submitLabel: "Create",
      onSubmit: (v) => createFolder(v),
    });

  const openRenameNote = (note) =>
    setPrompt({
      title: "Rename note",
      label: "Note title",
      initial: note.title || "",
      submitLabel: "Save",
      onSubmit: (v) => renameNote(note.id, v),
    });

  const openRenameFolder = (folder) =>
    setPrompt({
      title: "Rename folder",
      label: "Folder name",
      initial: folder.name || "",
      submitLabel: "Save",
      onSubmit: (v) => renameFolder(folder.id, v),
    });

  const openDeleteNote = (note) =>
    setConfirm({
      title: "Delete note?",
      body: `"${note.title || "Untitled"}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => deleteNote(note.id),
    });

  const openDeleteFolder = (folder) =>
    setConfirm({
      title: "Delete folder?",
      body: `"${folder.name}" will be deleted. Its notes will be moved to Unfiled.`,
      confirmLabel: "Delete",
      onConfirm: () => deleteFolder(folder.id),
    });

  const showSidebar = !isMobile || !selectedNote;
  const showEditorPane = !isMobile || Boolean(selectedNote);

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0 }}>
      {showSidebar && (
        <Sidebar
          user={user}
          notes={notes}
          folders={folders}
          search={search}
          onSearch={setSearch}
          selectedNoteId={selectedNoteId}
          onSelect={setSelectedNoteId}
          onNewNote={openNewNote}
          onNewFolder={openNewFolder}
          onRenameNote={openRenameNote}
          onDeleteNote={openDeleteNote}
          onRenameFolder={openRenameFolder}
          onDeleteFolder={openDeleteFolder}
          onShareNote={(id) => setShareNoteId(id)}
          onMoveNote={moveNote}
          fullWidth={isMobile}
        />
      )}

      {showEditorPane && (
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {selectedNote ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  px: { xs: 1.5, sm: 3 },
                  py: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  {isMobile && (
                    <IconButton size="small" onClick={() => setSelectedNoteId(null)} aria-label="Back to notes">
                      <ArrowLeft size={18} />
                    </IconButton>
                  )}
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {selectedNote.shared ? "Shared with you" : "Your note"}
                    {selectedNote.collaborators?.length
                      ? ` · ${selectedNote.collaborators.length} collaborator${
                          selectedNote.collaborators.length > 1 ? "s" : ""
                        }`
                      : ""}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
                  <CollaboratorAvatars
                    ownerId={selectedNote.userId}
                    collaborators={selectedNote.collaborators}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShareNoteId(selectedNote.id)}
                    sx={{ py: 0.25 }}
                  >
                    Share
                  </Button>
                </Box>
              </Box>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <Tiptap noteId={selectedNote.id} userId={user.uid} />
              </Box>
            </>
          ) : (
            <EmptyState onNewNote={() => openNewNote(null)} hasNotes={notes.length > 0} />
          )}
        </Box>
      )}

      {prompt && (
        <PromptDialog
          open
          title={prompt.title}
          label={prompt.label}
          initial={prompt.initial}
          submitLabel={prompt.submitLabel}
          onClose={() => setPrompt(null)}
          onSubmit={async (v) => {
            await prompt.onSubmit(v);
            setPrompt(null);
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            await confirm.onConfirm();
            setConfirm(null);
          }}
        />
      )}

      {shareNoteId && (
        <ShareDialog
          open
          noteId={shareNoteId}
          note={notes.find((n) => n.id === shareNoteId)}
          currentUserId={user.uid}
          canManage={notes.find((n) => n.id === shareNoteId)?.userId === user.uid}
          onAdd={async (noteId, email) => {
            const found = await addCollaboratorByEmail(noteId, email);
            notify(`Shared with ${found.displayName || found.email}`);
            return found;
          }}
          onRemove={async (noteId, uid) => {
            await updateDoc(doc(db, "notes", noteId), {
              collaborators: (notes.find((n) => n.id === noteId)?.collaborators || []).filter(
                (c) => c !== uid
              ),
            });
            notify("Access removed");
          }}
          onClose={() => setShareNoteId(null)}
        />
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2800}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.sev}
            variant="filled"
            sx={{ borderRadius: "4px" }}
          >
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
};

function EmptyState({ onNewNote, hasNotes }) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {hasNotes ? "Select a note" : "Nothing here yet"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
        {hasNotes
          ? "Pick a note from the sidebar, or start a new one."
          : "Create your first note to start writing and collaborating."}
      </Typography>
      <Button variant="contained" onClick={onNewNote}>
        New note
      </Button>
    </Box>
  );
}

export default Notes;
