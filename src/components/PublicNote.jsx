import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography as TypographyExt } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { b64ToU8 } from "../utils/base64";

import "../TiptapFiles/components/tiptap-templates/simple/simple-editor.scss";
import "../TiptapFiles/components/tiptap-node/list-node/list-node.scss";
import "../TiptapFiles/components/tiptap-node/image-node/image-node.scss";
import "../TiptapFiles/components/tiptap-node/code-block-node/code-block-node.scss";
import "../TiptapFiles/components/tiptap-node/paragraph-node/paragraph-node.scss";

// Read-only render of a published note. No auth, no live sync — the content is
// whatever was in the publicShares mirror at publish time.
export default function PublicNote() {
  const { token } = useParams();
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [state, setState] = useState("loading"); // loading | ready | missing
  const [title, setTitle] = useState("");

  useEffect(() => {
    let active = true;
    getDoc(doc(db, "publicShares", token))
      .then((snap) => {
        if (!active) return;
        if (!snap.exists()) {
          setState("missing");
          return;
        }
        const data = snap.data();
        setTitle(data.title || "Untitled");
        if (data.ydocState) Y.applyUpdate(ydoc, b64ToU8(data.ydocState));
        setState("ready");
      })
      .catch((err) => {
        console.error("[public] load failed:", err);
        if (active) setState("missing");
      });
    return () => {
      active = false;
    };
  }, [token, ydoc]);

  const editor = useEditor(
    {
      editable: false,
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({ history: false }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        Image,
        TypographyExt,
        Superscript,
        Subscript,
        Link.configure({ openOnClick: true }),
        Collaboration.configure({ document: ydoc }),
      ],
    },
    [ydoc]
  );

  if (state === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (state === "missing") {
    return (
      <Box sx={{ textAlign: "center", py: 10, px: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Note not available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This link is invalid or the note is no longer shared publicly.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Shared note · Read only
        </Typography>
      </Box>
      <Box className="editor-scroll">
        <div className="editor-document">
          <div className="editor-title-input" style={{ pointerEvents: "none" }}>
            {title}
          </div>
          <EditorContent editor={editor} className="simple-editor-content" />
        </div>
      </Box>
    </Box>
  );
}
