"use server"

import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	setDoc,
	updateDoc,
} from "firebase/firestore"
import { db } from "../lib/firebase"

export const addCategoryToStore = async (storeId, categoryData) => {
	try {
		const categoriesRef = collection(
			db,
			"stores",
			storeId,
			"categories"
		)

		// Add the category with a placeholder for catalogueCategoryId
		const categoryRef = await addDoc(categoriesRef, {
			catalogueCategoryName: categoryData.catalogueCategoryName,
		})

		// Update the document with the generated ID
		await setDoc(
			categoryRef,
			{ catalogueCategoryId: categoryRef.id },
			{ merge: true }
		)

		console.log("Category added with ID:", categoryRef.id)
		return categoryRef.id
	} catch (error) {
		console.error("Error adding category:", error)
	}
}

export const fetchCategoriesForStore = async (storeId) => {
	try {
		const categoriesSnap = await getDocs(
			collection(db, "stores", storeId, "categories")
		)
		const categories = categoriesSnap.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}))
		return categories
	} catch (error) {
		console.error("Error fetching categories:", error)
	}
}

export const updateCategory = async (
	storeId,
	categoryId,
	updatedData
) => {
	try {
		// Reference the specific category document in the subcollection
		const categoryRef = doc(
			db,
			"stores",
			storeId,
			"categories",
			categoryId
		)

		// Update the document with the new data
		await updateDoc(categoryRef, updatedData)
		console.log("Category updated successfully")
	} catch (error) {
		console.error("Error updating category: ", error)
	}
}

export const deleteCategory = async (storeId, categoryId) => {
	try {
		if (!storeId || !categoryId) {
			throw new Error("Store ID or Category ID is missing.")
		}

		console.log(
			"Attempting to delete category with ID:",
			categoryId,
			"from store:",
			storeId
		)

		// Reference the category document inside the store
		const categoryRef = doc(
			db,
			"stores",
			storeId,
			"categories",
			categoryId
		)

		// Step 1: Delete the documents in the subcollection (e.g., products)
		const productsRef = collection(
			db,
			"stores",
			storeId,
			"categories",
			categoryId,
			"products"
		)
		const productSnap = await getDocs(productsRef)

		// Delete each product in the subcollection
		for (const docSnapshot of productSnap.docs) {
			await deleteDoc(docSnapshot.ref)
			console.log(`Product ${docSnapshot.id} deleted`)
		}

		// Step 2: Now, delete the category document itself
		await deleteDoc(categoryRef)
		console.log("Category deleted successfully:", categoryId)
	} catch (error) {
		console.error("Error deleting category:", error)
		throw error // Re-throw to handle it in the calling function
	}
}
