import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseConfig";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Returns an uploader compatible with Tiptap's ImageUploadNode, bound to a note.
 * Uploads the file to Firebase Storage and resolves to its download URL.
 */
export function createNoteImageUploader(noteId) {
  return async function uploadNoteImage(file, onProgress, abortSignal) {
    if (!file) throw new Error("No file provided");
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`File exceeds the ${MAX_IMAGE_SIZE / (1024 * 1024)}MB limit`);
    }
    if (abortSignal?.aborted) throw new Error("Upload cancelled");

    onProgress?.({ progress: 10 });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `note_images/${noteId}/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, { contentType: file.type });
    onProgress?.({ progress: 80 });

    const url = await getDownloadURL(storageRef);
    onProgress?.({ progress: 100 });
    return url;
  };
}
