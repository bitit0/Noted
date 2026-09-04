import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Origins used to tag Yjs transactions so we don't echo remote/initial state
// back to the network.
const REMOTE_ORIGIN = "firestore-remote";
const INIT_ORIGIN = "firestore-init";

const WS_URL = process.env.REACT_APP_COLLAB_WS_URL || "";
const SAVE_DEBOUNCE_MS = 700;

// --- base64 <-> Uint8Array (Yjs updates are binary) ---
function u8ToB64(u8) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(s);
}
function b64ToU8(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) u8[i] = bin.charCodeAt(i);
  return u8;
}

/**
 * Manages a Yjs document for a single note, synchronized through Firestore.
 *
 * - Firestore is the durable transport AND store: the encoded Yjs state lives in
 *   `notes/{id}.ydocState`. Every client subscribes via onSnapshot and merges
 *   remote updates into its local doc (CRDT merge — conflict-free).
 * - If REACT_APP_COLLAB_WS_URL is set, a y-websocket provider is also attached
 *   for low-latency sync and live-cursor awareness.
 *
 * The consuming editor must be keyed by noteId so this hook mounts fresh per note.
 */
export function useCollaborativeNote(noteId) {
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState(null);
  const [status, setStatus] = useState("connecting"); // connecting | synced | offline
  const [ready, setReady] = useState(false);

  const saveTimer = useRef(null);
  const lastSavedState = useRef(null);

  useEffect(() => {
    if (!noteId) return undefined;

    let cancelled = false;
    const noteRef = doc(db, "notes", noteId);

    const persist = () => {
      const update = Y.encodeStateAsUpdate(ydoc);
      const encoded = u8ToB64(update);
      if (encoded === lastSavedState.current) return;
      lastSavedState.current = encoded;
      setDoc(noteRef, { ydocState: encoded, updatedAt: serverTimestamp() }, { merge: true }).catch(
        (err) => console.error("[collab] persist failed:", err)
      );
    };

    const scheduleSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
    };

    // Save local edits (ignore transactions that originated from the network).
    const onUpdate = (_update, origin) => {
      if (origin === REMOTE_ORIGIN || origin === INIT_ORIGIN) return;
      scheduleSave();
    };
    ydoc.on("update", onUpdate);

    // Load initial state, then subscribe to remote changes.
    (async () => {
      try {
        const snap = await getDoc(noteRef);
        if (cancelled) return;
        const encoded = snap.exists() ? snap.data().ydocState : null;
        if (encoded) {
          lastSavedState.current = encoded;
          Y.applyUpdate(ydoc, b64ToU8(encoded), INIT_ORIGIN);
        }
      } catch (err) {
        console.error("[collab] initial load failed:", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    const unsubscribe = onSnapshot(
      noteRef,
      (snap) => {
        if (snap.metadata.hasPendingWrites) return; // our own optimistic write
        const encoded = snap.exists() ? snap.data().ydocState : null;
        if (!encoded || encoded === lastSavedState.current) return;
        lastSavedState.current = encoded;
        Y.applyUpdate(ydoc, b64ToU8(encoded), REMOTE_ORIGIN);
      },
      (err) => console.error("[collab] snapshot listener failed:", err)
    );

    // Optional websocket layer (live cursors + lower latency).
    let wsProvider = null;
    if (WS_URL) {
      wsProvider = new WebsocketProvider(WS_URL, `note-${noteId}`, ydoc, { connect: true });
      wsProvider.on("status", ({ status: s }) => {
        setStatus(s === "connected" ? "synced" : "offline");
      });
      setProvider(wsProvider);
    } else {
      setStatus("synced");
    }

    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        persist(); // flush pending edits on unmount
      }
      ydoc.off("update", onUpdate);
      unsubscribe();
      if (wsProvider) {
        wsProvider.destroy();
        setProvider(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, ydoc]);

  useEffect(() => {
    return () => ydoc.destroy();
  }, [ydoc]);

  return { ydoc, provider, status, ready };
}
