"use server"

import { addDoc, collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import auth from "./login.service"


export const addStore = async (storeData) => {
    try {
        const storeRef = await addDoc(collection(db, "stores"), storeData);
        console.log("Store added with ID: ", storeRef.id);
        return storeRef.id;
    } catch (error) {
        console.error("Error adding store: ", error);
    }
};

export const fetchStores = async () => {
    try {
        const storesSnap = await getDocs(collection(db, "stores"));
        const stores = storesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return stores;
    } catch (error) {
        console.error("Error fetching stores: ", error);
    }
};


export async function importUsersFromFirestore() {
	const storeRef = collection(db, "stores") // Use 'collection' instead of 'db.collection'
	const snapshot = await getDocs(storeRef)

	if (snapshot.empty) {
		console.log("No store documents found!")
		return
	}

	// Loop through each document in the "Stores" collection
	for (const doc of snapshot.docs) {
		const storeData = doc.data() // Fetch JSON data
		console.log(storeData)

		// Ensure email and password exist in the document
		if (storeData.email && storeData.password) {
			try {
				// Create user in Firebase Authentication (client-side)
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					storeData.email,
					storeData.password
				)

				console.log(`User created: ${userCredential.user.email}`)
			} catch (error) {
				console.error(`Error adding user ${storeData.email}:`, error)
			}
		} else {
			console.log(`Skipping ${doc.id}, missing email or password.`)
		}
	}
}
