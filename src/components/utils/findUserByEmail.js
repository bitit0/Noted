import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/**
 * Resolve a user by email address using Firestore (replaces the old admin
 * backend). Returns { uid, displayName, email, photoURL } or null.
 */
export async function findUserByEmail(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return null;

  const usersRef = collection(db, "users");
  // Preferred: match on the normalized emailLower field.
  let snap = await getDocs(query(usersRef, where("emailLower", "==", normalized), limit(1)));

  // Fallback for legacy profiles that predate emailLower.
  if (snap.empty) {
    snap = await getDocs(query(usersRef, where("email", "==", email.trim()), limit(1)));
  }
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const data = docSnap.data();
  return {
    uid: data.uid || docSnap.id,
    displayName: data.displayName || data.email || "Unknown",
    email: data.email || "",
    photoURL: data.photoURL || "",
  };
}
