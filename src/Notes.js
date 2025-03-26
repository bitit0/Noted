import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { doc, addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { collection, where, query, Timestamp, arrayUnion } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import { getAuth } from "firebase/auth";

const Notes = () => {
    
    const { user } = useAuth();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [collaboratorEmail, setCollaboratorEmail] = useState("");

    const fetchNotes = async () => {
        if (!user) return;
        
        const personalNotesQuery = query(
            collection(db, "notes"),
            where("userId", "==", user.uid)
        );

        const personalNotesSnapshot = await getDocs(personalNotesQuery); // Snapshot personal notes

        const personalNotes = personalNotesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const collaborativeNotesQuery = query(
            collection(db, "notes"),
            where("collaborators", "array-contains", user.uid)
        );
        const collaborativeNotesSnapshot = await getDocs(collaborativeNotesQuery);
        const collaborativeNotes = collaborativeNotesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        const allNotes = [...personalNotes, ...collaborativeNotes];
        
        // Remove duplicate notes
        const uniqueNotes = Array.from(new Set(allNotes.map((a) => a.id)))
            .map((id) => allNotes.find((a) => a.id === id));

        setNotes(uniqueNotes);
    }

    const handleCreateNote = async (e) => {
        e.preventDefault();

        if (!user) return;

        const newNote = {
            title: title,
            content: content,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
            userId: user.uid, // Author of note
            collaborators: []
        };

        try {
            await addDoc(collection(db, "notes"), newNote);
            setTitle("");
            setContent("");
        } catch (error) {
            console.error("Error creating note: ", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingNote) {
            // Update existing note
            const noteRef = doc(db, "notes", editingNote.id);
            await updateDoc(noteRef, { title, content, updatedAt: Timestamp.fromDate(new Date()) });
            setEditingNote(null);
        } else {
            // Create new note
            const newNote = {
                title,
                content,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
                userId: user.uid,
                collaborators: []
            };
            const notesCollection = collection(db, "notes");
            await addDoc(notesCollection, newNote);
        }
        setTitle("");
        setContent("");
        fetchNotes();
    };
    
    const handleEdit = (note) => {
        setTitle(note.title);
        setContent(note.content);
        setEditingNote(note);
    }

    const handleDelete = async (noteId) => {
        try {
            const noteRef = doc(db, "notes", noteId);
            await deleteDoc(noteRef);
            setNotes(notes.filter(note => note.id !== noteId)); // Update page for deletion of note
        } catch (error) {
            console.error("Error deleting note: ", noteId);
        }
    };

    const handleAddCollaborator = async (noteId) => {
        
        const data = await getUserUidByEmail(collaboratorEmail);
        const collaboratorUid = String(data.uid);

        console.log("collab uid: ", collaboratorUid);

        if (!collaboratorUid) {
            console.error("User not found.")
            return;
        }

        try {
            await updateDoc(doc(db, "notes", noteId), {
                collaborators: arrayUnion(collaboratorUid),
            });
            setCollaboratorEmail("");
            console.log("Collaborator added.")
        } catch (error) {
            console.error("Error adding user as collaborator: ", error)
        }
    }

    // Helper functions

    const getUserUidByEmail = async (email) => {
        
        try {
            const response = await fetch("http://localhost:3001/get-uid", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching UID: ", error);
        }

    }

    useEffect(() => {

        if (user) {

            fetchNotes();
            // 5 second interval to check for new/edited notes
            const interval = setInterval(() => {
                fetchNotes();
            }, 5000);

            // cleanup on unmount, prevents unnecessary refreshes
            return () => clearInterval(interval);
        }

    }, [user]);

    return (
        <div>
            <h1>Your Notes</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <textarea
                    placeholder="Content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                ></textarea>
                { editingNote &&
                    <div>
                        <input
                            type="email"
                            placeholder="Enter collaborator's email"
                            value={collaboratorEmail}
                            onChange={(e) => setCollaboratorEmail(e.target.value)}
                        />
                        <button type="button" onClick={() => handleAddCollaborator(editingNote?.id)}>Add Collaborator</button>
                    </div>
                }
                <button type="submit">{editingNote ? "Update Note" : "Create Note"}</button>
            </form>

            <h2>Your Notes:</h2>
            {notes.length === 0 ? (
                <p>No notes found. Create one to get started!</p>
            ) : (
                <ul>
                    {notes.map((note) => (
                        <li key={note.id}>
                            <h3>{note.title}</h3>
                            <p>{note.content}</p>
                            <button onClick={() => handleEdit(note)}>Edit</button>
                            {note.userId === user.uid && (
                                <button onClick={() => handleDelete(note.id)}>Delete</button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Notes;