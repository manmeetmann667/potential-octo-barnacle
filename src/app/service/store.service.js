"use server"

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	updateDoc,
	where,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { db } from "../lib/firebase"
const auth = getAuth(app)
export const addStore = async (storeData) => {
	try {
		const storeRef = await addDoc(collection(db, "stores"), storeData)
		console.log("Store added with ID: ", storeRef.id)
		return { success: true, storeId: storeRef.id }
	} catch (error) {
		console.error("Error adding store: ", error)
		throw new Error("Failed to add store")
	}
}

export const fetchStores = async () => {
	try {
		const storesSnap = await getDocs(collection(db, "stores"))
		const stores = storesSnap.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}))
		return stores
	} catch (error) {
		console.error("Error fetching stores: ", error)
		throw new Error("Failed to fetch stores")
	}
}

export async function importUsersFromFirestore() {
	try {
		const storeRef = collection(db, "stores")
		const snapshot = await getDocs(storeRef)

		if (snapshot.empty) {
			console.log("No store documents found!")
			return
		}

		for (const doc of snapshot.docs) {
			const storeData = doc.data()
			console.log(storeData)

			if (storeData.email && storeData.password) {
				try {
					const userCredential = await createUserWithEmailAndPassword(
						auth,
						storeData.email,
						storeData.password
					)
					console.log(`User created: ${userCredential.user.email}`)
				} catch (error) {
					console.error(
						`Error adding user ${storeData.email}:`,
						error
					)
				}
			} else {
				console.log(`Skipping ${doc.id}, missing email or password.`)
			}
		}
	} catch (error) {
		console.error("Error importing users from Firestore: ", error)
		throw new Error("Failed to import users")
	}
}

export const updateStore = async (storeId, updatedData) => {
	try {
		// Query the 'stores' collection for documents where the 'storeId' field matches the given storeId
		const q = query(
			collection(db, "stores"),
			where("storeId", "==", storeId)
		)
		const querySnapshot = await getDocs(q)

		// Check if a document with the matching storeId exists
		if (!querySnapshot.empty) {
			const storeDoc = querySnapshot.docs[0] // Assuming storeId is unique
			const storeDocRef = storeDoc.ref

			// Explicitly exclude personalEmail, email, and password from updates
			const { personalEmail, email, password, ...safeData } =
				updatedData

			// Update the document with the filtered data
			await updateDoc(storeDocRef, safeData)
			console.log("Store updated successfully")
			return { success: true }
		} else {
			console.error(`No store found with storeId: ${storeId}`)
			throw new Error(`No store found with storeId: ${storeId}`)
		}
	} catch (error) {
		console.error("Error updating store: ", error)
		throw new Error("Failed to update store")
	}
}

export const deleteStore = async (storeId) => {
	try {
		// Query the 'stores' collection for documents where the 'storeId' field matches the given storeId
		const q = query(
			collection(db, "stores"),
			where("storeId", "==", storeId)
		)
		const querySnapshot = await getDocs(q)

		// Check if a document with the matching storeId exists
		if (!querySnapshot.empty) {
			const storeDoc = querySnapshot.docs[0] // Assuming storeId is unique
			const storeDocRef = storeDoc.ref

			// Delete the document
			await deleteDoc(storeDocRef)
			console.log("Store deleted successfully")
			return { success: true }
		} else {
			console.error(`No store found with storeId: ${storeId}`)
			throw new Error(`No store found with storeId: ${storeId}`)
		}
	} catch (error) {
		console.error("Error deleting store: ", error)
		throw new Error("Failed to delete store")
	}
}
