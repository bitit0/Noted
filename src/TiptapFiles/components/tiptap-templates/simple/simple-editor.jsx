import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

// --- Custom Extensions ---
import { Link } from "../../../components/tiptap-extension/link-extension";
import { Selection } from "../../../components/tiptap-extension/selection-extension";
import { TrailingNode } from "../../../components/tiptap-extension/trailing-node-extension";

// --- UI Primitives ---
import { Button } from "../../../components/tiptap-ui-primitive/button";
import { Spacer } from "../../../components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../../components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "../../../components/tiptap-node/image-upload-node/image-upload-node-extension";
import "../../../components/tiptap-node/code-block-node/code-block-node.scss";
import "../../../components/tiptap-node/list-node/list-node.scss";
import "../../../components/tiptap-node/image-node/image-node.scss";
import "../../../components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "../../../components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "../../../components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "../../../components/tiptap-ui/list-dropdown-menu";
import { BlockQuoteButton } from "../../../components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "../../../components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "../../../components/tiptap-ui/color-highlight-popover";
import { LinkPopover, LinkContent, LinkButton } from "../../../components/tiptap-ui/link-popover";
import { MarkButton } from "../../../components/tiptap-ui/mark-button";
import { TextAlignButton } from "../../../components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "../../../components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "../../../components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "../../../components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "../../../components/tiptap-icons/link-icon";

// --- Hooks ---
import { useMobile } from "../../../hooks/use-mobile";
import { useWindowSize } from "../../../hooks/use-window-size";
import { useCursorVisibility } from "../../../hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "./theme-toggle";

// --- Lib ---
import { MAX_FILE_SIZE } from "../../../lib/tiptap-utils";
import { createNoteImageUploader } from "../../../../components/utils/uploadImage";

// --- Styles ---
import "../../../components/tiptap-templates/simple/simple-editor.scss";
import "./editor-overrides.css";

// --- App integrations ---
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebaseConfig";
import { useCollaborativeNote } from "../../../../hooks/useCollaborativeNote";
import { exportNoteAsMarkdown } from "../../../../components/utils/exportNote";
import VersionHistoryDialog from "../../../../components/notes/VersionHistoryDialog";
import jsPDF from "jspdf";
import { Download, Check, RefreshCw, Users, History } from "lucide-react";

const TITLE_SAVE_MS = 600;

