// "use client"

// import React, { useEffect, useState } from "react"
// import { toast } from "react-toastify"
// import { X } from "lucide-react"
// import {
// 	addCategoryToStore,
// 	deleteCategory,
// 	fetchCategoriesForStore,
// 	updateCategory,
// } from "../../service/category"

// export default function Page() {
// 	interface Category {
// 		catalogueCategoryId: string
// 		catalogueCategoryName: string
// 	}

// 	const [catalogueCategoryName, setCatalogueCategoryName] =
// 		useState("")
// 	const [categories, setCategories] = useState<Category[]>([])
// 	const [isCategoryOpen, setIsCategoryOpen] = useState(false)
// 	const [storeId, setStoreId] = useState<string | null>(null)
// 	const [selectedCategory, setSelectedCategory] =
// 		useState<Category | null>(null)

// 	// Simulated way to get the storeId after login (should be retrieved from auth or context)
// 	useEffect(() => {
// 		const storedStoreId = localStorage.getItem("storeId")
// 		if (storedStoreId) {
// 			setStoreId(storedStoreId)
// 		}
// 	}, [])
// 	useEffect(() => {
// 		async function fetchCategories() {
// 			const storeId = localStorage.getItem("storeId") // Retrieve storeId from localStorage
// 			if (!storeId) return

// 			try {
// 				const fetchedCategories =
// 					(await fetchCategoriesForStore(storeId)) || [] // Ensure it's always an array

// 				// Store category IDs in localStorage
// 				if (fetchedCategories.length > 0) {
// 					const categoryIds = fetchedCategories.map((cat) => cat.id)
// 					localStorage.setItem(
// 						"categoryIds",
// 						JSON.stringify(categoryIds)
// 					) // Store array of category IDs
// 				}

// 				setCategories(
// 					fetchedCategories.map((cat) => ({
// 						catalogueCategoryId: cat.id,
// 						catalogueCategoryName:
// 							(cat as any).catalogueCategoryName ||
// 							"Unnamed Category",
// 					}))
// 				)
// 			} catch (error) {
// 				toast.error("Failed to fetch categories.")
// 			}
// 		}

// 		fetchCategories()
// 	}, [storeId])

// 	const handleEditClick = (category: Category) => {
// 		setSelectedCategory(category)
// 		setCatalogueCategoryName(category.catalogueCategoryName)
// 		setIsCategoryOpen(true)
// 	}
// 	const handleAddCategory = async () => {
// 		try {
// 			const storeStoreId = localStorage.getItem("storeId")
// 			if (!storeStoreId) {
// 				toast.error("Store ID not found.")
// 				return
// 			}

// 			console.log(selectedCategory?.catalogueCategoryId)

// 			if (selectedCategory) {
// 				// Update category
// 				await updateCategory(
// 					storeStoreId,
// 					selectedCategory.catalogueCategoryId,
// 					{
// 						catalogueCategoryName,
// 					}
// 				)
// 				toast.success("Category Updated Successfully")

// 				// Close modal before fetching categories
// 				setIsCategoryOpen(false)

// 				// Fetch updated categories
// 				const updatedCategories = await fetchCategoriesForStore(
// 					storeStoreId
// 				)
// 				setCategories(
// 					(updatedCategories || []).map((cat) => ({
// 						catalogueCategoryId: cat.id,
// 						catalogueCategoryName:
// 							(cat as any).catalogueCategoryName ||
// 							"Unnamed Category",
// 					}))
// 				)
// 			} else {
// 				// Add new category
// 				const newCategory = { catalogueCategoryName }
// 				const categoryId = await addCategoryToStore(
// 					storeStoreId,
// 					newCategory
// 				)

// 				if (categoryId) {
// 					setCategories([
// 						...categories,
// 						{
// 							catalogueCategoryId: categoryId,
// 							catalogueCategoryName,
// 						},
// 					])
// 					setCatalogueCategoryName("")

// 					// Close modal before showing toast
// 					setIsCategoryOpen(false)

// 					// Ensure the toast appears after the modal closes
// 					setTimeout(() => {
// 						toast.success("Category Added Successfully")
// 					}, 300)
// 				}
// 			}
// 		} catch (error) {
// 			toast.error("Error adding category")
// 		}
// 	}

