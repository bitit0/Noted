import { SimpleEditor } from '../../TiptapFiles/components/tiptap-templates/simple/simple-editor'
import { useState, useEffect } from "react";
import { getUserProfile } from "../utils/getUserProfile";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebaseConfig"

const Tiptap = ({ noteId, userId }) => {

    const [user] = useAuthState(auth);
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const fetchUsername = async () => {
        if (user) {
            const profile = await getUserProfile(user.uid);
            setUsername(profile?.displayName || user.email || "Anonymous");
        }
        };

        fetchUsername();
    }, [user]);

    if (!username || !noteId) return <div>Loading...</div>;
    

    return <SimpleEditor noteId={noteId} userId={userId} username={username}/>
}

export default Tiptap
