"use server";

import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const productCollection = collection(db, "products");

export const addProductToCategory = async (storeId, categoryId, productData) => {
  try {
    const docRef = await addDoc(
      collection(db, "stores", storeId, "categories", categoryId, "products"),
      productData
    );
    console.log("Product added with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product to category:", error);
    return null;
  }
};

export const fetchProductsForCategory = async (storeId, categoryId) => {
  try {
    console.log("Fetching products for Store:", storeId, "Category:", categoryId);
    const productsSnap = await getDocs(collection(db, "stores", storeId, "categories", categoryId, "products"));
    console.log("Snapshot Size:", productsSnap.size);
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Fetched Products:", products);
    return products;
  } catch (error) {
    console.error("Error fetching products: ", error);
  }
};

export const fetchProductsForStore = async (storeId) => {
  try {
    console.log("Fetching all products for Store:", storeId);

    // Fetch categories under the given storeId
    const categoriesSnap = await getDocs(collection(db, "stores", storeId, "categories"));
    const categories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let allProducts = [];

    // Iterate through each category and fetch its products
    for (const category of categories) {
      const productsSnap = await getDocs(collection(db, "stores", storeId, "categories", category.id, "products"));
      const products = productsSnap.docs.map(doc => ({
        id: doc.id,
        catalogueProductName: doc.data().catalogueProductName || "Unnamed Product",
        productDescription: doc.data().productDescription || "No description available.",
        productImageUrl: doc.data().productImageUrl || "default-image-url",
        catalogueCategoryId: category.id,
        catalogueCategoryName: category.catalogueCategoryName || "Unknown Category",
      }));

      allProducts = [...allProducts, ...products];
    }

    console.log("Fetched All Products:", allProducts);
    return allProducts;
  } catch (error) {
    console.error("Error fetching products: ", error);
    return [];
  }
};
