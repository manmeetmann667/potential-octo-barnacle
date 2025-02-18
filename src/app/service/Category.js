"use server";

import { addDoc, collection, doc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const categoryCollection = collection(db, "categories");


export const addCategoryToStore = async (storeId, categoryData) => {
  try {
    // Getting the reference for the store's categories collection
    const categoriesRef = collection(db, "stores", storeId, "categories");
    
    // Add the category to Firebase, including both the name and the category ID
    const categoryRef = await addDoc(categoriesRef, {
      catalogueCategoryName: categoryData.catalogueCategoryName,
      // Automatically generating and saving the category ID as part of the document
      catalogueCategoryId: "", // Placeholder for now, will be updated
    });

    // After adding the category, now update it with the generated ID
    await categoryRef.update({
      catalogueCategoryId: categoryRef.id, // This sets the ID after it's generated
    });

    console.log("Category added with ID: ", categoryRef.id);

    return categoryRef.id;
  } catch (error) {
    console.error("Error adding category: ", error);
  }
};

export const fetchCategoriesForStore = async (storeId) => {
  try {
      const categoriesSnap = await getDocs(collection(db, "stores", storeId, "categories"));
      const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return categories;
  } catch (error) {
      console.error("Error fetching categories: ", error);
  }
};