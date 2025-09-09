import React, { useState, useEffect, useCallback } from "react";
import { db } from "./firebaseConfig";
import { doc, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot, getDoc } from "firebase/firestore";
import { collection, where, query, Timestamp, arrayUnion } from "firebase/firestore";
import { useAuth } from "./context/AuthContext";
import { getAuth } from "firebase/auth";
import Logout from "./components/Logout";
import _ from "lodash";
import NotesNavbar from "./components/NotesNavbar";
import { Box, Typography, List, ListItem, ListItemText, Button, Divider } from '@mui/material';
import { Collapse, ListItemIcon } from '@mui/material';
import { ExpandLess, ExpandMore, Folder } from '@mui/icons-material';
import Editor from './components/Editor/Editor.js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import Tiptap from "./components/TiptapEditor/Tiptap.js";
import { useTheme } from "@mui/material";




const Notes = () => {
    
    const { user } = useAuth();

    const theme = useTheme();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [notes, setNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [collaboratorEmail, setCollaboratorEmail] = useState("");
    const [text, setText] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [openFolders, setOpenFolders] = useState({});
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState("");
    const [newName, setNewName] = useState("");
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [dialogTitle, setDialogTitle] = useState("");
    const [dialogTextField, setDialogTextField] = useState("");
    const [sharedNotes, setSharedNotes] = useState("");
    const [displayName, setDisplayname] = useState("");

    const openDialog = (type) => {
        setDialogType(type);
        setIsDialogOpen(true);
        switch (type) {
            case "folder":
                setDialogTitle("Create Folder");
                setDialogTextField("Folder Name");
                break;
            case "file":
                setDialogTitle("Create File");
                setDialogTextField("File Name");
                break;
            case "collab":
                setDialogTitle("Add Collaborator");
                setDialogTextField("Collaborator Email");
                break;
        }
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setNewName("");
    };

    const [folders, setFolders] = useState([
        { id: '1', name: 'Work', parentId: null },
        { id: '2', name: 'Personal', parentId: null }
    ]);

    const handleNoteClick = (note) => {
        setSelectedNoteId(note.id);
    };

    const toggleFolder = (id) => {
        setOpenFolders(prev => {
            const newState = { ...prev, [id]: !prev[id] };
            console.log("toggleFolder state:", newState);
            return newState;
        });
    };

    const handleCreateNote = async (name) => {
        if (!name || !user) return;

        try {
            const fileRef = await addDoc(collection(db, "notes"), {
                title: name,
                content: "",
                folderId: selectedFolderId,
                createdAt: Timestamp.fromDate(new Date()),
                updatedAt: Timestamp.fromDate(new Date()),
                userId: user.uid,
                collaborators: [],
            });

            console.log("Created file!");
        } catch (error) {
            console.error("Error creating note: ", error);
        }
    };

    const handleCreateFolder = async (name, parentId = null) => {

        if (!name || !user) return;

        try {
            const folderRef = await addDoc(collection(db, "folders"), {
                name,
                parentId,
                createdAt: Timestamp.fromDate(new Date()),
                createdBy: user.uid,
            });

            setFolders(prev => [...prev, { id: folderRef.id, name, parentId: null }]);

            console.log("Folder created successfully.");
          } catch (error) {
            console.error("Error creating folder: ", error.message);
          }
    }

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     if (editingNote) {
    //         // Update existing note
    //         const noteRef = doc(db, "notes", editingNote.id);
    //         await updateDoc(noteRef, { title, content, updatedAt: Timestamp.fromDate(new Date()) });
    //         setEditingNote(null);
    //     } else {
    //         // Create new note
    //         const newNote = {
    //             title,
    //             content,
    //             createdAt: Timestamp.fromDate(new Date()),
    //             updatedAt: Timestamp.fromDate(new Date()),
    //             userId: user.uid,
    //             collaborators: []
    //         };
    //         const notesCollection = collection(db, "notes");
    //         await addDoc(notesCollection, newNote);
    //     }
    //     setTitle("");
    //     setContent("");
    //     fetchNotes();
    // };

    const handleDialogSubmit = async () => {
        if (dialogType === "folder") {
            await handleCreateFolder(newName);
        } else if (dialogType === "file") {
            await handleCreateNote(newName);
        } else {
            setCollaboratorEmail(newName);
            await handleAddCollaborator(selectedNoteId, newName);
        }
        closeDialog();
    };
    
    // const handleEdit = (note) => {
    //     setTitle(note.title);
    //     setContent(note.content);
    //     setEditingNote(note);
    // }

    const handleDelete = async (noteId) => {
        try {
            const noteRef = doc(db, "notes", noteId);
            await deleteDoc(noteRef);
            setNotes(notes.filter(note => note.id !== noteId)); // Update page for deletion of note
        } catch (error) {
            console.error("Error deleting note: ", noteId);
        }
    };

    const handleAddCollaborator = async (noteId, email) => {
        console.log("col ema", email)
        
        const data = await getUserUidByEmail(email);
        const collaboratorUid = String(data.uid);

        console.log("collab uid: ", collaboratorUid);
        console.log("note id: ", noteId);

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

    

    const handleChange = (e) => {
        setText(e.target.value);
        //updateNote(e.target.value);
    }

    // const updateNote = useCallback(
    //     _.debounce(async (noteId, newText) => {
    //         if (!noteId) {
    //             console.error("noteId is undefined");
    //             return;
    //         }
    //         const noteRef = doc(db, "notes", noteId);
    //         await updateDoc(noteRef, { content: newText });
    //     }, 300),
    //     []
    // );

    // Helper functions

    const getUserUidByEmail = async (email) => {
        console.log("Sending email:", email); 
        
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

    async function fetchUserNotes(userId) {
        console.log("Fetching user notes");
        const notesRef = collection(db, "notes");

        const sharedQuery = query(notesRef,
            where("collaborators", "array-contains-any", [user.uid])
        );

        const ownedQuery = query(notesRef, where("userId", "==", user.uid));

        const [ownedSnap, collabSnap] = await Promise.all([
            getDocs(ownedQuery),
            getDocs(sharedQuery),
        ]);

        const allNotes = [
            ...ownedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...collabSnap.docs
            .filter(doc => doc.data().userId !== userId) // prevent duplicate if you're also in collaborators
            .map(doc => ({ id: doc.id, ...doc.data() }))
        ];

        console.log(allNotes);
        setNotes(allNotes);
        console.log(notes);
        setSharedNotes(collabSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    useEffect( () => {

        if (!user) return;

        // Fetch folders
        const foldersRef = collection(db, "folders");
        const foldersQuery = query(foldersRef, where("createdBy", "==", user.uid));
        const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
            const folderData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFolders(folderData);

            setOpenFolders((prev) => {
                const updated = { ...prev };
                folderData.forEach(folder => {
                    if (!(folder.id in updated)) {
                        updated[folder.id] = true;
                    }
                });
                return updated;
            });
        });

        // // Fetch notes
        // const notesRef = collection(db, "notes");
        // const notesQuery = query(notesRef, where("userId", "==", user.uid));
        // const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
        //     const noteData = snapshot.docs.map((doc) => ({
        //         id: doc.id,
        //         ...doc.data(),
        //     }));
        //     setNotes(noteData);
        // });

        fetchUserNotes();

        return () => {
            unsubscribeFolders();
            //unsubscribeNotes();
        };

    }, [user]);


    // return (
    //     <div>
    //         <form onSubmit={handleSubmit}>
    //             <input
    //                 type="text"
    //                 placeholder="Title"
    //                 value={title}
    //                 onChange={(e) => setTitle(e.target.value)}
    //                 required
    //             />
    //             <textarea
    //                 placeholder="Content"
    //                 value={content}
    //                 onChange={(e) => setContent(e.target.value)}
    //                 required
    //             ></textarea>
    //             { editingNote &&
    //                 <div>
    //                     <input
    //                         type="email"
    //                         placeholder="Enter collaborator's email"
    //                         value={collaboratorEmail}
    //                         onChange={(e) => setCollaboratorEmail(e.target.value)}
    //                     />
    //                     <button type="button" onClick={() => handleAddCollaborator(editingNote?.id)}>Add Collaborator</button>
    //                 </div>
    //             }
    //             <button type="submit">{editingNote ? "Update Note" : "Create Note"}</button>
    //         </form>

    //         <h2>Your Notes:</h2>
    //         {notes.length === 0 ? (
    //             <p>No notes found. Create one to get started!</p>
    //         ) : (
    //             <ul>
    //                 {notes.map((note) => (
    //                     <li key={note.id}>
    //                         <h3>{note.title}</h3>
    //                         <p>{note.content}</p>
    //                         <button onClick={() => handleEdit(note)}>Edit</button>
    //                         {note.userId === user.uid && (
    //                             <button onClick={() => handleDelete(note.id)}>Delete</button>
    //                         )}
    //                     </li>
    //                 ))}
    //             </ul>
    //         )}
    //     </div>
    // );

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* Sidebar */}
          <Box sx={{ width: '300px', bgcolor: 'background.paper', color: 'text.primary', p: 2, borderRight: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" gutterBottom>Folders</Typography>
            <List>
                {folders.map(folder => {
                    const isOpen = openFolders[folder.id]; // open by default
                    return (
                        <Box key={folder.id}>
                            <ListItem button onClick={() => {
                                toggleFolder(folder.id);
                                setSelectedFolderId(folder.id);
                            }}>
                                <ListItemIcon><Folder /></ListItemIcon>
                                <ListItemText primary={folder.name} />
                                {isOpen ? <ExpandLess /> : <ExpandMore />}
                            </ListItem>
                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            {
                            notes
                                .filter((note) => note.folderId === folder.id)
                                .map((note) => (
                                <ListItem
                                    button
                                    key={note.id}
                                    onClick={() => handleNoteClick(note)}
                                    sx={{
                                    pl: 6,
                                    backgroundColor:
                                        selectedNoteId === note.id ? "rgba(0, 0, 0, 0.1)" : "transparent"
                                    }}
                                >
                                    <ListItemText primary={note.title || note.name} />
                                </ListItem>
                            ))} 
                            </Collapse>
                        </Box>
                    );
                })}
                <h2>Shared with Me</h2>
                {Array.isArray(sharedNotes) ? sharedNotes.map(note => <ListItem
                                    button
                                    key={note.id}
                                    onClick={() => handleNoteClick(note)}
                                    sx={{
                                    pl: 6,
                                    backgroundColor:
                                        selectedNoteId === note.id ? "rgba(0, 0, 0, 0.1)" : "transparent"
                                    }}
                                >
                                    <ListItemText primary={note.title || note.name} />
                                </ListItem>) : "ahaha"}
            </List>
            <Divider sx={{ my: 2 }} />
            <Button variant="outlined" fullWidth onClick={() => openDialog("folder")}>
                Create Folder
            </Button>
            <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => openDialog("file")}>
                Create File
            </Button>
            <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => openDialog("collab")}>
                Add Collaborator
            </Button>
          </Box>
    
          {/* Main Content Area */}
          <Box sx={{ flexGrow: 1, p: 4 }}>
            {selectedNoteId ? (
              <>
                {/* <Typography variant="h5">{selectedNoteId.title}</Typography> */}
                {/* <Editor noteId={selectedNoteId}/> */}
                <Tiptap noteId={selectedNoteId} userId={user.uid} />
              </>
            ) : (
              <Typography variant="h6">Select a file to begin</Typography>
            )}
          </Box>
          <Dialog open={isDialogOpen} onClose={closeDialog}>
            <DialogTitle>
                {dialogTitle}
                <IconButton
                aria-label="close"
                onClick={closeDialog}
                sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <TextField
                autoFocus
                margin="dense"
                label={dialogTextField}
                type="text"
                fullWidth
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={closeDialog}>Cancel</Button>
                {dialogType !== "collab" ? <Button onClick={handleDialogSubmit} disabled={!newName.trim()}>
                Create
                </Button> :
                <Button onClick={handleDialogSubmit}>Invite</Button>
                }
                
            </DialogActions>
            </Dialog>
        </Box>
        
      );
}

export default Notes;