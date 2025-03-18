// "use client"

// import React, { useEffect, useState } from "react"
// import { toast } from "react-toastify"
// import { X } from "lucide-react"
// import {
// 	addProductToCategory,
// 	updateProduct,
// 	deleteProduct,
// 	fetchProductsForCategory,
// } from "../../service/ProductService"
// import { fetchCategoriesForStore } from "@/app/service/category"

// interface Product {
// 	id?: string
// 	catalogueProductName?: string
// 	productDescription?: string
// 	productImageUrl?: string
// 	catalogueCategoryId?: string
// 	catalogueCategoryName?: string
// 	stock?: string
// 	price?: string
// }

// interface Category {
// 	catalogueCategoryId: string
// 	catalogueCategoryName: string
// }

// export default function ProductsPage() {
// 	const [products, setProducts] = useState<Product[]>([])
// 	const [categories, setCategories] = useState<Category[]>([])
// 	const [isProductModalOpen, setIsProductModalOpen] = useState(false)
// 	const [storeId, setStoreId] = useState<string | null>(null)
// 	const [selectedCategoryId, setSelectedCategoryId] = useState<
// 		string | null
// 	>(null)
// 	const [selectedProduct, setSelectedProduct] =
// 		useState<Product | null>(null)

// 	const [formData, setFormData] = useState({
// 		catalogueProductName: "",
// 		productDescription: "",
// 		productImageUrl: "",
// 		catalogueCategoryId: "",
// 		price: "",
// 		stock: "",
// 	})

// 	useEffect(() => {
// 		const storedStoreId = localStorage.getItem("storeId")
// 		if (storedStoreId) {
// 			setStoreId(storedStoreId)
// 		}
// 	}, [])

// 	useEffect(() => {
// 		async function fetchData() {
// 			if (!storeId) return

// 			try {
// 				const fetchedCategories = await fetchCategoriesForStore(
// 					storeId
// 				)
// 				const formattedCategories =
// 					fetchedCategories?.map((cat) => ({
// 						catalogueCategoryId: cat.id,
// 						catalogueCategoryName:
// 							(cat as any).catalogueCategoryName ||
// 							"Unnamed Category",
// 					})) || []

// 				setCategories(formattedCategories)
// 				localStorage.setItem(
// 					"categories",
// 					JSON.stringify(formattedCategories)
// 				)

// 				if (formattedCategories.length > 0) {
// 					setSelectedCategoryId(
// 						formattedCategories[0].catalogueCategoryId
// 					)
// 					fetchProducts(formattedCategories[0].catalogueCategoryId)
// 				} else {
// 					setProducts([])
// 				}
// 			} catch (error) {
// 				console.error("Error fetching data:", error)
// 				toast.error("Failed to fetch data.")
// 			}
// 		}

// 		fetchData()
// 	}, [storeId])

// 	const fetchProducts = async (categoryId: string) => {
// 		if (!storeId) return
// 		try {
// 			const fetchedProducts = await fetchProductsForCategory(
// 				storeId,
// 				categoryId
// 			)
// 			setProducts(fetchedProducts ?? [])
// 		} catch (error) {
// 			toast.error("Failed to fetch products.")
// 		}
// 	}

// 	const handleAddProduct = async () => {
// 		if (
// 			!storeId ||
// 			!formData.catalogueProductName.trim() ||
// 			!formData.catalogueCategoryId ||
// 			!formData.productDescription ||
// 			!formData.productImageUrl
// 		) {
// 			toast.error(
// 				"Store ID, product name, description, image URL, and category are required!"
// 			)
// 			return
// 		}
// 		try {
// 			const newProduct = {
// 				...formData,
// 				catalogueCategoryName: categories.find(
// 					(cat) =>
// 						cat.catalogueCategoryId === formData.catalogueCategoryId
// 				)?.catalogueCategoryName,
// 			}
// 			await addProductToCategory(
// 				storeId,
// 				formData.catalogueCategoryId,
// 				newProduct
// 			)
// 			toast.success("Product added successfully!")
// 			setIsProductModalOpen(false)

// 			setFormData({
// 				catalogueProductName: "",
// 				productDescription: "",
// 				productImageUrl: "",
// 				catalogueCategoryId: "",
// 				stock: "",
// 				price: "",
// 			})

