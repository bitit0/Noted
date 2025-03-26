import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, googleProvider } from "../firebaseConfig";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup } from "firebase/auth";
import { app } from "../firebaseConfig";
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredentials.user;

        return user;
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

    return (
        <AuthContext.Provider value= {{ user, signup, login, logout, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );

};