import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebaseConfig";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { app } from "../firebaseConfig";
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    // Email auth
    const signup = async (email, password) => {

        // try {

        //     const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        //     const user = userCredentials.user;

        //     await setDoc(doc(db, "users", user.uid), {
        //         firstName,
        //         lastName,
        //         email: user.email,
        //         createdAt: new Date()
        //     });

        //     console.log("New user saved to database.");

        //     return user;
        // } catch (err) {
        //     console.log("signup error: ", err);
        // }
    }
    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);

    // Google auth
    const signInWithGoogle = async () => {
        try {
            const userCredentials = await signInWithPopup(auth, googleProvider);
            const user = userCredentials.user;

            return user;
        } catch (error) {
            console.error("User doc error: ", error);
        }
    }
    
    async function createUserProfile(user) {

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const nameParts = user.displayName?.split(" ") ?? [];
            const firstName = nameParts[0] ?? "";
            const lastName = nameParts[1] ?? "";

            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                firstName,
                lastName,
                displayName: user.displayName ?? `${firstName} ${lastName}`,
                createdAt: serverTimestamp(),
            });

            console.log("[UserProfile] Created new user profile");
        } 
    }

    return (
        <AuthContext.Provider value= {{ user, signup, login, logout, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );

};