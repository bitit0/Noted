import React, { useState, useEffect, useMemo, useCallback } from "react";
import { db } from "./firebaseConfig";
import {
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
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
import Tiptap from "./components/TiptapEditor/Tiptap";
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

    // A note reaches this user as owner, editor (collaborators), or viewer.
    // Owner wins over editor wins over viewer when a doc matches more than once.
    let owned = [];
    let editing = [];
    let viewing = [];
    const merge = () => {
      const byId = new Map();
      owned.forEach((n) => byId.set(n.id, { ...n, role: "owner" }));
      editing.forEach((n) => {
        if (!byId.has(n.id)) byId.set(n.id, { ...n, shared: true, role: "editor" });
      });
      viewing.forEach((n) => {
        if (!byId.has(n.id)) byId.set(n.id, { ...n, shared: true, role: "viewer" });
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

    const unsubEditing = onSnapshot(
      query(collection(db, "notes"), where("collaborators", "array-contains", user.uid)),
      (snap) => {
        editing = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        merge();
      },
      (err) => console.error("[notes] editor listener:", err)
    );

    const unsubViewing = onSnapshot(
      query(collection(db, "notes"), where("viewers", "array-contains", user.uid)),
      (snap) => {
        viewing = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        merge();
      },
      (err) => console.error("[notes] viewer listener:", err)
    );

    return () => {
      unsubFolders();
      unsubOwned();
      unsubEditing();
      unsubViewing();
    };
  }, [user]);

  // Keep selection valid (drop notes that vanished or were moved to Trash).
  useEffect(() => {
    if (
      selectedNoteId &&
      !notes.some((n) => n.id === selectedNoteId && !n.deletedAt)
    ) {
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

  // Soft delete: move to Trash (reversible) instead of destroying the doc.
  const deleteNote = useCallback(
    async (id) => {
      await updateDoc(doc(db, "notes", id), { deletedAt: serverTimestamp() });
      if (selectedNoteId === id) setSelectedNoteId(null);
      notify("Note moved to Trash");
    },
    [selectedNoteId, notify]
  );

  const restoreNote = useCallback(
    async (id) => {
      await updateDoc(doc(db, "notes", id), { deletedAt: null });
      notify("Note restored");
    },
    [notify]
  );

  const deleteNoteForever = useCallback(
    async (id) => {
      await deleteDoc(doc(db, "notes", id));
      if (selectedNoteId === id) setSelectedNoteId(null);
      notify("Note permanently deleted");
    },
    [selectedNoteId, notify]
  );

  const deleteFolder = useCallback(async (folderId) => {
    // Un-file this folder's notes, then remove the folder. Scope the query to
    // the user's own notes: Firestore rejects (not filters) any query that
    // could return docs the security rules forbid reading, so an ownership-less
    // query throws permission-denied and the delete never runs.
    const snap = await getDocs(
      query(
        collection(db, "notes"),
        where("userId", "==", user.uid),
        where("folderId", "==", folderId)
      )
    );
    await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { folderId: null })));
    await deleteDoc(doc(db, "folders", folderId));
    notify("Folder deleted");
  }, [user, notify]);

  const moveNote = useCallback((noteId, folderId) => {
    return updateDoc(doc(db, "notes", noteId), { folderId: folderId || null });
  }, []);

  // ponytail: pin is a note-level flag (owner-controlled); per-user pins would
  // need a separate per-user structure — add that if pins-per-viewer matter.
  const togglePin = useCallback((note) => {
    return updateDoc(doc(db, "notes", note.id), { pinned: !note.pinned });
  }, []);

  const addCollaboratorByEmail = useCallback(
    async (noteId, email, role = "editor") => {
      const found = await findUserByEmail(email);
      if (!found) throw new Error("No Noted user found with that email.");
      if (found.uid === user.uid) throw new Error("That's you — you already own this note.");
      // A person holds exactly one role: adding to one list clears the other.
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(
        noteRef,
        role === "viewer"
          ? { viewers: arrayUnion(found.uid), collaborators: arrayRemove(found.uid) }
          : { collaborators: arrayUnion(found.uid), viewers: arrayRemove(found.uid) }
      );
      return found;
    },
    [user]
  );

  // Publish a point-in-time, read-only copy to a public link (idempotent:
  // publishing an already-public note refreshes the copy with current content).
  const publishNote = useCallback(
    async (noteId) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return null;
      const token = note.publicToken || crypto.randomUUID();
      await setDoc(doc(db, "publicShares", token), {
        noteId,
        ownerId: user.uid,
        title: note.title || "Untitled",
        ydocState: note.ydocState || null,
        updatedAt: serverTimestamp(),
      });
      if (!note.publicToken) {
        await updateDoc(doc(db, "notes", noteId), { publicToken: token });
      }
      return token;
    },
    [notes, user]
  );

  const unpublishNote = useCallback(
    async (noteId) => {
      const note = notes.find((n) => n.id === noteId);
      if (!note?.publicToken) return;
      await deleteDoc(doc(db, "publicShares", note.publicToken));
      await updateDoc(doc(db, "notes", noteId), { publicToken: deleteField() });
    },
    [notes]
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

  const openDeleteNoteForever = (note) =>
    setConfirm({
      title: "Delete forever?",
      body: `"${note.title || "Untitled"}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete forever",
      onConfirm: () => deleteNoteForever(note.id),
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
          onDeleteNote={(note) => deleteNote(note.id)}
          onRestoreNote={(note) => restoreNote(note.id)}
          onDeleteNoteForever={openDeleteNoteForever}
          onRenameFolder={openRenameFolder}
          onDeleteFolder={openDeleteFolder}
          onShareNote={(id) => setShareNoteId(id)}
          onMoveNote={moveNote}
          onTogglePin={togglePin}
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
                    {selectedNote.role === "viewer"
                      ? "Shared with you · View only"
                      : selectedNote.shared
                      ? "Shared with you"
                      : "Your note"}
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
                <Tiptap
                  noteId={selectedNote.id}
                  userId={user.uid}
                  editable={selectedNote.role !== "viewer"}
                />
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
            try {
              await confirm.onConfirm();
              setConfirm(null);
            } catch (err) {
              console.error("[notes] action failed:", err);
              notify(err.message || "Something went wrong", "error");
            }
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
          onAdd={async (noteId, email, role) => {
            const found = await addCollaboratorByEmail(noteId, email, role);
            notify(`Shared with ${found.displayName || found.email}`);
            return found;
          }}
          onRemove={async (noteId, uid) => {
            await updateDoc(doc(db, "notes", noteId), {
              collaborators: arrayRemove(uid),
              viewers: arrayRemove(uid),
            });
            notify("Access removed");
          }}
          onPublish={async (noteId) => {
            const token = await publishNote(noteId);
            notify("Public link ready");
            return token;
          }}
          onUnpublish={async (noteId) => {
            await unpublishNote(noteId);
            notify("Public link removed");
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
