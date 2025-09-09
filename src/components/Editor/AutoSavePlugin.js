import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from "../../firebaseConfig.js";

export default function AutoSavePlugin({ noteId }) {
  const [editor] = useLexicalComposerContext();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      // Clear any previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log("autosaveplugin, noteId:", noteId);
      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        const json = editorState.toJSON();
        updateDoc(doc(db, 'notes', noteId), {
          content: json,
          updatedAt: Date.now(),
        }).catch((error) => {
          console.error('Interval auto-save failed:', error);
        });
      }, 2000); // 2-second timer
    });

    return () => {
      unregister();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, noteId]);

  return null;
}
