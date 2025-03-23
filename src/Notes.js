import React, { useState, useEffect } from "react";
import { db } from "./firebaseConfig";
import { doc, addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { collection, where, query, Timestamp } from "firebase/firestore";

const Notes = () => {
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);

    const testuserid = "testuserid";

    const handleCreateNote = async (e) => {
        e.preventDefault();

        const newNote = {
            title: title,
            content: content,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date())
        };

        try {
            const docRef = await addDoc(collection(db, "users", testuserid, "notes"), newNote);
            console.log("New note created with ID: ", docRef.id);

            setTitle("");
            setContent("");
        } catch (error) {
            console.error("Error creating note: ", error);
        }
    };

    const fetchNotes = async () => {
        const notesCollection = collection(db, "users", testuserid, "notes");
        const q = query(notesCollection);

        try {
            const querySnapshot = await getDocs(q);
            const notesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setNotes(notesList);
        } catch (error) {
            console.error ("Error fetching notes: ", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editingNote) {
            // Update existing note
            const noteRef = doc(db, "users", testuserid, "notes", editingNote.id);
            await updateDoc(noteRef, { title, content });
            setEditingNote(null);
        } else {
            // Create new note
            const notesCollection = collection(db, "users", testuserid, "notes");
            await addDoc(notesCollection, { title, content });
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
            const noteRef = doc(db, "users", testuserid, "notes", noteId);
            await deleteDoc(noteRef);
            setNotes(notes.filter(note => note.id !== noteId)); // Update page for deletion of note
        } catch (error) {
            console.error("Error deleting note: ", noteId);
        }
    };

    useEffect(() => {
        // Initital fetch on page load
        fetchNotes();

        // 5 second interval to check for new/edited notes
        const interval = setInterval(() => {
            fetchNotes();
        }, 5000);

        // cleanup on unmount, prevents unnecessary refreshes
        return () => clearInterval(interval);

    }, []);

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
                            <button onClick={() => handleDelete(note.id)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                )}
        </div>
        
      );
}

export default Notes;