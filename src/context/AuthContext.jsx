import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, googleProvider, db } from "../firebaseConfig";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

/**
 * Create (or backfill) the Firestore profile document for a user. Idempotent:
 * safe to call on every sign-in. Ensures `emailLower` exists so collaborators
 * can be found by email without an admin backend.
 */
async function ensureUserProfile(user, extra = {}) {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  const nameParts = (user.displayName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = extra.firstName || nameParts[0] || "";
  const lastName = extra.lastName || nameParts.slice(1).join(" ") || "";
  const displayName =
    user.displayName || [firstName, lastName].filter(Boolean).join(" ") || "Anonymous";

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      emailLower: (user.email || "").toLowerCase(),
      firstName,
      lastName,
      displayName,
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
    });
  } else if (!snap.data().emailLower && user.email) {
    // Backfill for legacy profiles created before emailLower existed.
    await setDoc(userRef, { emailLower: user.email.toLowerCase() }, { merge: true });
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        try {
          await ensureUserProfile(currentUser);
        } catch (err) {
          console.error("[Auth] Failed to ensure profile:", err);
        }
      }
    });
    return unsubscribe;
  }, []);

  const signup = useCallback(async (email, password, firstName = "", lastName = "") => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = [firstName, lastName].filter(Boolean).join(" ");
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await ensureUserProfile(cred.user, { firstName, lastName });
    return cred.user;
  }, []);

  const login = useCallback(
    (email, password) => signInWithEmailAndPassword(auth, email, password),
    []
  );

  const logout = useCallback(() => signOut(auth), []);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(cred.user);
    return cred.user;
  }, []);

  const value = { user, loading, signup, login, logout, signInWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
