import { toast } from "react-toastify";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { app } from "../lib/firebase";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const auth = getAuth(app);

// Login function
export const loginService = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    if (userCredential) {
      const user = userCredential.user;
      document.cookie = "user=authenticated; path=/; max-age=3600"; // Set cookie for 1 hour

      // Query Firestore to find the store where email matches
      const storeQuery = query(collection(db, "stores"), where("email", "==", email));
      const storeSnapshot = await getDocs(storeQuery);

      if (!storeSnapshot.empty) {
        const storeDoc = storeSnapshot.docs[0]; // Get the first matching store
        const storeId = storeDoc.id;

        localStorage.setItem("storeId", storeId); // Store storeId in localStorage
        toast.success("Login successful!");
      } else {
        toast.error("Store data not found.");
      }

      return userCredential;
    }
  } catch (error) {
    toast.error(error.message);
  }
};

// Logout function
export const logoutService = async () => {
  try {
    await signOut(auth);
    document.cookie = "user=; path=/; max-age=0"; // Remove authentication cookie
    localStorage.removeItem("storeId"); // Clear storeId from localStorage
    toast.success("Logged out successfully.");
  } catch (error) {
    console.log(error);
    toast.error("Error logging out");
  }
};

export default auth;