// 			fetchProducts(formData.catalogueCategoryId)
// 		} catch (error) {
// 			toast.error("Failed to add product.")
// 		}
// 	}

// 	const handleEditProduct = async () => {
// 		if (!storeId || !selectedCategoryId || !selectedProduct?.id)
// 			return
// 		try {
// 			await updateProduct(
// 				storeId,
// 				selectedCategoryId,
// 				selectedProduct.id,
// 				formData
// 			)
// 			toast.success("Product updated successfully!")
// 			setIsProductModalOpen(false)
// 			fetchProducts(selectedCategoryId)
// 		} catch (error) {
// 			toast.error("Failed to update product.")
// 		}
// 	}

// 	const handleDeleteProduct = async (productId: string) => {
// 		if (!storeId || !selectedCategoryId) return
// 		const confirmDelete = window.confirm(
// 			"Are you sure you want to delete this product?"
// 		)
// 		if (!confirmDelete) return

// 		try {
// 			await deleteProduct(storeId, selectedCategoryId, productId)
// 			toast.success("Product deleted successfully!")
// 			fetchProducts(selectedCategoryId)
// 		} catch (error) {
// 			toast.error("Failed to delete product.")
// 		}
// 	}

// 	const handleCategoryChange = async (categoryId: string) => {
// 		setSelectedCategoryId(categoryId)
// 		if (storeId) {
// 			try {
// 				const fetchedProducts = await fetchProductsForCategory(
// 					storeId,
// 					categoryId
// 				)
// 				setProducts(fetchedProducts ?? [])
// 			} catch (error) {
// 				console.error("Error fetching products:", error)
// 				toast.error("Failed to fetch products.")
// 			}
// 		}
// 	}

// 	const openEditModal = (product: Product) => {
// 		setSelectedProduct(product)
// 		setFormData({
// 			catalogueProductName: product.catalogueProductName || "",
// 			productDescription: product.productDescription || "",
// 			productImageUrl: product.productImageUrl || "",
// 			catalogueCategoryId: product.catalogueCategoryId || "",
// 			stock: product.stock || "",
// 			price: product.price || "",
// 		})
// 		setIsProductModalOpen(true)
// 	}
"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { X } from "lucide-react"
import {
	addProductToCategory,
	updateProduct,
	deleteProduct,
	fetchProductsForCategory,
} from "../../service/ProductService"
import { fetchCategoriesForStore } from "@/app/service/category"

interface Product {
	id?: string
	catalogueProductName?: string
	productDescription?: string
	productImageUrl?: string
	catalogueCategoryId?: string
	catalogueCategoryName?: string
	stock?: string
	price?: string
}

interface Category {
	catalogueCategoryId: string
	catalogueCategoryName: string
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [isProductModalOpen, setIsProductModalOpen] = useState(false)
	const [storeId, setStoreId] = useState<string | null>(null)
	const [selectedCategoryId, setSelectedCategoryId] = useState<
		string | null
	>("all") // Set default to "all"
	const [selectedProduct, setSelectedProduct] =
		useState<Product | null>(null)

	const [formData, setFormData] = useState({
		catalogueProductName: "",
		productDescription: "",
		productImageUrl: "",
		catalogueCategoryId: "",
		price: "",
		stock: "",
	})

	useEffect(() => {
		const storedStoreId = localStorage.getItem("storeId")
		if (storedStoreId) {
			setStoreId(storedStoreId)
		}
	}, [])

	useEffect(() => {
		async function fetchData() {
			if (!storeId) return

			try {
				const fetchedCategories = await fetchCategoriesForStore(
					storeId
				)
				const formattedCategories =
					fetchedCategories?.map((cat) => ({
						catalogueCategoryId: cat.id,
						catalogueCategoryName:
							(cat as any).catalogueCategoryName ||
							"Unnamed Category",
					})) || []

				setCategories(formattedCategories)
				localStorage.setItem(
					"categories",
					JSON.stringify(formattedCategories)
				)

				// Fetch all products by default
				fetchAllProducts(formattedCategories)
			} catch (error) {
				console.error("Error fetching data:", error)
				toast.error("Failed to fetch data.")
			}
		}

		fetchData()
	}, [storeId])

