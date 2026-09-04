import { useEffect, useState } from "react";
import { SimpleEditor } from "../../TiptapFiles/components/tiptap-templates/simple/simple-editor";
import { getUserProfile } from "../utils/getUserProfile";
import { useAuth } from "../../context/AuthContext";

const Tiptap = ({ noteId, userId }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) return;
      const profile = await getUserProfile(user.uid);
      if (active) setUsername(profile?.displayName || user.email || "Anonymous");
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (!username || !noteId) return <div className="editor-loading">Loading…</div>;

  // key forces a fresh editor + collaboration doc whenever the note changes.
  return <SimpleEditor key={noteId} noteId={noteId} userId={userId} username={username} />;
};

export default Tiptap;