// 	const handleDeleteClick = async (categoryId: string) => {
// 		const storeStoreId = localStorage.getItem("storeId") // Fetch storeId from localStorage
// 		if (!storeStoreId) {
// 			toast.error("Store ID not found.")
// 			return
// 		}

// 		const confirmDelete = window.confirm(
// 			"Are you sure you want to delete this Category?"
// 		)
// 		if (!confirmDelete) return

// 		try {
// 			console.log(
// 				"Deleting category:",
// 				categoryId,
// 				"from store:",
// 				storeStoreId
// 			)
// 			await deleteCategory(storeStoreId, categoryId) // Call the delete function
// 			toast.success("Category deleted successfully!")

// 			// Fetch updated category list
// 			const updatedCategories = await fetchCategoriesForStore(
// 				storeStoreId
// 			)
// 			setCategories(
// 				(updatedCategories || []).map((cat) => ({
// 					catalogueCategoryId: cat.id,
// 					catalogueCategoryName:
// 						(cat as any).catalogueCategoryName || "Unnamed Category",
// 				}))
// 			)
// 		} catch (error) {
// 			console.error("Error deleting category:", error)
// 			toast.error("Error deleting Category!")
// 		}
// 	}

// 	return (
// 		<div className="p-6 flex-grow">
// 			<div className="flex justify-between items-center gap-5">
// 				<h2 className="font-semibold text-5xl">
// 					Manage Agents & Categories
// 				</h2>
// 				<button
// 					onClick={() => setIsCategoryOpen(true)}
// 					className="bg-blue-700 text-white px-6 py-3 rounded-md hover:opacity-75"
// 				>
// 					+ Add Catalogue Category
// 				</button>
// 			</div>

// 			<div className="bg-white rounded-lg p-5 mt-10">
// 				<h3 className="text-3xl font-semibold mb-4">
// 					Catalogue Categories
// 				</h3>
// 				<table className="w-full border-collapse">
// 					<thead>
// 						<tr className="bg-gray-100">
// 							<th className="px-4 py-2">Catalogue Category ID</th>
// 							<th className="px-4 py-2">Catalogue Category Name</th>
// 							<th className="px-4 py-2">Actions</th>
// 						</tr>
// 					</thead>
// 					<tbody>
// 						{categories.length > 0 ? (
// 							categories.map((category) => (
// 								<tr
// 									key={category.catalogueCategoryId}
// 									className="border-t text-center"
// 								>
// 									<td className="px-4 py-2">
// 										{category.catalogueCategoryId}
// 									</td>
// 									<td className="px-4 py-2">
// 										{category.catalogueCategoryName}
// 									</td>
// 									<div className="flex items-center pl-20 gap-5 py-6">
// 										<td
// 											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
// 											onClick={() => handleEditClick(category)}
// 										>
// 											Edit
// 										</td>
// 										<button
// 											type="button"
// 											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
// 											onClick={() =>
// 												handleDeleteClick(
// 													category.catalogueCategoryId
// 												)
// 											}
// 											// Delete function
// 										>
// 											Delete
// 										</button>
// 									</div>
// 								</tr>
// 							))
// 						) : (
// 							<tr>
// 								<td
// 									colSpan={2}
// 									className="px-4 py-2 text-center text-gray-500"
// 								>
// 									No categories added yet.
// 								</td>
// 							</tr>
// 						)}
// 					</tbody>
// 				</table>
// 			</div>

// 			{isCategoryOpen && (
// 				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
// 					<div className="bg-white rounded-lg p-6 w-96">
// 						<div className="flex justify-between items-center mb-4">
// 							<h2 className="text-2xl font-semibold">
// 								Add Catalogue Category
// 							</h2>
// 							<X
// 								className="cursor-pointer"
// 								onClick={() => setIsCategoryOpen(false)}
// 							/>
// 						</div>
// 						<input
// 							type="text"
// 							value={catalogueCategoryName}
// 							onChange={(e) =>
// 								setCatalogueCategoryName(e.target.value)
// 							}
// 							className="border-2 w-full p-2 rounded-lg"
// 							placeholder="Catalogue Category Name"
// 						/>
// 						<button
// 							onClick={handleAddCategory}
// 							className="w-full bg-indigo-700 text-white py-2 rounded-lg mt-4"
// 						>
// 							{selectedCategory ? "Update Category" : "Add Category"}
// 						</button>
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	)
// }


