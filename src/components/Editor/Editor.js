import React, { useEffect, useState, useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState } from 'lexical';
import ToolbarPlugin from './ToolbarPlugin';
import AutoSavePlugin from './AutoSavePlugin';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AutoStylePlugin from './AutoStylePlugin';

import './Editor.css';


const theme = {
  paragraph: 'editor-paragraph',
};

const Editor = ({ noteId }) => {

  const [initialEditorState, setInitialEditorState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('');
  const [titleDebounceTimeout, setTitleDebounceTimeout] = useState(null);

  // Fetch note from Firestore on mount or noteId change
  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;

      try {
        const noteRef = doc(db, 'notes', noteId);
        const noteSnap = await getDoc(noteRef);

        if (noteSnap.exists()) {
          const data = noteSnap.data();
          if (data?.title) {
            setNoteTitle(data.title);
          }
          if (data && data.content) {
            setInitialEditorState(() => (editor) => {
              const editorState = editor.parseEditorState(data.content);
              editor.setEditorState(editorState);
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch note:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  const initialConfig = {

    namespace: 'MyEditor',
    theme,
    onError: (error) => {
      console.error('Lexical error:', error);
    },
    editorState: initialEditorState ?? undefined,

  };

  // Prevent rendering LexicalComposer until loading is complete
  if (loading) return <div>Loading editor...</div>;

  const handleChange = (editorState) => {

    editorState.read(() => {
      const json = editorState.toJSON();
      console.log('Editor State:', json);
    });

  };

  const updateTitleInFirestore = async (id, newTitle) => {
    try {
      const noteRef = doc(db, 'notes', id);
      await updateDoc(noteRef, { title: newTitle });
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>

      <input
        className="note-title-input"
        value={noteTitle}
        onChange={(e) => {
          const newTitle = e.target.value;
          setNoteTitle(newTitle);

          if (titleDebounceTimeout) {
            clearTimeout(titleDebounceTimeout);
          }

          const timeout = setTimeout(() => {
            updateTitleInFirestore(noteId, newTitle);
          }, 500); // 500ms debounce

          setTitleDebounceTimeout(timeout);
        }}
        placeholder="Untitled Note"
      />

      <div className="editor-wrapper">
        
        <ToolbarPlugin />
        <AutoStylePlugin />
        <AutoSavePlugin noteId={noteId}/>
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Enter some text…</div>}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin onChange={(editorState) => {
          editorState.read(() => {
            const json = editorState.toJSON();
            console.log('Editor State:', json);
          });
        }} />
      </div>
    </LexicalComposer>

  );
};

export default Editor;