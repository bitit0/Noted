import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.warn("User profile not found for UID:", uid);
      return null;
    }
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}
