import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  ListItemIcon,
  useTheme,
} from "@mui/material";
import {
  Search,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FileText,
  Pencil,
  Trash2,
  Users,
  FolderInput,
  RotateCcw,
} from "lucide-react";
import { relativeTime } from "../utils/relativeTime";

const SIDEBAR_WIDTH = 288;

export default function Sidebar({
  user,
  notes,
  folders,
  search,
  onSearch,
  selectedNoteId,
  onSelect,
  onNewNote,
  onNewFolder,
  onRenameNote,
  onDeleteNote,
  onRestoreNote,
  onDeleteNoteForever,
  onRenameFolder,
  onDeleteFolder,
  onShareNote,
  onMoveNote,
  fullWidth = false,
}) {
  const [collapsed, setCollapsed] = useState({});
  const [noteMenu, setNoteMenu] = useState(null); // { anchorEl, note }
  const [folderMenu, setFolderMenu] = useState(null); // { anchorEl, folder }
  const [moveMenu, setMoveMenu] = useState(null); // { anchorEl, note }
  const [trashMenu, setTrashMenu] = useState(null); // { anchorEl, note }
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const q = search.trim().toLowerCase();
  const matches = (n) =>
    !q ||
    (n.title || "").toLowerCase().includes(q) ||
    (n.snapshot || "").toLowerCase().includes(q);

  const owned = useMemo(
    () => notes.filter((n) => !n.shared && !n.deletedAt),
    [notes]
  );
  const shared = useMemo(
    () => notes.filter((n) => n.shared && !n.deletedAt),
    [notes]
  );
  const trashed = useMemo(
    () => notes.filter((n) => !n.shared && n.deletedAt),
    [notes]
  );

  const notesInFolder = (folderId) =>
    owned.filter((n) => (n.folderId || null) === folderId && matches(n));
  const unfiled = owned.filter((n) => !n.folderId && matches(n));
  const sharedFiltered = shared.filter(matches);

  const renderNoteRow = (note, { canManage }) => {
    const selected = note.id === selectedNoteId;
    return (
      <Box
        key={note.id}
        onClick={() => onSelect(note.id)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1.5,
          pr: 0.5,
          py: 0.75,
          cursor: "pointer",
          borderRadius: "4px",
          position: "relative",
          bgcolor: selected ? "custom.primarySoft" : "transparent",
          "&:hover": { bgcolor: selected ? "custom.primarySoft" : "custom.surfaceMuted" },
          "&:hover .note-actions": { opacity: 1 },
        }}
      >
        <FileText
          size={15}
          style={{ flexShrink: 0, opacity: selected ? 1 : 0.65 }}
          color={selected ? accent : "currentColor"}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontWeight: selected ? 600 : 500, lineHeight: 1.3 }}
          >
            {note.title || "Untitled"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {relativeTime(note.updatedAt) || "—"}
          </Typography>
        </Box>
        <IconButton
          className="note-actions"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setNoteMenu({ anchorEl: e.currentTarget, note, canManage });
          }}
          sx={{ opacity: 0, transition: "opacity 120ms" }}
        >
          <MoreHorizontal size={16} />
        </IconButton>
      </Box>
    );
  };

  const SectionLabel = ({ children, action }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        mt: 1.5,
        mb: 0.5,
      }}
    >
      <Typography variant="overline" sx={{ fontSize: 11, color: "text.secondary" }}>
        {children}
      </Typography>
      {action}
    </Box>
  );

  return (
    <Box
      sx={{
        width: fullWidth ? "100%" : SIDEBAR_WIDTH,
        flexShrink: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Top controls */}
      <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.5,
            mb: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "4px",
            bgcolor: "background.default",
          }}
        >
          <Search size={15} style={{ opacity: 0.6, flexShrink: 0 }} />
          <InputBase
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search notes"
            sx={{ fontSize: 13, flex: 1 }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Plus size={16} />}
            onClick={() => onNewNote(null)}
            sx={{ py: 0.6 }}
          >
            New note
          </Button>
          <Tooltip title="New folder">
            <IconButton
              onClick={onNewFolder}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: "4px" }}
            >
              <FolderPlus size={17} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable tree */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {folders.length === 0 && notes.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 1.5, py: 3, textAlign: "center" }}
          >
            No notes yet.
          </Typography>
        )}

        {/* Folders */}
        {folders.map((folder) => {
          const isOpen = !collapsed[folder.id];
          const folderNotes = notesInFolder(folder.id);
          if (q && folderNotes.length === 0) return null;
          return (
            <Box key={folder.id} sx={{ mt: 0.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: "4px",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "custom.surfaceMuted" },
                  "&:hover .folder-actions": { opacity: 1 },
                }}
                onClick={() => toggle(folder.id)}
              >
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
                  {folder.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {folderNotes.length || ""}
                </Typography>
                <IconButton
                  className="folder-actions"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFolderMenu({ anchorEl: e.currentTarget, folder });
                  }}
                  sx={{ opacity: 0, transition: "opacity 120ms", ml: 0.5 }}
                >
                  <MoreHorizontal size={15} />
                </IconButton>
              </Box>
              {isOpen && (
                <Box sx={{ pl: 1.5 }}>
                  {folderNotes.map((n) => renderNoteRow(n, { canManage: true }))}
                  {folderNotes.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5 }}>
                      Empty
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}

        {/* Unfiled */}
        {unfiled.length > 0 && (
          <>
            <SectionLabel>Notes</SectionLabel>
            {unfiled.map((n) => renderNoteRow(n, { canManage: true }))}
          </>
        )}

        {/* Shared */}
        {sharedFiltered.length > 0 && (
          <>
            <SectionLabel>Shared with me</SectionLabel>
            {sharedFiltered.map((n) => renderNoteRow(n, { canManage: false }))}
          </>
        )}

        {/* Trash */}
        {trashed.length > 0 && !q && (
          <Box sx={{ mt: 1.5 }}>
            <Box
              onClick={() => toggle("__trash")}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: "4px",
                cursor: "pointer",
                color: "text.secondary",
                "&:hover": { bgcolor: "custom.surfaceMuted" },
              }}
            >
              {collapsed["__trash"] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
              <Trash2 size={14} />
              <Typography variant="overline" sx={{ fontSize: 11, flex: 1 }}>
                Trash
              </Typography>
              <Typography variant="caption">{trashed.length}</Typography>
            </Box>
            {!collapsed["__trash"] &&
              trashed.map((note) => (
                <Box
                  key={note.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    pl: 1.5,
                    pr: 0.5,
                    py: 0.75,
                    borderRadius: "4px",
                    "&:hover": { bgcolor: "custom.surfaceMuted" },
                    "&:hover .trash-actions": { opacity: 1 },
                  }}
                >
                  <FileText size={15} style={{ flexShrink: 0, opacity: 0.5 }} />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ minWidth: 0, flex: 1, color: "text.secondary" }}
                  >
                    {note.title || "Untitled"}
                  </Typography>
                  <IconButton
                    className="trash-actions"
                    size="small"
                    onClick={(e) => setTrashMenu({ anchorEl: e.currentTarget, note })}
                    sx={{ opacity: 0, transition: "opacity 120ms" }}
                  >
                    <MoreHorizontal size={16} />
                  </IconButton>
                </Box>
              ))}
          </Box>
        )}
      </Box>

      {/* Note menu */}
      <Menu
        anchorEl={noteMenu?.anchorEl}
        open={Boolean(noteMenu)}
        onClose={() => setNoteMenu(null)}
      >
        <MenuItem
          onClick={() => {
            onShareNote(noteMenu.note.id);
            setNoteMenu(null);
          }}
        >
          <ListItemIcon>
            <Users size={16} />
          </ListItemIcon>
          Share
        </MenuItem>
        {noteMenu?.canManage && (
          <MenuItem
            onClick={(e) => {
              setMoveMenu({ anchorEl: e.currentTarget, note: noteMenu.note });
              setNoteMenu(null);
            }}
          >
            <ListItemIcon>
              <FolderInput size={16} />
            </ListItemIcon>
            Move to…
          </MenuItem>
        )}
        {noteMenu?.canManage && (
          <MenuItem
            onClick={() => {
              onRenameNote(noteMenu.note);
              setNoteMenu(null);
            }}
          >
            <ListItemIcon>
              <Pencil size={16} />
            </ListItemIcon>
            Rename
          </MenuItem>
        )}
        {noteMenu?.canManage && <Divider />}
        {noteMenu?.canManage && (
          <MenuItem
            onClick={() => {
              onDeleteNote(noteMenu.note);
              setNoteMenu(null);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <Trash2 size={16} color="currentColor" />
            </ListItemIcon>
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Move-to menu */}
      <Menu
        anchorEl={moveMenu?.anchorEl}
        open={Boolean(moveMenu)}
        onClose={() => setMoveMenu(null)}
      >
        <MenuItem
          onClick={() => {
            onMoveNote(moveMenu.note.id, null);
            setMoveMenu(null);
          }}
        >
          Unfiled
        </MenuItem>
        {folders.map((f) => (
          <MenuItem
            key={f.id}
            onClick={() => {
              onMoveNote(moveMenu.note.id, f.id);
              setMoveMenu(null);
            }}
          >
            {f.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Trash menu */}
      <Menu
        anchorEl={trashMenu?.anchorEl}
        open={Boolean(trashMenu)}
        onClose={() => setTrashMenu(null)}
      >
        <MenuItem
          onClick={() => {
            onRestoreNote(trashMenu.note);
            setTrashMenu(null);
          }}
        >
          <ListItemIcon>
            <RotateCcw size={16} />
          </ListItemIcon>
          Restore
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            onDeleteNoteForever(trashMenu.note);
            setTrashMenu(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Trash2 size={16} color="currentColor" />
          </ListItemIcon>
          Delete forever
        </MenuItem>
      </Menu>

      {/* Folder menu */}
      <Menu
        anchorEl={folderMenu?.anchorEl}
        open={Boolean(folderMenu)}
        onClose={() => setFolderMenu(null)}
      >
        <MenuItem
          onClick={() => {
            onNewNote(folderMenu.folder.id);
            setFolderMenu(null);
          }}
        >
          <ListItemIcon>
            <Plus size={16} />
          </ListItemIcon>
          New note here
        </MenuItem>
        <MenuItem
          onClick={() => {
            onRenameFolder(folderMenu.folder);
            setFolderMenu(null);
          }}
        >
          <ListItemIcon>
            <Pencil size={16} />
          </ListItemIcon>
          Rename
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            onDeleteFolder(folderMenu.folder);
            setFolderMenu(null);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Trash2 size={16} color="currentColor" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
