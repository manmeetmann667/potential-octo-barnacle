import {
	addDoc,
	collection,
	getDocs,
	query,
	where,
	updateDoc,
	deleteDoc,
	doc,
} from "firebase/firestore"
import {
	createUserWithEmailAndPassword,
	getAuth,
} from "firebase/auth"
import { toast } from "react-toastify"
import { db, app } from "../lib/firebase"

const auth = getAuth(app)

// Function to generate a unique agentId
function generateAgentId() {
	return Math.random().toString(36).substring(2, 10) // Generate random string as agentId
}

// Function to check if the email is unique
export async function isUnique(email) {
	const agentRef = collection(db, "agents")
	const emailQuery = query(agentRef, where("email", "==", email))
	const emailSnapshot = await getDocs(emailQuery)
	return emailSnapshot.empty // True if email is unique
}

// Function to generate a unique email if one already exists
async function generateUniqueEmail(baseEmail) {
	let email = baseEmail
	let counter = 1

	while (true) {
		const emailQuery = query(
			collection(db, "agents"),
			where("email", "==", email)
		)
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
	const email = await generateUniqueEmail(
		`${agentData.agentName
			.toLowerCase()
			.replace(/\s+/g, "")}@deliveryagent.com`
	)
	const password = generateUniquePassword()
	const agentId = generateAgentId()

	try {
		// Create agent in Firebase Authentication
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		)
		const user = userCredential.user

		// Add agent details to Firestore
		const docRef = await addDoc(collection(db, "agents"), {
			agentId, // Store the unique agentId
			agentName: agentData.agentName,
			mobileNumber: agentData.mobileNumber,
			image: agentData.image || "",
			email,
			personalEmail: agentData.personalEmail,
			password, // Note: Storing passwords in Firestore is insecure; consider alternatives
			isAvaliable: true,
			uid: user.uid, // Store Firebase Auth UID
			role: "delivery_agent",
		})

		toast.success("Agent Added Successfully")

		const emailResp = await fetch("/api/send-email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				toEmail: agentData.personalEmail,
				agentEmail: email,
				agentPassword: password,
			}),
		})

		const emailData = await emailResp.json()
		if (!emailResp.ok) {
			throw new Error("Failed to send email")
		}

		if (emailData.success) {
			toast.success("Email sent to agent successfully!")
		} else {
			toast.error("Failed to send email to agent.")
		}

		return { success: true, agentId: docRef.id, email, password }
	} catch (error) {
		console.error("Error adding agent:", error)
		throw new Error("Failed to add agent.")
	}
}

// Function to fetch all agents from Firestore
export async function getAgents() {
	try {
		const agentRef = collection(db, "agents")
		const snapshot = await getDocs(agentRef)
		return snapshot.docs.map((doc) => ({
			agentId: doc.data().agentId, // Use the agentId field, not doc.id
			...doc.data(),
		}))
	} catch (error) {
		console.error("Error fetching agents:", error)
		throw error
	}
}

// Function to update agent details
export async function updateAgent(agentId, updatedData) {
	try {
		// Query the 'agents' collection for documents where the 'agentId' field matches the given agentId
		const q = query(
			collection(db, "agents"),
			where("agentId", "==", agentId)
		)
		const querySnapshot = await getDocs(q)

		// Check if a document with the matching agentId exists
		if (!querySnapshot.empty) {
			const agentDoc = querySnapshot.docs[0] // Assuming agentId is unique
			const agentDocRef = agentDoc.ref

			// Explicitly exclude personalEmail, email, and password from updates
			const { personalEmail, email, password, ...safeData } =
				updatedData

			// Update the document with the filtered data
			await updateDoc(agentDocRef, safeData)
			console.log("Agent updated successfully")
			return { success: true }
		} else {
			console.error(`No agent found with agentId: ${agentId}`)
			throw new Error(`No agent found with agentId: ${agentId}`)
		}
	} catch (error) {
		console.error("Error updating agent:", error)
		throw error
	}
}

// Function to delete an agent
export async function deleteAgent(agentId) {
	try {
		// Query the 'agents' collection for documents where the 'agentId' field matches the given agentId
		const q = query(
			collection(db, "agents"),
			where("agentId", "==", agentId)
		)
		const querySnapshot = await getDocs(q)

		// Check if a document with the matching agentId exists
		if (!querySnapshot.empty) {
			const agentDoc = querySnapshot.docs[0] // Assuming agentId is unique
			const agentDocRef = agentDoc.ref

			// Delete the document
			await deleteDoc(agentDocRef)
			console.log("Agent deleted successfully")
			return { success: true }
		} else {
			console.error(`No agent found with agentId: ${agentId}`)
			throw new Error(`No agent found with agentId: ${agentId}`)
		}
	} catch (error) {
		console.error("Error deleting agent:", error)
		throw error
	}
}