	// New function to fetch all products across categories
	const fetchAllProducts = async (categoriesList: Category[]) => {
		if (!storeId || categoriesList.length === 0) return

		try {
			// Fetch products for each category and combine them
			const allProductsPromises = categoriesList.map(category => 
				fetchProductsForCategory(storeId, category.catalogueCategoryId)
			)
			
			const productsArrays = await Promise.all(allProductsPromises)
			
			// Flatten and filter out any null results
			const allProducts = productsArrays
				.flat()
				.filter(products => products !== null && products !== undefined) as Product[]
			
			setProducts(allProducts)
		} catch (error) {
			console.error("Error fetching all products:", error)
			toast.error("Failed to fetch all products.")
		}
	}

	const fetchProducts = async (categoryId: string) => {
		if (!storeId) return
		
		// If "all" is selected, fetch all products
		if (categoryId === "all") {
			fetchAllProducts(categories)
			return
		}
		
		try {
			const fetchedProducts = await fetchProductsForCategory(
				storeId,
				categoryId
			)
			setProducts(fetchedProducts ?? [])
		} catch (error) {
			toast.error("Failed to fetch products.")
		}
	}

	const handleAddProduct = async () => {
		if (
			!storeId ||
			!formData.catalogueProductName.trim() ||
			!formData.catalogueCategoryId ||
			!formData.productDescription ||
			!formData.productImageUrl
		) {
			toast.error(
				"Store ID, product name, description, image URL, and category are required!"
			)
			return
		}
		try {
			const newProduct = {
				...formData,
				catalogueCategoryName: categories.find(
					(cat) =>
						cat.catalogueCategoryId === formData.catalogueCategoryId
				)?.catalogueCategoryName,
			}
			await addProductToCategory(
				storeId,
				formData.catalogueCategoryId,
				newProduct
			)
			toast.success("Product added successfully!")
			setIsProductModalOpen(false)

			setFormData({
				catalogueProductName: "",
				productDescription: "",
				productImageUrl: "",
				catalogueCategoryId: "",
				stock: "",
				price: "",
			})

			// Refresh products list based on current selection
			if (selectedCategoryId === "all") {
				fetchAllProducts(categories)
			} else {
				fetchProducts(formData.catalogueCategoryId)
			}
		} catch (error) {
			toast.error("Failed to add product.")
		}
	}

