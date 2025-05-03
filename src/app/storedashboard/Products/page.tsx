"use client"
import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { X } from "lucide-react"
import * as XLSX from "xlsx"
import { faDownload } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import {
	addProductToCategory,
	updateProduct,
	deleteProduct,
	fetchProductsForCategory,
} from "../../service/ProductService"
import { fetchCategoriesForStore } from "@/app/service/category"
import {
	addDoc,
	collection,
	getDocs,
	query,
	serverTimestamp,
	updateDoc,
	where,
} from "firebase/firestore"
import { db } from "@/app/lib/firebase"

interface Product {
	id: string
	catalogueProductName?: string
	productDescription?: string
	productImageUrl?: string
	catalogueCategoryId?: string
	catalogueCategoryName?: string
	stock?: number
	price?: string
	discount?: number
	finalPrice?: string
	createdAt?: any
}

interface Category {
	catalogueCategoryId: string
	catalogueCategoryName: string
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [categoryNames, setCategoryNames] = useState<string[]>([])
	const [isProductModalOpen, setIsProductModalOpen] = useState(false)
	const [isDiscountModalOpen, setIsDiscountModalOpen] =
		useState(false)
	const [storeId, setStoreId] = useState<string | null>(null)
	const [selectedCategoryId, setSelectedCategoryId] = useState<
		string | null
	>("all")
	const [selectedProduct, setSelectedProduct] =
		useState<Product | null>(null)
	const [currentDiscount, setCurrentDiscount] = useState<number>(0)
	const [excelFile, setExcelFile] = useState<File | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [isImageModalOpen, setIsImageModalOpen] = useState(false)
	const [imageUrlInput, setImageUrlInput] = useState("")

	const [formData, setFormData] = useState({
		catalogueProductName: "",
		productDescription: "",
		productImageUrl: "",
		catalogueCategoryId: "",
		price: "",
		stock: 0,
		discount: 0,
		finalPrice: "",
	})

	useEffect(() => {
		const storedStoreId = localStorage.getItem("storeId")
		if (storedStoreId) {
			setStoreId(storedStoreId)
		}
	}, [])

	const openImageModal = (product: Product) => {
		setSelectedProduct(product)
		setImageUrlInput(product.productImageUrl || "")
		setIsImageModalOpen(true)
	}

	const handleSaveImageUrl = async () => {
		if (
			!selectedProduct ||
			!storeId ||
			!selectedProduct.catalogueCategoryId ||
			!selectedProduct.id
		) {
			toast.error("Unable to update image URL")
			return
		}

		try {
			await updateProduct(
				storeId,
				selectedProduct.catalogueCategoryId,
				selectedProduct.id,
				{
					...selectedProduct,
					productImageUrl: imageUrlInput,
				}
			)
			toast.success("Image URL updated successfully!")
			setIsImageModalOpen(false)

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to update image URL")
		}
	}

