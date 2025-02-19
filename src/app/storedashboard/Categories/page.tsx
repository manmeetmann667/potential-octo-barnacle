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

export default function Page() {
	interface Category {
		catalogueCategoryId: string
		catalogueCategoryName: string
	}

	const [catalogueCategoryName, setCatalogueCategoryName] =
		useState("")
	const [categories, setCategories] = useState<Category[]>([])
	const [isCategoryOpen, setIsCategoryOpen] = useState(false)
	const [storeId, setStoreId] = useState<string | null>(null)
	const [selectedCategory, setSelectedCategory] =
		useState<Category | null>(null)

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

			console.log(selectedCategory?.catalogueCategoryId)

			if (selectedCategory) {
				// Update category
				await updateCategory(
					storeStoreId,
					selectedCategory.catalogueCategoryId,
					{
						catalogueCategoryName,
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
					}))
				)
			} else {
				// Add new category
				const newCategory = { catalogueCategoryName }
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
			console.log(
				"Deleting category:",
				categoryId,
				"from store:",
				storeStoreId
			)
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
				}))
			)
		} catch (error) {
			console.error("Error deleting category:", error)
			toast.error("Error deleting Category!")
		}
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">
					Manage Agents & Categories
				</h2>
				<button
					onClick={() => setIsCategoryOpen(true)}
					className="bg-blue-700 text-white px-6 py-3 rounded-md hover:opacity-75"
				>
					+ Add Catalogue Category
				</button>
			</div>

			<div className="bg-white rounded-lg p-5 mt-10">
				<h3 className="text-3xl font-semibold mb-4">
					Catalogue Categories
				</h3>
				<table className="w-full border-collapse">
					<thead>
						<tr className="bg-gray-100">
							<th className="px-4 py-2">Catalogue Category ID</th>
							<th className="px-4 py-2">Catalogue Category Name</th>
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
									<td className="px-4 py-2">
										{category.catalogueCategoryId}
									</td>
									<td className="px-4 py-2">
										{category.catalogueCategoryName}
									</td>
									<div className="flex items-center pl-20 gap-5 py-6">
										<td
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleEditClick(category)}
										>
											Edit
										</td>
										<button
											type="button"
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() =>
												handleDeleteClick(
													category.catalogueCategoryId
												)
											}
											// Delete function
										>
											Delete
										</button>
									</div>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={2}
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
								Add Catalogue Category
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
		</div>
	)
}