// Stable per-user cursor color from a curated, on-brand palette.
const CURSOR_COLORS = [
  "#C2410C", "#0E7490", "#4D7C0F", "#B45309", "#9333EA", "#BE123C", "#0F766E",
];
function colorForUser(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export function exportNoteAsPDF(title, elementSelector = ".simple-editor-content") {
  const pdf = new jsPDF();
  const contentEl = document.querySelector(elementSelector);
  if (!contentEl) return;
  pdf.html(contentEl, {
    callback: () => pdf.save(`${title || "untitled"}.pdf`),
    x: 12,
    y: 12,
    html2canvas: { scale: 0.32 },
  });
}

const MainToolbarContent = ({ onHighlighterClick, onLinkClick, isMobile }) => (
  <>
    <Spacer />
    <ToolbarGroup>
      <UndoRedoButton action="undo" />
      <UndoRedoButton action="redo" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
      <ListDropdownMenu types={["bulletList", "orderedList", "taskList"]} />
      <BlockQuoteButton />
      <CodeBlockButton />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="bold" />
      <MarkButton type="italic" />
      <MarkButton type="strike" />
      <MarkButton type="code" />
      <MarkButton type="underline" />
      {!isMobile ? <ColorHighlightPopover /> : <ColorHighlightPopoverButton onClick={onHighlighterClick} />}
      {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <MarkButton type="superscript" />
      <MarkButton type="subscript" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <TextAlignButton align="left" />
      <TextAlignButton align="center" />
      <TextAlignButton align="right" />
      <TextAlignButton align="justify" />
    </ToolbarGroup>
    <ToolbarSeparator />
    <ToolbarGroup>
      <ImageUploadButton text="Image" />
    </ToolbarGroup>
    <Spacer />
    {isMobile && <ToolbarSeparator />}
    <ToolbarGroup>
      <ThemeToggle />
    </ToolbarGroup>
  </>
);

const MobileToolbarContent = ({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>
    <ToolbarSeparator />
    {type === "highlighter" ? <ColorHighlightPopoverContent /> : <LinkContent />}
  </>
);

function SaveStatus({ dirty }) {
  return (
    <span className="editor-save-status" data-dirty={dirty ? "true" : "false"}>
      {dirty ? <RefreshCw size={13} className="spin" /> : <Check size={13} />}
      {dirty ? "Saving" : "Saved"}
    </span>
  );
}

export function SimpleEditor({ noteId, userId, username, editable = true }) {
  const isMobile = useMobile();
  const windowSize = useWindowSize();
  const [mobileView, setMobileView] = useState("main");
  const toolbarRef = useRef(null);

  const { ydoc, provider, status, ready } = useCollaborativeNote(noteId);

  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const titleTimer = useRef(null);
  const snapshotTimer = useRef(null);
  const uploader = useRef(createNoteImageUploader(noteId));
  const legacyContent = useRef(null); // pre-Yjs content, for one-time migration
  const canSeed = useRef(false);
  const seeded = useRef(false);

  // Load the note's title + any legacy content once on mount.
  useEffect(() => {
    let active = true;
    getDoc(doc(db, "notes", noteId)).then((snap) => {
      if (!active || !snap.exists()) return;
      const data = snap.data();
      setTitle(data.title || "");
      // Only the owner migrates legacy content, to avoid duplicate seeding.
      if (!data.ydocState && data.content && data.userId === userId) {
        legacyContent.current = data.content;
        canSeed.current = true;
      }
    });
    return () => {
      active = false;
    };
  }, [noteId, userId]);

  const persistMeta = (fields) =>
    setDoc(doc(db, "notes", noteId), { ...fields, updatedAt: serverTimestamp() }, { merge: true })
      .catch((err) => console.error("[editor] meta save failed:", err))
      .finally(() => setDirty(false));

  const handleTitleChange = (value) => {
    setTitle(value);
    setDirty(true);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => persistMeta({ title: value.trim() }), TITLE_SAVE_MS);
  };

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Note content. Start typing to write.",
        },
      },
      extensions: [
        StarterKit.configure({ history: false }), // history is owned by Collaboration
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        Image,
        Typography,
        Superscript,
        Subscript,
        Selection,
        Placeholder.configure({ placeholder: "Start writing…" }),
        ImageUploadNode.configure({
          accept: "image/*",
          maxSize: MAX_FILE_SIZE,
          limit: 3,
          upload: (file, onProgress, signal) => uploader.current(file, onProgress, signal),
          onError: (error) => console.error("Image upload failed:", error),
        }),
        TrailingNode,
        Link.configure({ openOnClick: false }),
        Collaboration.configure({ document: ydoc }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: { name: username || "Anonymous", color: colorForUser(userId) },
              }),
            ]
          : []),
      ],
      onCreate: ({ editor: ed }) => {
        const text = ed.getText().trim();
        setWordCount(text ? text.split(/\s+/).length : 0);
      },
      onUpdate: ({ editor: ed }) => {
        setDirty(true);
        const text = ed.getText().trim();
        setWordCount(text ? text.split(/\s+/).length : 0);
        if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
        snapshotTimer.current = setTimeout(() => {
          const text = ed.getText();
          // snapshot = short preview; searchText = fuller body for search.
          // ponytail: 20k-char cap bounds the notes-list payload; a real
          // search index is the upgrade past that.
          persistMeta({ snapshot: text.slice(0, 240), searchText: text.slice(0, 20000) });
        }, TITLE_SAVE_MS);
      },
    },
    [ydoc, provider, editable]
  );

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    if (!isMobile && mobileView !== "main") setMobileView("main");
  }, [isMobile, mobileView]);

  // One-time migration: if a note predates Yjs and its collaborative doc is
  // still empty, seed it from the old stored content so nothing is lost.
  useEffect(() => {
    if (!editor || !ready || seeded.current || !canSeed.current) return;
    const timer = setTimeout(() => {
      if (seeded.current) return;
      seeded.current = true;
      if (editor.isEmpty && legacyContent.current) {
        try {
          editor.commands.setContent(legacyContent.current, true);
        } catch (err) {
          console.error("[editor] legacy content migration failed:", err);
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [editor, ready]);

  useEffect(
    () => () => {
      if (titleTimer.current) clearTimeout(titleTimer.current);
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    },
    []
  );

  if (!editor) return <div className="editor-loading">Loading editor…</div>;

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="editor-shell">
        {editable && (
          <Toolbar
            ref={toolbarRef}
            style={isMobile ? { bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)` } : {}}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        )}

        <div className="editor-meta-bar">
          <div className="editor-meta-left">
            <SaveStatus dirty={dirty} />
            {provider && (
              <span className="editor-conn" data-status={status}>
                <Users size={13} />
                {status === "synced" ? "Live" : "Offline"}
              </span>
            )}
          </div>
          <div className="editor-meta-right">
            <span className="editor-wordcount">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <button
              type="button"
              className="editor-export-btn"
              onClick={() => setShowHistory(true)}
            >
              <History size={14} /> History
            </button>
            <button
              type="button"
              className="editor-export-btn"
              onClick={() => exportNoteAsMarkdown(title || "untitled", editor.getText())}
            >
              <Download size={14} /> .md
            </button>
            <button
              type="button"
              className="editor-export-btn"
              onClick={() => exportNoteAsPDF(title || "untitled")}
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>

        <div className="editor-scroll">
          <div className="editor-document">
            <input
              className="editor-title-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              spellCheck="false"
              readOnly={!editable}
            />
            <EditorContent editor={editor} role="presentation" className="simple-editor-content" />
          </div>
        </div>
      </div>

      <VersionHistoryDialog
        open={showHistory}
        noteId={noteId}
        canEdit={editable}
        title={title}
        userId={userId}
        username={username}
        getCurrentHtml={() => editor.getHTML()}
        onRestore={(html) => {
          editor.commands.setContent(html, true);
          setDirty(true);
        }}
        onClose={() => setShowHistory(false)}
      />
    </EditorContext.Provider>
  );
}
