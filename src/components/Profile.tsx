import { useEffect, useState, ChangeEvent } from "react";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Snackbar,
  Alert,
} from "@mui/material";

interface UserProfile {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  photoURL: string;
}

const EMPTY: UserProfile = {
  displayName: "",
  firstName: "",
  lastName: "",
  email: "",
  photoURL: "",
};

export default function Profile() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile>(EMPTY);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: "success" | "error" } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const d = snap.data() as Partial<UserProfile>;
        setProfile({
          displayName: d.displayName || "",
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          email: d.email || user.email || "",
          photoURL: d.photoURL || "",
        });
      } else {
        const fresh: UserProfile = {
          ...EMPTY,
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
        };
        await setDoc(userRef, {
          uid: user.uid,
          ...fresh,
          emailLower: (user.email || "").toLowerCase(),
          createdAt: serverTimestamp(),
        });
        setProfile(fresh);
      }
      setProfileLoading(false);
    };
    load();
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!user || !file) return;

    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = mimeToExt[file.type];
    if (!ext) {
      setToast({ msg: "Only JPG, PNG, or WebP images are supported.", sev: "error" });
      return;
    }

    try {
      setUploading(true);
      const fileRef = ref(storage, `profile_pictures/${user.uid}/profile.${ext}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      setProfile((prev) => ({ ...prev, photoURL: url }));
      setToast({ msg: "Photo updated.", sev: "success" });
    } catch (err) {
      console.error("Upload failed:", err);
      setToast({ msg: "Upload failed. Please try again.", sev: "error" });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const displayName =
        profile.displayName.trim() ||
        [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
      await updateDoc(doc(db, "users", user.uid), {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        displayName,
      });
      if (auth.currentUser && displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      setProfile((prev) => ({ ...prev, displayName }));
      setToast({ msg: "Profile updated.", sev: "success" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Could not save. Please try again.", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>Loading…</Box>
    );
  }

  const initial = (profile.displayName || profile.email || "U").charAt(0).toUpperCase();

  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: "background.default" }}>
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Manage how you appear to collaborators.
        </Typography>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "4px",
            bgcolor: "background.paper",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3 }}>
            <Avatar
              src={profile.photoURL || undefined}
              variant="square"
              sx={{
                width: 72,
                height: 72,
                fontSize: 28,
                borderRadius: "4px",
                bgcolor: "primary.main",
                color: "#fff",
              }}
            >
              {initial}
            </Avatar>
            <Box>
              <label htmlFor="upload-photo">
                <input
                  style={{ display: "none" }}
                  accept="image/png,image/jpeg,image/webp"
                  id="upload-photo"
                  type="file"
                  onChange={handleImageUpload}
                />
                <Button variant="outlined" component="span" size="small" disabled={uploading}>
                  {uploading ? "Uploading…" : "Change photo"}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                JPG, PNG or WebP. Max 5MB.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                name="firstName"
                label="First name"
                value={profile.firstName}
                onChange={handleChange}
                fullWidth
                size="small"
              />
              <TextField
                name="lastName"
                label="Last name"
                value={profile.lastName}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Box>
            <TextField
              name="displayName"
              label="Display name"
              value={profile.displayName}
              onChange={handleChange}
              fullWidth
              size="small"
              helperText="Shown on your notes and to collaborators."
            />
            <TextField label="Email" value={profile.email || ""} fullWidth size="small" disabled />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
              <Button variant="contained" onClick={saveProfile} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert onClose={() => setToast(null)} severity={toast.sev} sx={{ borderRadius: "4px" }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
