import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem } from "@tiptap/extension-task-item"
import { TaskList } from "@tiptap/extension-task-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Underline } from "@tiptap/extension-underline"

// --- Custom Extensions ---
import { Link } from "../../../components/tiptap-extension/link-extension"
import { Selection } from "../../../components/tiptap-extension/selection-extension"
import { TrailingNode } from "../../../components/tiptap-extension/trailing-node-extension"

// --- UI Primitives ---
import { Button } from "../../../components/tiptap-ui-primitive/button"
import { Spacer } from "../../../components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../../components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "../../../components/tiptap-node/image-upload-node/image-upload-node-extension"
import "../../../components/tiptap-node/code-block-node/code-block-node.scss"
import "../../../components/tiptap-node/list-node/list-node.scss"
import "../../../components/tiptap-node/image-node/image-node.scss"
import "../../../components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "../../../components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "../../../components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "../../../components/tiptap-ui/list-dropdown-menu"
import { BlockQuoteButton } from "../../../components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "../../../components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "../../../components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "../../../components/tiptap-ui/link-popover"
import { MarkButton } from "../../../components/tiptap-ui/mark-button"
import { TextAlignButton } from "../../../components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "../../../components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "../../../components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "../../../components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "../../../components/tiptap-icons/link-icon"

// --- Hooks ---
import { useMobile } from "../../../hooks/use-mobile"
import { useWindowSize } from "../../../hooks/use-window-size"
import { useCursorVisibility } from "../../../hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "./theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "../../../lib/tiptap-utils"

// --- Styles ---
import "../../../components/tiptap-templates/simple/simple-editor.scss"

import content from "../../../components/tiptap-templates/simple/data/content.json"

import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useYjs } from '@tiptap/extension-collaboration'
import Collaboration from '@tiptap/extension-collaboration'

import { useEffect, useState } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../../../firebaseConfig'
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import { useTheme } from "@mui/material";
import { exportNoteAsMarkdown } from "../../../../components/utils/exportNote"
//import { exportNoteAsPDF } from "../../../../components/utils/exportPDF"
import jsPDF from "jspdf"

const ydoc = new Y.Doc()

var globalNoteId = null;

const provider = new WebsocketProvider('ws://localhost:1234', globalNoteId, ydoc)

const yXmlFragment = ydoc.getXmlFragment('prosemirror')

const AUTO_SAVE_INTERVAL = 3000;



export function exportNoteAsPDF(title, elementSelector = ".simple-editor-content") {
  const doc = new jsPDF();

  const contentEl = document.querySelector(elementSelector);
  if (!contentEl) {
    console.error("Editor content element not found.");
    return;
  }

  doc.html(contentEl, {
    callback: () => {
      doc.save(`${title || "untitled"}.pdf`);
    },
    x: 10,
    y: 10,
    html2canvas: {
      scale: 0.3, // Adjust to make it fit better
    }
  });
}


const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  editor,
  noteId
}) => {
  return (
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
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
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
        <ImageUploadButton text="Add" />
      </ToolbarGroup>
      <ToolbarGroup>
        <Button
          onClick={() => {
            const plainText = editor?.getText() || "";
            exportNoteAsMarkdown(noteId || "untitled", plainText);
          }}
        >
          Export as .md
        </Button>
        <Button
          onClick={() => {
            exportNoteAsPDF(noteId || "untitled");
          }}
        >
          Export as PDF
        </Button>
      </ToolbarGroup>
      <Spacer />
      {isMobile && <ToolbarSeparator />}
      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
}

const MobileToolbarContent = ({
  type,
  onBack
}) => (
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

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({ noteId, userId, username }) {
  const isMobile = useMobile()
  const windowSize = useWindowSize()
  const [mobileView, setMobileView] = React.useState("main")
  const toolbarRef = React.useRef(null)
  const [editorContent, setEditorContent] = useState(null)
  const lastSavedRef = React.useRef(null);
  const [initialContent, setInitialContent] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  globalNoteId = noteId;

  const editor = useEditor(
    initialContent === undefined ? undefined : {
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
    },
    extensions: [
      StarterKit,
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
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      TrailingNode,
      Link.configure({ openOnClick: false }),
      Collaboration.configure({ 
        document: ydoc
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: username,
          color: '#ffa500',
        }
      })
    ],
    content: content,
    onUpdate({ editor }) {
      const json = editor.getJSON();
      setEditorContent(json);
    },
  })

  useEffect(() => {
    if (!noteId || !editor) return;

    const fetchNote = async () => {
      try {
        const noteRef = doc(db, 'notes', noteId);
        const noteSnap = await getDoc(noteRef);
        if (noteSnap.exists()) {
          const data = noteSnap.data();
          const newContent = data?.content ?? { type: 'doc', content: [] };

          editor.commands.setContent(newContent);
          setEditorContent(newContent);
          lastSavedRef.current = newContent;
        } else {
          const emptyDoc = { type: 'doc', content: [] };
          editor.commands.setContent(emptyDoc);
          setEditorContent(emptyDoc);
          lastSavedRef.current = emptyDoc;
        }
      } catch (err) {
        console.error("Failed to fetch note:", err);
      }
    };
    fetchNote();
  }, [noteId, editor]);

  React.useEffect(() => {
    if (!editorContent || !noteId || !userId) {
      console.log("failed to save")
      return;
    }

    const interval = setInterval(() => {
      if (JSON.stringify(editorContent) === JSON.stringify(lastSavedRef.current)) {
        return; 
      }

      const noteRef = doc(db, 'notes', noteId);
      setDoc(noteRef, {
        userId,
        content: editorContent,
        updatedAt: Date.now(),
      }, { merge: true });

      lastSavedRef.current = editorContent;
      console.log('[AutoSave] Note saved');
    }, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, [editorContent, noteId, userId]);

  const bodyRect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  if (!editor) return <div>Loading editor...</div>;

  return (
    <EditorContext.Provider value={{ editor }}>
      <Toolbar
        ref={toolbarRef}
        style={
          isMobile
            ? {
                bottom: `calc(100% - ${windowSize.height - bodyRect.y}px)`,
              }
            : {}
        }>
        {mobileView === "main" ? (
          <MainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
            editor={editor}
            noteId={noteId} />
        ) : (
          <MobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")} />
        )}
      </Toolbar>
      <div className="content-wrapper">
        <EditorContent editor={editor} role="presentation" className={`simple-editor-content ${isDark ? "editor-dark" : ""}`} />
      </div>
    </EditorContext.Provider>
  );
}
