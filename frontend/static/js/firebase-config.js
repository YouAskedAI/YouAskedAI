// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC2Je8UGO7FTp3Sr4eL7yaLRYss6OUMGaE",
    authDomain: "youaskedai-721e5.firebaseapp.com",
    projectId: "youaskedai-721e5",
    storageBucket: "youaskedai-721e5.firebasestorage.app",
    messagingSenderId: "1004551036740",
    appId: "1:1004551036740:web:ec21932ed7b8b0a63ac111",
    measurementId: "G-78JEY77XWR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Sign up function
export async function signUp(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign in function
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign out function
export async function signOut() {
    try {
        await auth.signOut();
    } catch (error) {
        throw error;
    }
}

// Get current user
export function getCurrentUser() {
    return auth.currentUser;
}

// Add auth state observer
export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

// API call helper function
export async function callApi(endpoint, options = {}) {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    const response = await fetch(endpoint, options);
    return response.json();
} 