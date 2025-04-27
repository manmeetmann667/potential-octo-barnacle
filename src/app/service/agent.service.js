// agent.service.js

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from "firebase/firestore"
import { db } from "../lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import auth from "./login.service"

export const addAgent = async (agentData) => {
	try {
		const agentRef = await addDoc(collection(db, "agents"), agentData)
		console.log("Agent added with ID: ", agentRef.id)
		return agentRef.id
	} catch (error) {
		console.error("Error adding agent: ", error)
	}
}

export const fetchAgents = async () => {
	try {
		const agentsSnap = await getDocs(collection(db, "agents"))
		const agents = agentsSnap.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}))
		return agents
	} catch (error) {
		console.error("Error fetching agents: ", error)
	}
}

export async function importUsersFromAgentFirestore() {
	const agentRef = collection(db, "agents")
	const snapshot = await getDocs(agentRef)

	if (snapshot.empty) {
		console.log("No agent found!")
		return
	}

	for (const doc of snapshot.docs) {
		const agentData = doc.data()
		console.log(agentData)

		if (agentData.email && agentData.password) {
			try {
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					agentData.email,
					agentData.password
				)
				console.log(`User created: ${userCredential.user.email}`)
			} catch (error) {
				console.error(`Error adding user ${agentData.email}:`, error)
			}
		} else {
			console.log(`Skipping ${doc.id}, missing email or password.`)
		}
	}
}

export const updateAgent = async (agentId, updatedData) => {
	try {
		const q = query(
			collection(db, "agents"),
			where("agentId", "==", agentId)
		)
		const querySnapshot = await getDocs(q)

		if (!querySnapshot.empty) {
			const agentDoc = querySnapshot.docs[0]
			const agentDocRef = agentDoc.ref
			await updateDoc(agentDocRef, updatedData)
			console.log("Agent updated successfully")
		} else {
			console.error(`No agent found with agentId: ${agentId}`)
		}
	} catch (error) {
		console.error("Error updating agent: ", error)
	}
}

export const deleteAgent = async (agentId) => {
	try {
		const q = query(
			collection(db, "agents"),
			where("agentId", "==", agentId)
		)
		const querySnapshot = await getDocs(q)

		if (!querySnapshot.empty) {
			const agentDoc = querySnapshot.docs[0]
			const agentDocRef = agentDoc.ref
			await deleteDoc(agentDocRef)
			console.log("Agent deleted successfully")
		} else {
			console.error(`No agent found with agentId: ${agentId}`)
		}
	} catch (error) {
		console.error("Error deleting agent: ", error)
	}
}