	const handleEditProduct = async () => {
		if (!storeId || !selectedProduct?.catalogueCategoryId || !selectedProduct?.id)
			return
		try {
			await updateProduct(
				storeId,
				selectedProduct.catalogueCategoryId,
				selectedProduct.id,
				formData
			)
			toast.success("Product updated successfully!")
			setIsProductModalOpen(false)
			
			// Refresh products based on current view
			if (selectedCategoryId === "all") {
				fetchAllProducts(categories)
			} else {
				fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to update product.")
		}
	}

	const handleDeleteProduct = async (productId: string, productCategoryId: string) => {
		if (!storeId || !productCategoryId) return
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this product?"
		)
		if (!confirmDelete) return

		try {
			await deleteProduct(storeId, productCategoryId, productId)
			toast.success("Product deleted successfully!")
			
			// Refresh products based on current view
			if (selectedCategoryId === "all") {
				fetchAllProducts(categories)
			} else {
				fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to delete product.")
		}
	}

	const handleCategoryChange = async (categoryId: string) => {
		setSelectedCategoryId(categoryId)
		fetchProducts(categoryId)
	}

	const openEditModal = (product: Product) => {
		setSelectedProduct(product)
		setFormData({
			catalogueProductName: product.catalogueProductName || "",
			productDescription: product.productDescription || "",
			productImageUrl: product.productImageUrl || "",
			catalogueCategoryId: product.catalogueCategoryId || "",
			stock: product.stock || "",
			price: product.price || "",
		})
		setIsProductModalOpen(true)
	}
	
	return (
		<div className="p-6">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">Manage Products</h2>
				<button
					onClick={() => setIsProductModalOpen(true)}
					className="bg-blue-700 text-white px-6 py-3 rounded-md hover:opacity-75"
				>
					+ Add Product
				</button>
			</div>

			<div className="mt-6">
				<select
					value={selectedCategoryId || ""}
					onChange={(e) => handleCategoryChange(e.target.value)}
					className="border-2 w-full p-2 rounded-lg mb-2"
				>
					<option value="all">All Products</option>
					{categories.map((category) => (
						<option
							key={category.catalogueCategoryId}
							value={category.catalogueCategoryId}
						>
							{category.catalogueCategoryName}
						</option>
					))}
				</select>
			</div>

			<div className="bg-white rounded-lg p-5 mt-4">
				<h3 className="text-3xl font-semibold mb-4">Products</h3>
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gray-100">
							<th className="px-4 py-2">Product Name</th>
							<th className="px-4 py-2">Description</th>
							<th className="px-4 py-2">Image</th>
							<th className="px-4 py-2">Category Name</th>
							<th className="px-4 py-2">Stock</th>
							<th className="px-4 py-2">Price</th>
							<th className="px-4 py-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{products.length > 0 ? (
							products.map((product) => (
								<tr key={product.id} className="border-t text-center">
									<td className="px-4 py-2">
										{product.catalogueProductName}
									</td>
									<td className="px-4 py-2">
										{product.productDescription}
									</td>
									<td className="px-4 py-2">
										<img
											src={product.productImageUrl}
											alt={product.catalogueProductName}
											className="h-12 w-12 rounded-lg"
										/>
									</td>
									<td className="px-4 py-2">
										{product.catalogueCategoryName}
									</td>
									<td className="px-4 py-2">{product.stock}</td>
									<td className="px-4 py-2">{product.price}</td>
									<td className="flex items-center gap-5 py-6">
										<button
											onClick={() => openEditModal(product)}
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
										>
											Edit
										</button>

										<button
											onClick={() => handleDeleteProduct(product.id!, product.catalogueCategoryId!)}
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
										>
											Delete
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-2 text-center text-gray-500"
								>
									No products added yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{isProductModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-96">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold">
								Add / Edit Product
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => setIsProductModalOpen(false)}
							/>
						</div>
						<input
							type="text"
							value={formData.catalogueProductName}
							onChange={(e) =>
								setFormData({
									...formData,
									catalogueProductName: e.target.value,
								})
							}
							placeholder="Product Name"
							className="border-2 w-full p-2 rounded-lg mb-2"
						/>
						<textarea
							value={formData.productDescription}
							onChange={(e) =>
								setFormData({
									...formData,
									productDescription: e.target.value,
								})
							}
							placeholder="Product Description"
							className="border-2 w-full p-2 rounded-lg mb-2"
						/>
						<input
							type="text"
							value={formData.productImageUrl}
							onChange={(e) =>
								setFormData({
									...formData,
									productImageUrl: e.target.value,
								})
							}
							placeholder="Product Image URL"
							className="border-2 w-full p-2 rounded-lg mb-2"
						/>
						<input
							type="text"
							value={formData.stock}
							onChange={(e) =>
								setFormData({
									...formData,
									stock: e.target.value,
								})
							}
							placeholder="Stock"
							className="border-2 w-full p-2 rounded-lg mb-2"
						/>
						<input
							type="text"
							value={formData.price}
							onChange={(e) =>
								setFormData({
									...formData,
									price: e.target.value,
								})
							}
							placeholder="Price"
							className="border-2 w-full p-2 rounded-lg mb-2"
						/>
						<select
							value={formData.catalogueCategoryId}
							onChange={(e) =>
								setFormData({
									...formData,
									catalogueCategoryId: e.target.value,
								})
							}
							className="border-2 w-full p-2 rounded-lg mb-2"
						>
							<option value="">Select Category</option>
							{categories.map((category) => (
								<option
									key={category.catalogueCategoryId}
									value={category.catalogueCategoryId}
								>
									{category.catalogueCategoryName}
								</option>
							))}
						</select>
						<button
							onClick={
								selectedProduct ? handleEditProduct : handleAddProduct
							}
							className="w-full bg-indigo-700 text-white py-2 rounded-lg mt-4 hover:opacity-75"
						>
							{selectedProduct ? "Update Product" : "Add Product"}
						</button>
					</div>
				</div>
			)}
		</div>
	)


// 		
}
