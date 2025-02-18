// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyCFRU1ogUpo04YnQvlu3xfvatWtZQLayQw",
	authDomain: "airportproject-93b9e.firebaseapp.com",
	projectId: "airportproject-93b9e",
	storageBucket: "airportproject-93b9e.firebasestorage.app",
	messagingSenderId: "665815564201",
	appId: "1:665815564201:web:628c891e7e26ffde4e4eb8",
	measurementId: "G-VPJBMFKR2C",
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
