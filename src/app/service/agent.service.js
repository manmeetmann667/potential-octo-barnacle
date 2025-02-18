"use server"

import { addDoc, collection, getDocs, query, where } from "firebase/firestore"
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth"
import { db, app } from "../lib/firebase"

const auth = getAuth(app)

// Function to check if the email is unique
export async function isUnique(email) {
	const agentRef = collection(db, "agents")

	// Query Firestore for existing email
	const emailQuery = query(agentRef, where("email", "==", email))
	const emailSnapshot = await getDocs(emailQuery)

	return emailSnapshot.empty // True if email is unique
}

// Function to generate a unique email if one already exists
async function generateUniqueEmail(baseEmail) {
	let email = baseEmail
	let counter = 1

	while (true) {
		const emailQuery = query(collection(db, "agents"), where("email", "==", email))
		const emailSnapshot = await getDocs(emailQuery)

		if (emailSnapshot.empty) break // Email is unique, exit loop
		email = `${baseEmail.split("@")[0]}${counter}@${
			baseEmail.split("@")[1]
		}`
		counter++
	}

	return email
}

// Function to generate a random password
function generateUniquePassword() {
	return Math.random().toString(36).slice(-10) // Generate random password
}

// Function to add an agent to Firestore and Firebase Authentication
export async function addAgent(agentData) {
	// Generate unique email & password
	const email = await generateUniqueEmail(
		`${agentData.agentName.toLowerCase().replace(/\s+/g, "")}@deliveryagent.com`
	)
	const password = generateUniquePassword()

	try {
		// Create agent in Firebase Authentication
		const userCredential = await createUserWithEmailAndPassword(auth, email, password)
		const user = userCredential.user

		// Add agent details to Firestore
		const docRef = await addDoc(collection(db, "agents"), {
			agentName: agentData.agentName,
			mobileNumber: agentData.mobileNumber,
			image: agentData.image || "",
			email,
			password,
			uid: user.uid, // Store Firebase Auth UID
			role: "delivery_agent", // Assign role for future use
		})

		return { success: true, agentId: docRef.id, email, password }
	} catch (error) {
		console.error("Error adding agent:", error)
		throw new Error("Failed to add agent.")
	}
}

// Function to fetch all agents from Firestore
export async function getAgents() {
	const agentRef = collection(db, "agents")
	const snapshot = await getDocs(agentRef)
	return snapshot.docs.map((doc) => ({
		agentId: doc.id, // Use Firestore Doc ID as Agent ID
		...doc.data(),
	}))
}