"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { X } from "lucide-react"
import {
	addCategoryToStore,
	deleteCategory,
	fetchCategoriesForStore,
	updateCategory,
} from "../../service/category"
import { fetchProductsForCategory, updateProduct } from "../../service/ProductService"

export default function Page() {
	interface Category {
		catalogueCategoryId: string
		catalogueCategoryName: string
		discount?: number // Added discount field to category interface
	}

	interface Product {
		id: string
		catalogueProductName?: string
		productDescription?: string
		productImageUrl?: string
		catalogueCategoryId?: string
		price?: string
		discount?: number
		finalPrice?: string
		stock?: number
	}

	const [catalogueCategoryName, setCatalogueCategoryName] = useState("")
	const [categories, setCategories] = useState<Category[]>([])
	const [isCategoryOpen, setIsCategoryOpen] = useState(false)
	const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
	const [storeId, setStoreId] = useState<string | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
	const [categoryDiscount, setCategoryDiscount] = useState<number>(0)
	const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)

	// Simulated way to get the storeId after login (should be retrieved from auth or context)
	useEffect(() => {
		const storedStoreId = localStorage.getItem("storeId")
		if (storedStoreId) {
			setStoreId(storedStoreId)
		}
	}, [])
	
	useEffect(() => {
		async function fetchCategories() {
			const storeId = localStorage.getItem("storeId") // Retrieve storeId from localStorage
			if (!storeId) return

			try {
				const fetchedCategories =
					(await fetchCategoriesForStore(storeId)) || [] // Ensure it's always an array

				// Store category IDs in localStorage
				if (fetchedCategories.length > 0) {
					const categoryIds = fetchedCategories.map((cat) => cat.id)
					localStorage.setItem(
						"categoryIds",
						JSON.stringify(categoryIds)
					) // Store array of category IDs
				}

				setCategories(
					fetchedCategories.map((cat) => ({
						catalogueCategoryId: cat.id,
						catalogueCategoryName:
							(cat as any).catalogueCategoryName ||
							"Unnamed Category",
						discount: (cat as any).discount || 0,
					}))
				)
			} catch (error) {
				toast.error("Failed to fetch categories.")
			}
		}

		fetchCategories()
	}, [storeId])

	const handleEditClick = (category: Category) => {
		setSelectedCategory(category)
		setCatalogueCategoryName(category.catalogueCategoryName)
		setIsCategoryOpen(true)
	}
	
	const handleAddCategory = async () => {
		try {
			const storeStoreId = localStorage.getItem("storeId")
			if (!storeStoreId) {
				toast.error("Store ID not found.")
				return
			}

			if (selectedCategory) {
				// Update category
				await updateCategory(
					storeStoreId,
					selectedCategory.catalogueCategoryId,
					{
						catalogueCategoryName,
						discount: selectedCategory.discount || 0,
					}
				)
				toast.success("Category Updated Successfully")

				// Close modal before fetching categories
				setIsCategoryOpen(false)

				// Fetch updated categories
				const updatedCategories = await fetchCategoriesForStore(
					storeStoreId
				)
				setCategories(
					(updatedCategories || []).map((cat) => ({
						catalogueCategoryId: cat.id,
						catalogueCategoryName:
							(cat as any).catalogueCategoryName ||
							"Unnamed Category",
						discount: (cat as any).discount || 0,
					}))
				)
			} else {
				// Add new category
				const newCategory = { 
					catalogueCategoryName,
					discount: 0 // Default discount is 0
				}
				const categoryId = await addCategoryToStore(
					storeStoreId,
					newCategory
				)

				if (categoryId) {
					setCategories([
						...categories,
						{
							catalogueCategoryId: categoryId,
							catalogueCategoryName,
							discount: 0,
						},
					])
					setCatalogueCategoryName("")

					// Close modal before showing toast
					setIsCategoryOpen(false)

					// Ensure the toast appears after the modal closes
					setTimeout(() => {
						toast.success("Category Added Successfully")
					}, 300)
				}
			}
		} catch (error) {
			toast.error("Error adding category")
		}
	}

	const handleDeleteClick = async (categoryId: string) => {
		const storeStoreId = localStorage.getItem("storeId") // Fetch storeId from localStorage
		if (!storeStoreId) {
			toast.error("Store ID not found.")
			return
		}

		const confirmDelete = window.confirm(
			"Are you sure you want to delete this Category?"
		)
		if (!confirmDelete) return

		try {
			await deleteCategory(storeStoreId, categoryId) // Call the delete function
			toast.success("Category deleted successfully!")

			// Fetch updated category list
			const updatedCategories = await fetchCategoriesForStore(
				storeStoreId
			)
			setCategories(
				(updatedCategories || []).map((cat) => ({
					catalogueCategoryId: cat.id,
					catalogueCategoryName:
						(cat as any).catalogueCategoryName || "Unnamed Category",
					discount: (cat as any).discount || 0,
				}))
			)
		} catch (error) {
			console.error("Error deleting category:", error)
			toast.error("Error deleting Category!")
		}
	}

	// Function to open discount modal for a category
	const openDiscountModal = (category: Category) => {
		setSelectedCategory(category)
		setCategoryDiscount(category.discount || 0)
		setIsDiscountModalOpen(true)
	}

	// Calculate final price after discount
	const calculateFinalPrice = (price: string, discount: number): string => {
		const priceNum = parseFloat(price) || 0
		const discountNum = discount || 0
		const discountAmount = priceNum * (discountNum / 100)
		return (priceNum - discountAmount).toFixed(2)
	}

	// Function to apply discount to all products in a category
	const applyDiscountToCategory = async () => {
		if (!selectedCategory || !storeId) return
		
		try {
			setIsApplyingDiscount(true)
			
			// First update the category's discount value
			await updateCategory(
				storeId,
				selectedCategory.catalogueCategoryId,
				{
					...selectedCategory,
					discount: categoryDiscount
				}
			)
			
			// Fetch all products in this category
			const products = await fetchProductsForCategory(
				storeId, 
				selectedCategory.catalogueCategoryId
			) as Product[]
			
			// Update each product with the new discount
			const updatePromises = products.map(product => 
				updateProduct(
					storeId,
					selectedCategory.catalogueCategoryId,
					product.id,
					{
						...product,
						discount: categoryDiscount,
						finalPrice: calculateFinalPrice(product.price || '0', categoryDiscount)
					}
				)
			)
			
			await Promise.all(updatePromises)
			
			// Update the categories in state
			setCategories(prevCategories => 
				prevCategories.map(cat => 
					cat.catalogueCategoryId === selectedCategory.catalogueCategoryId
						? { ...cat, discount: categoryDiscount }
						: cat
				)
			)
			
			toast.success(`Discount of ${categoryDiscount}% applied to all products in ${selectedCategory.catalogueCategoryName}!`)
			setIsDiscountModalOpen(false)
			setIsApplyingDiscount(false)
		} catch (error) {
			console.error("Error applying discount:", error)
			toast.error("Failed to apply discount to all products.")
			setIsApplyingDiscount(false)
		}
	}
	
	// Function to remove discount from all products in a category
	const removeDiscountFromCategory = async () => {
		if (!selectedCategory || !storeId) return
		
		try {
			setIsApplyingDiscount(true)
			
			// Update the category's discount value to 0
			await updateCategory(
				storeId,
				selectedCategory.catalogueCategoryId,
				{
					...selectedCategory,
					discount: 0
				}
			)
			
			// Fetch all products in this category
			const products = await fetchProductsForCategory(
				storeId, 
				selectedCategory.catalogueCategoryId
			) as Product[]
			
			// Update each product to remove discount
			const updatePromises = products.map(product => 
				updateProduct(
					storeId,
					selectedCategory.catalogueCategoryId,
					product.id,
					{
						...product,
						discount: 0,
						finalPrice: product.price || '0'
					}
				)
			)
			
			await Promise.all(updatePromises)
			
			// Update the categories in state
			setCategories(prevCategories => 
				prevCategories.map(cat => 
					cat.catalogueCategoryId === selectedCategory.catalogueCategoryId
						? { ...cat, discount: 0 }
						: cat
				)
			)
			
			toast.success(`Discount removed from all products in ${selectedCategory.catalogueCategoryName}!`)
			setIsDiscountModalOpen(false)
			setIsApplyingDiscount(false)
		} catch (error) {
			console.error("Error removing discount:", error)
			toast.error("Failed to remove discount from products.")
			setIsApplyingDiscount(false)
		}
	}

	return (
		<div className="p-6 flex-grow">
			<div className="flex justify-between items-center gap-5">
				<h2 className="font-semibold text-5xl">
					Manage Categories
				</h2>
				<button
					onClick={() => setIsCategoryOpen(true)}
					className="bg-blue-700 text-white px-6 py-3 rounded-md hover:opacity-75"
				>
					+ Add Catalogue Category
				</button>
			</div>

			<div className="bg-white rounded-lg p-5 mt-10">
				{/* <h3 className="text-3xl font-semibold mb-4">
					Catalogue Categories
				</h3> */}
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gray-100">
							{/* <th className="px-4 py-2">Catalogue Category ID</th> */}
							<th className="px-4 py-2">Catalogue Category Name</th>
							<th className="px-4 py-2">Discount %</th>
							<th className="px-4 py-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{categories.length > 0 ? (
							categories.map((category) => (
								<tr
									key={category.catalogueCategoryId}
									className="border-t text-center"
								>
									{/* <td className="px-4 py-2">
										{category.catalogueCategoryId}
									</td> */}
									<td className="px-4 py-2">
										{category.catalogueCategoryName}
									</td>
									<td className="px-4 py-2">
										{category.discount ? (
											<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
												{category.discount}%
											</span>
										) : (
											<span className="text-gray-500">No discount</span>
										)}
									</td>
									<td className="flex justify-center items-center gap-2 py-6">
										<button
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleEditClick(category)}
										>
											Edit
										</button>
										<button
											type="button"
											className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => openDiscountModal(category)}
										>
											Set Discount
										</button>
										<button
											type="button"
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() =>
												handleDeleteClick(
													category.catalogueCategoryId
												)
											}
										>
											Delete
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={4}
									className="px-4 py-2 text-center text-gray-500"
								>
									No categories added yet.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{isCategoryOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-96">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold">
								{selectedCategory ? "Edit Category" : "Add Catalogue Category"}
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => setIsCategoryOpen(false)}
							/>
						</div>
						<input
							type="text"
							value={catalogueCategoryName}
							onChange={(e) =>
								setCatalogueCategoryName(e.target.value)
							}
							className="border-2 w-full p-2 rounded-lg"
							placeholder="Catalogue Category Name"
						/>
						<button
							onClick={handleAddCategory}
							className="w-full bg-indigo-700 text-white py-2 rounded-lg mt-4"
						>
							{selectedCategory ? "Update Category" : "Add Category"}
						</button>
					</div>
				</div>
			)}

			{/* Category Discount Modal */}
			{isDiscountModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-96">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold">
								Set Discount for {selectedCategory?.catalogueCategoryName}
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => setIsDiscountModalOpen(false)}
							/>
						</div>
						<div className="mb-4">
							<p className="text-sm text-gray-600 mb-2">
								This will apply the discount to all products in this category.
							</p>
							<label className="block mb-2 font-medium">Discount Percentage:</label>
							<input
								type="number"
								value={categoryDiscount}
								onChange={(e) => setCategoryDiscount(Number(e.target.value))}
								className="border-2 w-full p-2 rounded-lg"
								min="0"
								max="100"
								step="0.1"
								placeholder="Enter discount percentage"
							/>
						</div>
						<div className="flex gap-2">
							<button
								onClick={applyDiscountToCategory}
								disabled={isApplyingDiscount}
								className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:opacity-75 disabled:opacity-50"
							>
								{isApplyingDiscount ? "Applying..." : "Apply Discount"}
							</button>
							{categoryDiscount > 0 && (
								<button
									onClick={removeDiscountFromCategory}
									disabled={isApplyingDiscount}
									className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:opacity-75 disabled:opacity-50"
								>
									{isApplyingDiscount ? "Removing..." : "Remove Discount"}
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