	useEffect(() => {
		async function fetchCategoryNames(
			storeId: string
		): Promise<string[]> {
			const snapshot = await getDocs(
				collection(db, `stores/${storeId}/categories`)
			)
			return snapshot.docs.map(
				(doc) => doc.data().catalogueCategoryName
			)
		}

		async function fetchData() {
			if (!storeId) return
			setIsLoading(true)

			try {
				const names = await fetchCategoryNames(storeId)
				setCategoryNames(names)

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
				await fetchAllProducts(formattedCategories)
			} catch (error) {
				console.error("Error fetching data:", error)
				toast.error("Failed to fetch data.")
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [storeId])

	const fetchAllProducts = async (categoriesList: Category[]) => {
		if (!storeId || categoriesList.length === 0) return
		setIsLoading(true)

		try {
			const allProductsPromises = categoriesList.map((category) =>
				fetchProductsForCategory(
					storeId,
					category.catalogueCategoryId
				)
			)

			const productsArrays = await Promise.all(allProductsPromises)
			const allProducts = productsArrays
				.flat()
				.filter(
					(products) => products !== null && products !== undefined
				)
				.map((product) => ({
					...product,
					price: product.price ?? "0", // Default to '0' if price is undefined
					discount: product.discount ?? 0, // Default to 0 if discount is undefined
					finalPrice: calculateFinalPrice(
						product.price ?? "0",
						product.discount ?? 0
					),
				})) as Product[]

			setProducts(allProducts)
		} catch (error) {
			console.error("Error fetching all products:", error)
			toast.error("Failed to fetch all products.")
		} finally {
			setIsLoading(false)
		}
	}

	const fetchProducts = async (categoryId: string) => {
		if (!storeId) return
		setIsLoading(true)

		if (categoryId === "all") {
			await fetchAllProducts(categories)
			return
		}

		try {
			const fetchedProducts = await fetchProductsForCategory(
				storeId,
				categoryId
			)
			setProducts(
				(fetchedProducts ?? []).map((product) => ({
					...product,
					price: product.price ?? "0", // Default to '0' if price is undefined
					discount: product.discount ?? 0, // Default to 0 if discount is undefined
					finalPrice: calculateFinalPrice(
						product.price ?? "0",
						product.discount ?? 0
					),
				}))
			)
		} catch (error) {
			console.error("Error fetching products:", error)
			toast.error("Failed to fetch products.")
		} finally {
			setIsLoading(false)
		}
	}

	const handleAddProduct = async () => {
		if (
			!storeId ||
			!formData.catalogueProductName.trim() ||
			!formData.catalogueCategoryId
		) {
			toast.error("Product name and category are required!")
			return
		}

		try {
			const newProduct = {
				catalogueProductName: formData.catalogueProductName,
				productDescription: formData.productDescription,
				productImageUrl: formData.productImageUrl,
				catalogueCategoryId: formData.catalogueCategoryId,
				catalogueCategoryName:
					categories.find(
						(cat) =>
							cat.catalogueCategoryId === formData.catalogueCategoryId
					)?.catalogueCategoryName || "",
				stock: formData.stock,
				price: formData.price,
				discount: formData.discount,
				finalPrice: calculateFinalPrice(
					formData.price || "0",
					formData.discount || 0
				),
				createdAt: serverTimestamp(),
			}

			console.log("Adding product to Firestore:", {
				storeId,
				categoryId: formData.catalogueCategoryId,
				productData: newProduct,
			})

			const productRef = await addDoc(
				collection(
					db,
					`stores/${storeId}/categories/${formData.catalogueCategoryId}/products`
				),
				newProduct
			)

			console.log("Product added with ID:", productRef.id)

			toast.success("Product added successfully!")
			setIsProductModalOpen(false)
			resetFormData()

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(formData.catalogueCategoryId)
			}
		} catch (error: any) {
			console.error(
				"Error adding product to Firestore:",
				error.message,
				error.stack
			)
			toast.error(`Failed to add product: ${error.message}`)
		}
	}

	const handleEditProduct = async () => {
		if (
			!storeId ||
			!selectedProduct?.catalogueCategoryId ||
			!selectedProduct?.id
		)
			return

		try {
			const updatedProduct = {
				...formData,
				finalPrice: calculateFinalPrice(
					formData.price || "0",
					formData.discount || 0
				),
			}

			await updateProduct(
				storeId,
				selectedProduct.catalogueCategoryId,
				selectedProduct.id,
				updatedProduct
			)
			toast.success("Product updated successfully!")
			setIsProductModalOpen(false)

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to update product.")
		}
	}

	const handleDeleteProduct = async (
		productId: string,
		productCategoryId: string
	) => {
		if (!storeId || !productCategoryId) return
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this product?"
		)
		if (!confirmDelete) return

		try {
			await deleteProduct(storeId, productCategoryId, productId)
			toast.success("Product deleted successfully!")

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to delete product.")
		}
	}

	const handleCategoryChange = async (categoryId: string) => {
		setSelectedCategoryId(categoryId)
		await fetchProducts(categoryId)
	}

	const openEditModal = (product: Product) => {
		setSelectedProduct(product)
		setFormData({
			catalogueProductName: product.catalogueProductName || "",
			productDescription: product.productDescription || "",
			productImageUrl: product.productImageUrl || "",
			catalogueCategoryId: product.catalogueCategoryId || "",
			stock: product.stock || 0,
			price: product.price ?? "0", // Default to '0' if price is undefined
			discount: product.discount ?? 0, // Default to 0 if discount is undefined
			finalPrice:
				product.finalPrice ||
				calculateFinalPrice(
					product.price ?? "0",
					product.discount ?? 0
				),
		})
		setIsProductModalOpen(true)
	}

	const openDiscountModal = (product: Product) => {
		setSelectedProduct(product)
		setCurrentDiscount(product.discount ?? 0)
		setIsDiscountModalOpen(true)
	}

	const handleUpdateDiscount = async () => {
		if (
			!selectedProduct ||
			!storeId ||
			!selectedProduct.catalogueCategoryId ||
			!selectedProduct.id
		)
			return

		try {
			const finalPrice = calculateFinalPrice(
				selectedProduct.price ?? "0",
				currentDiscount
			)

			await updateProduct(
				storeId,
				selectedProduct.catalogueCategoryId,
				selectedProduct.id,
				{
					...selectedProduct,
					discount: currentDiscount,
					price: selectedProduct.price ?? "0", // Ensure price is defined
					finalPrice: finalPrice,
				}
			)
			toast.success("Discount updated successfully!")
			setIsDiscountModalOpen(false)

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to update discount.")
		}
	}

	const handleRemoveDiscount = async () => {
		if (
			!selectedProduct ||
			!storeId ||
			!selectedProduct.catalogueCategoryId ||
			!selectedProduct.id
		)
			return

		try {
			const finalPrice = calculateFinalPrice(
				selectedProduct.price ?? "0",
				0
			)

			await updateProduct(
				storeId,
				selectedProduct.catalogueCategoryId,
				selectedProduct.id,
				{
					...selectedProduct,
					discount: 0,
					price: selectedProduct.price ?? "0", // Ensure price is defined
					finalPrice: finalPrice,
				}
			)
			toast.success("Discount removed successfully!")
			setIsDiscountModalOpen(false)
			setCurrentDiscount(0)

			if (selectedCategoryId === "all") {
				await fetchAllProducts(categories)
			} else {
				await fetchProducts(selectedCategoryId!)
			}
		} catch (error) {
			toast.error("Failed to remove discount.")
		}
	}

	const resetFormData = () => {
		setFormData({
			catalogueProductName: "",
			productDescription: "",
			productImageUrl: "",
			catalogueCategoryId: "",
			stock: 0,
			price: "",
			discount: 0,
			finalPrice: "",
		})
	}

	const downloadExcelTemplate = async () => {
		if (categoryNames.length === 0) {
			toast.warning("No categories available to create template")
			return
		}

		const workbook = new ExcelJS.Workbook()
		const sheet = workbook.addWorksheet("ProductsTemplate")

		sheet.columns = [
			{ header: "Product Name", key: "productName", width: 25 },
			{ header: "Description", key: "description", width: 30 },
			{ header: "Image URL", key: "imageUrl", width: 30 },
			{ header: "Category", key: "category", width: 20 },
			{ header: "Stock", key: "stock", width: 10 },
			{ header: "Price", key: "price", width: 10 },
			{ header: "Discount (%)", key: "discount", width: 15 },
		]

		sheet.addRow({
			productName: "",
			description: "",
			imageUrl: "",
			category: "",
			stock: 0,
			price: "",
			discount: 0,
		})

		const categorySheet = workbook.addWorksheet("CategoryList")
		categorySheet.state = "veryHidden"

		categoryNames.forEach((name, index) => {
			categorySheet.getCell(`A${index + 1}`).value = name
		})

		for (let i = 2; i <= 100; i++) {
			sheet.getCell(`D${i}`).dataValidation = {
				type: "list",
				allowBlank: true,
				formulae: [`=CategoryList!$A$1:$A$${categoryNames.length}`],
				showErrorMessage: true,
				errorStyle: "warning",
				errorTitle: "Invalid Category",
				error: "Please select a valid category or type a new one.",
			}
		}

		const buffer = await workbook.xlsx.writeBuffer()
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		})
		saveAs(blob, "Products_Template_with_Dropdown.xlsx")
	}

	const renderImageCell = (product: Product) => {
		return (
			<td className="px-4 py-3">
				<div className="flex justify-center">
					{product.productImageUrl ? (
						<img
							src={product.productImageUrl}
							alt={product.catalogueProductName}
							className="h-14 w-14 rounded-md object-cover shadow-sm cursor-pointer"
							onClick={() => openImageModal(product)}
						/>
					) : (
						<button
							onClick={() => openImageModal(product)}
							className="h-14 w-14 flex items-center justify-center bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
						>
							<span className="text-xs text-center">
								Click to Add Image
							</span>
						</button>
					)}
				</div>
			</td>
		)
	}

	const handleExcelUpload = async () => {
		if (!excelFile || !storeId) return

		try {
			const data = await excelFile.arrayBuffer()
			const workbook = XLSX.read(data)
			const worksheet = workbook.Sheets[workbook.SheetNames[0]]
			const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

			for (const item of jsonData) {
				const productName =
					item["Product Name"]?.toString().trim() || ""
				const categoryName = item["Category"]?.toString().trim() || ""

				if (!productName || !categoryName) {
					toast.warning(
						`Skipping row - Product Name and Category are required`
					)
					continue
				}

				const discount = parseFloat(item["Discount (%)"]) || 0
				const price = item["Price"]?.toString() || "0" // Default to '0' for price
				const stock = parseInt(item["Stock"]) || 0
				const description = item["Description"]?.toString() || ""
				const imageUrl = item["Image URL"]?.toString() || ""

				const existingCategory = categories.find(
					(cat) =>
						cat.catalogueCategoryName.toLowerCase() ===
						categoryName.toLowerCase()
				)

				let categoryId = existingCategory?.catalogueCategoryId || ""

				if (!categoryId) {
					const categoryQuery = await getDocs(
						query(
							collection(db, `stores/${storeId}/categories`),
							where("catalogueCategoryName", "==", categoryName)
						)
					)

					if (!categoryQuery.empty) {
						categoryId = categoryQuery.docs[0].id
					} else {
						const newCategoryDoc = await addDoc(
							collection(db, `stores/${storeId}/categories`),
							{
								catalogueCategoryName: categoryName,
								catalogueCategoryId: "",
							}
						)

						await updateDoc(newCategoryDoc, {
							catalogueCategoryId: newCategoryDoc.id,
						})

						categoryId = newCategoryDoc.id

						setCategories((prev) => [
							...prev,
							{
								catalogueCategoryId: categoryId,
								catalogueCategoryName: categoryName,
							},
						])
					}
				}

				const productData = {
					catalogueCategoryId: categoryId,
					catalogueCategoryName: categoryName,
					catalogueProductName: productName,
					price: price,
					stock: stock,
					productDescription: description,
					productImageUrl: imageUrl,
					discount: discount,
					finalPrice: calculateFinalPrice(price, discount),
					createdAt: serverTimestamp(),
				}

				console.log("Adding product to Firestore from Excel:", {
					storeId,
					categoryId,
					productData,
				})

				await addDoc(
					collection(
						db,
						`stores/${storeId}/categories/${categoryId}/products`
					),
					productData
				)
			}

			toast.success("Products imported successfully!")
			setExcelFile(null)
			await fetchAllProducts(categories)
		} catch (error: any) {
			console.error(
				"Error importing products:",
				error.message,
				error.stack
			)
			toast.error(`Failed to import products: ${error.message}`)
		}
	}

	const calculateFinalPrice = (
		price: string,
		discount: number
	): string => {
		const priceNum = parseFloat(price) || 0
		const discountNum = discount || 0
		const discountAmount = priceNum * (discountNum / 100)
		return (priceNum - discountAmount).toFixed(2)
	}

	const LoadingRow = () => (
		<tr className="animate-pulse">
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-14 w-14 bg-gray-200 rounded-md"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="h-4 bg-gray-200 rounded"></div>
			</td>
			<td className="px-4 py-3">
				<div className="flex gap-2">
					<div className="h-8 w-12 bg-gray-200 rounded-lg"></div>
					<div className="h-8 w-12 bg-gray-200 rounded-lg"></div>
				</div>
			</td>
		</tr>
	)

	return (
		<div className="p-6">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">Manage Products</h2>
				<div className="flex gap-4">
					<button
						onClick={() => {
							const fileInput = document.createElement("input")
							fileInput.type = "file"
							fileInput.accept = ".xlsx,.xls"
							fileInput.onchange = (e) => {
								const files = (e.target as HTMLInputElement).files
								if (files && files[0]) {
									setExcelFile(files[0])
									setShowModal(true)
								}
							}
							fileInput.click()
						}}
						className="bg-green-700 text-white px-4 py-3 rounded-md hover:opacity-75"
					>
						Import products from Excel
					</button>
					<button
						onClick={() => setIsProductModalOpen(true)}
						className="bg-blue-700 text-white px-4 py-3 rounded-md hover:opacity-75"
					>
						+ Add Product
					</button>
					<button
						onClick={downloadExcelTemplate}
						className="bg-purple-700 text-center text-white px-6 py-3 rounded-md hover:opacity-75 mr-14 flex items-center gap-2"
					>
						<FontAwesomeIcon icon={faDownload} />
						<span>Excel Format</span>
					</button>
				</div>
			</div>

			<div className="mt-6">
				<select
					value={selectedCategoryId || ""}
					onChange={(e) => handleCategoryChange(e.target.value)}
					className="border-2 w-full p-2 rounded-lg mb-2"
					disabled={isLoading}
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
							<th className="px-4 py-2">Actual Price</th>
							<th className="px-4 py-2">Discount %</th>
							<th className="px-4 py-2">Final Price</th>
							<th className="px-4 py-2">Actions</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<>
								<LoadingRow />
								<LoadingRow />
								<LoadingRow />
								<LoadingRow />
								<LoadingRow />
							</>
						) : products.length > 0 ? (
							products.map((product) => (
								<tr
									key={product.id}
									className="border-b hover:bg-gray-50 transition-colors"
								>
									<td className="px-4 py-3">
										{product.catalogueProductName}
									</td>
									<td className="px-4 py-3">
										<div
											className="max-w-xs truncate"
											title={product.productDescription}
										>
											{product.productDescription}
										</div>
									</td>
									{renderImageCell(product)}
									<td className="px-4 py-3">
										{product.catalogueCategoryName}
									</td>
									<td className="px-4 py-3">{product.stock}</td>
									<td className="px-4 py-3 font-medium">
										₹{product.price ?? "0"}
									</td>
									<td className="px-4 py-3">
										{product.discount && product.discount !== 0 ? (
											<div className="flex flex-col items-center gap-2">
												<span className="font-medium">
													{product.discount}%
												</span>
												<div className="flex gap-1">
													<button
														onClick={() => openDiscountModal(product)}
														className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:opacity-75 cursor-pointer"
													>
														Edit
													</button>
													<button
														onClick={() => handleRemoveDiscount()}
														className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:opacity-75 cursor-pointer"
													>
														Remove
													</button>
												</div>
											</div>
										) : (
											<div className="flex justify-center">
												<button
													onClick={() => openDiscountModal(product)}
													className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:opacity-75 cursor-pointer"
												>
													Add Discount
												</button>
											</div>
										)}
									</td>
									<td className="px-4 py-3 font-medium">
										₹
										{product.finalPrice ||
											calculateFinalPrice(
												product.price ?? "0",
												product.discount ?? 0
											)}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-2">
											<button
												onClick={() => openEditModal(product)}
												className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											>
												Edit
											</button>
											<button
												onClick={() =>
													handleDeleteProduct(
														product.id!,
														product.catalogueCategoryId!
													)
												}
												className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={9}
									className="px-4 py-6 text-center text-gray-500"
								>
									<div className="flex flex-col items-center justify-center space-y-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-8 w-8"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={1.5}
												d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
											/>
										</svg>
										<span>No products added yet.</span>
									</div>
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
								{selectedProduct ? "Edit Product" : "Add Product"}
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => {
									setIsProductModalOpen(false)
									setSelectedProduct(null)
									resetFormData()
								}}
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
							required
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
							type="number"
							value={formData.stock}
							onChange={(e) =>
								setFormData({
									...formData,
									stock: parseInt(e.target.value) || 0,
								})
							}
							placeholder="Stock"
							className="border-2 w-full p-2 rounded-lg mb-2"
							min="0"
						/>
						<input
							type="number"
							value={formData.price}
							onChange={(e) =>
								setFormData({
									...formData,
									price: e.target.value,
								})
							}
							placeholder="Price"
							className="border-2 w-full p-2 rounded-lg mb-2"
							min="0"
							step="0.01"
							required
						/>
						<input
							type="number"
							value={formData.discount}
							onChange={(e) =>
								setFormData({
									...formData,
									discount: parseFloat(e.target.value) || 0,
								})
							}
							placeholder="Discount %"
							className="border-2 w-full p-2 rounded-lg mb-2"
							min="0"
							max="100"
							step="0.1"
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
							required
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
			{isImageModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-96">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold">
								{selectedProduct?.productImageUrl
									? "Update Image URL"
									: "Add Image URL"}
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => setIsImageModalOpen(false)}
							/>
						</div>
						<div className="mb-4">
							<label className="block mb-2">Image URL:</label>
							<input
								type="text"
								value={imageUrlInput}
								onChange={(e) => setImageUrlInput(e.target.value)}
								placeholder="Enter image URL"
								className="border-2 w-full p-2 rounded-lg"
							/>
							{imageUrlInput && (
								<div className="mt-4">
									<p className="mb-2">Preview:</p>
									<img
										src={imageUrlInput}
										alt="Preview"
										className="h-20 w-20 object-cover rounded-md"
										onError={(e) => {
											const target = e.target as HTMLImageElement
											target.style.display = "none"
										}}
									/>
								</div>
							)}
						</div>
						<div className="flex gap-2">
							<button
								onClick={handleSaveImageUrl}
								className="flex-1 bg-blue-700 text-white py-2 rounded-lg hover:opacity-75"
							>
								Save
							</button>
							<button
								onClick={() => setIsImageModalOpen(false)}
								className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:opacity-75"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
			{showModal && excelFile && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
						<h2 className="text-xl font-bold mb-4">
							Upload Excel File
						</h2>
						<p className="mb-4">
							Selected File: <strong>{excelFile.name}</strong>
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={() => {
									setShowModal(false)
									setExcelFile(null)
								}}
								className="bg-gray-500 text-white px-4 py-2 rounded hover:opacity-75"
							>
								Cancel
							</button>
							<button
								onClick={() => {
									handleExcelUpload()
									setShowModal(false)
								}}
								className="bg-blue-700 text-white px-4 py-2 rounded hover:opacity-75"
							>
								Upload
							</button>
						</div>
					</div>
				</div>
			)}
			{isDiscountModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white rounded-lg p-6 w-96">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-2xl font-semibold">
								{selectedProduct?.discount === 0
									? "Add Discount"
									: "Edit Discount"}{" "}
								for {selectedProduct?.catalogueProductName}
							</h2>
							<X
								className="cursor-pointer"
								onClick={() => setIsDiscountModalOpen(false)}
							/>
						</div>
						<div className="mb-4">
							<label className="block mb-2">
								Current Price: ₹{selectedProduct?.price ?? "0"}
							</label>
							<input
								type="number"
								value={currentDiscount}
								onChange={(e) =>
									setCurrentDiscount(parseFloat(e.target.value) || 0)
								}
								placeholder="Discount %"
								className="border-2 w-full p-2 rounded-lg"
								min="0"
								max="100"
								step="0.1"
							/>
							{currentDiscount !== 0 && (
								<div className="mt-2">
									<p>
										Final Price: ₹
										{calculateFinalPrice(
											selectedProduct?.price ?? "0",
											currentDiscount
										)}
									</p>
									<p>
										(Original: ₹{selectedProduct?.price ?? "0"},
										Discount: {currentDiscount}%)
									</p>
								</div>
							)}
						</div>
						<div className="flex gap-2">
							<button
								onClick={handleUpdateDiscount}
								className={`flex-1 ${
									selectedProduct?.discount === 0
										? "bg-green-700"
										: "bg-blue-700"
								} text-white py-2 rounded-lg hover:opacity-75`}
							>
								{selectedProduct?.discount === 0
									? "Add Discount"
									: "Update Discount"}
							</button>
							{selectedProduct?.discount !== 0 && (
								<button
									onClick={handleRemoveDiscount}
									className="flex-1 bg-red-700 text-white py-2 rounded-lg hover:opacity-75"
								>
									Remove Discount
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
