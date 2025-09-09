import { useEffect, useState, ChangeEvent } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db, storage } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { useAuthState } from "react-firebase-hooks/auth"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";

interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: number;
  photoURL: string;
}


export default function Profile() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);


  useEffect(() => {

    const fetchOrCreateProfile = async () => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as Partial<UserProfile>;
        setProfile({
          displayName: data.displayName || "Anonymous",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          createdAt: data.createdAt || Date.now(),
          photoURL: data.photoURL || "",
        });
      } else {

        const newProfile = {
          displayName: user.displayName || "Anonymous",
          firstName: "John",
          lastName: "Smith",
          email: user.email,
          createdAt: Date.now(),
          photoURL: "",
        };

        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      }

      setProfileLoading(false);
    };

    if (user) fetchOrCreateProfile();

  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0];
    const user = auth.currentUser;
    if (!user || !file) {
      console.error("Missing user or file");
      return;
    }

    try {
      setUploading(true);

      // Optional: Get the extension
      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };

      const ext = mimeToExt[file.type];
      if (!ext) {
        alert("Only JPG, PNG, or WebP images are supported.");
        return;
      }

      // New path: profile_pictures/{uid}/profile.jpg
      const filePath = `profile_pictures/${user.uid}/profile.${ext}`;
      const fileRef = ref(storage, filePath);

      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      setProfile(prev => ({ ...prev, photoURL: url }));

      console.log("Upload complete:", filePath);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };


  const saveProfile = async () => {
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      displayName: profile.displayName,
    });
    setSuccessAlert(true);
  };

  

  if (loading || profileLoading) return <div>Loading...</div>;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          {profile.firstName} {profile.lastName}
        </Typography>
        <Typography variant="h6" gutterBottom textAlign="center">
          {profile.displayName}
        </Typography>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={1}
          mb={3}
        >
          <Avatar
            src={profile.photoURL}
            sx={{ width: 100, height: 100 }}
          >
            {profile.displayName?.[0]?.toUpperCase()}
          </Avatar>

          <label htmlFor="upload-photo">
            <input
              style={{ display: "none" }}
              accept="image/*"
              id="upload-photo"
              type="file"
              onChange={handleImageUpload}
            />
            <Button variant="outlined" component="span">
              Upload Profile Picture
            </Button>
          </label>

          {uploading && (
            <Typography variant="body2" color="text.secondary">
              Uploading...
            </Typography>
          )}
        </Box>

        {uploading && (
          <Typography color="text.secondary">Uploading photo...</Typography>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            name="firstName"
            label="first name"
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="lastName"
            label="last name"
            onChange={handleChange}
            fullWidth
          />
          <TextField
            name="displayName"
            label="display name"
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Email"
            value={profile.email}
            fullWidth
            disabled
          />

          <Button variant="contained" onClick={saveProfile}>
            Save Changes
          </Button>
          <Snackbar
            open={successAlert}
            autoHideDuration={3000}
            onClose={() => setSuccessAlert(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert onClose={() => setSuccessAlert(false)} severity="success" sx={{
              width: '100%',
              boxShadow: 3, // or '0px 4px 12px rgba(0,0,0,0.2)'
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
            }}>
              Profile updated!
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Container>
  );
}