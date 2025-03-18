"use client"
import React, { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import {
	addStore,
	fetchStores,
	importUsersFromFirestore,
	updateStore,
	deleteStore, // Import the deleteStore function
} from "../../service/store.service" // Adjust as per the correct path
import { getCoordinates } from "@/utils/geocode"

export default function Page() {
	interface Store {
		addressOne: string
		addressTwo: string
		storeId: string
		category: string
		storeNumber: string
		email: string
		password: string
		status: string
		location?: { lat: number; lng: number }; // New field for coordinates
	}

	const [addressOne, setAddressOne] = useState("")
	const [addressTwo, setAddressTwo] = useState("")
	const [category, setCategory] = useState("")
	const [storeNumber, setStoreNumber] = useState("")
	const [loading, setLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [status, setStatus] = useState("Active")
	const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);


	// Fetch data
	const [stores, setStores] = useState<Store[]>([])
	const [isFetching, setIsFetching] = useState(true)
	const [selectedStores, setSelectedStores] = useState<Store | null>(
		null
	)

	const getStores = async () => {
		setIsFetching(true)
		try {
			const data = await fetchStores()
			setStores(data as [])
			console.log(data)
		} catch (error) {
			toast.error("Unable to Fetch Data!!")
		} finally {
			setIsFetching(false)
		}
	}

	useEffect(() => {
		getStores()
	}, [])

	const generateValues = () => {
		const timeStamp = Date.now()
		const storeId = `${category
			.substring(0, 3)
			.toUpperCase()}-${storeNumber}-${timeStamp}`
		const email = `${category
			.substring(0, 3)
			.toLowerCase()
			.replace(
				/\s+/g,
				""
			)}-${storeNumber}@${category.toLowerCase()}.com`
		const password = Math.random().toString(36).slice(-10)
		return { storeId, email, password }
	}

	const handleSubmit = async (e: any) => {
		e.preventDefault()
		setLoading(true)

		try {
			console.log(selectedStores?.storeId)
			
			const fullAddress = `${addressOne}, ${addressTwo}`;
			console.log("Fetching coordinates for:", `${addressOne}, ${addressTwo}`);

    		const coords = await getCoordinates(fullAddress);

    		if (!coords) throw new Error("Failed to get coordinates");
			
			if (selectedStores) {
				// Update store if selected
				await updateStore(selectedStores.storeId, {
					addressOne,
					addressTwo,
					category,
					storeNumber,
					status,
					location:coords,
				});
				toast.success("Store Updated Successfully")
				// setIsOpen(false)
				// clearFormFields() // Clear the form fields on success
				// await getStores() // Fetch updated store list
			} else {
				const { storeId, email, password } = generateValues()
				// Add new store 
				const res = await addStore({
					addressOne,
					storeId,
					addressTwo,
					category,
					storeNumber,
					email,
					password,
					status,
					location:coords, 
				})
				toast.success("Store Added Successfully");
			}
					setIsOpen(false)
					clearFormFields() // Clear the form fields on success
					await getStores() // Fetch the updated list of stores
					await importUsersFromFirestore() // Only call this when adding a store
				}
			
		 catch (error) {
			toast.error("Unable to process the store!")
		} finally {
			setLoading(false)
		}
	}

	const handleEditClick = (store: Store) => {
		setSelectedStores(store)
		console.log(selectedStores?.storeId)

		setAddressOne(store.addressOne)
		setAddressTwo(store.addressTwo)
		setCategory(store.category)
		setStoreNumber(store.storeNumber)
		setStatus(store.status)
		setLocation(store.location || null);

		setIsOpen(true)
	}

	// Clear all form fields
	const clearFormFields = () => {
		setCategory("")
		setAddressOne("")
		setAddressTwo("")
		setStoreNumber("")
	}

	// Close the modal and clear fields
	const handleCloseModal = () => {
		setIsOpen(false)
		clearFormFields()
	}

	// Handle Delete Store
	const handleDeleteClick = async (storeId: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this store?"
		)
		if (confirmDelete) {
			try {
				await deleteStore(storeId) // Call the delete function from store.service
				toast.success("Store deleted successfully!")
				await getStores() // Fetch updated store list after deletion
			} catch (error) {
				toast.error("Error deleting store!")
			}
		}
	}

	return (
		<div>
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">Tables</h2>
				<div className="flex gap-20 items-center font-semibold">
					<button
						onClick={() => setIsOpen(true)}
						className="bg-blue-700 text-white px-6 py-3 rounded-md cursor-pointer hover:opacity-75 transition-all"
					>
						+ Add Store
					</button>
					<div className="flex gap-1">
						<h4>Dashboard /</h4>
						<span className="text-blue-700">Store</span>
					</div>
				</div>
			</div>

			{/* Table Section */}
			<div className="flex bg-white rounded-lg p-5 mt-10">
				{isFetching ? (
					<div className="w-full flex justify-center items-center text-lg font-semibold">
						Loading stores...
					</div>
				) : (
					<table className="w-full border-collapse">
						<thead>
							<tr className="bg-gray-100">
								<th className="px-4 py-2">Address Line 1</th>
								<th className="px-4 py-2">Address Line 2</th>
								<th className="px-4 py-2">Store Category Name</th>
								<th className="px-4 py-2">Shop Number</th>
								<th className="px-4 py-2">Store Id</th>
								<th className="px-4 py-2">Store Email</th>
								<th className="px-4 py-2">Store Password</th>
								<th className="px-4 py-2">Status</th>
								<th className="px-4 py-2">Action</th>
							</tr>
						</thead>
						{stores.map((store) => (
							<tbody key={store.storeId}>
								<tr className="border-t text-center">
									<td className="px-4 py-2">{store.addressOne}</td>
									<td className="px-4 py-2">{store.addressTwo}</td>
									<td className="px-4 py-2">{store.category}</td>
									<td className="px-4 py-2">{store.storeNumber}</td>
									<td className="px-4 py-2">{store.storeId}</td>
									<td className="px-4 py-2">{store.email}</td>
									<td className="px-4 py-2">{store.password}</td>
									<td>
										<div
											className={`px-4 mt-1 py-2 font-semibold 
                        ${
													store.status === "Active"
														? "bg-green-500 text-white rounded-lg"
														: ""
												}
                        ${
													store.status === "Inactive"
														? "bg-yellow-500 text-white rounded-lg"
														: ""
												}
                        ${
													store.status === "Suspended"
														? "bg-red-600 text-white rounded-lg"
														: ""
												}`}
										>
											{store.status}
										</div>
									</td>
									<div className="flex items-center px-5 gap-5 py-6">
										<td
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleEditClick(store)}
										>
											Edit
										</td>
										<button
											type="button"
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleDeleteClick(store.storeId)} // Delete function
										>
											Delete
										</button>
									</div>
								</tr>
							</tbody>
						))}
					</table>
				)}
			</div>

			{/* Modal Section */}
			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="flex flex-col items-center justify-center mt-10 ml-20">
						<div className="w-full bg-white rounded-lg">
							<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
								<div className="flex items-center justify-between">
									<h2 className="text-4xl font-semibold">
										{selectedStores ? "Edit store" : "Add Store"}
									</h2>
									<X
										className="hover:text-red-600 cursor-pointer"
										onClick={handleCloseModal}
									/>
								</div>
								<form className="space-y-4" onSubmit={handleSubmit}>
									{/* Form Fields */}
									<div className="flex gap-4">
										<div className="flex-grow">
											<input
												type="text"
												value={addressOne}
												onChange={(e) =>
													setAddressOne(e.target.value)
												}
												placeholder="Address Line 1"
												required
												className=" border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5 "
											/>
										</div>
										<div className="flex-grow">
											<input
												type="text"
												value={addressTwo}
												onChange={(e) =>
													setAddressTwo(e.target.value)
												}
												name="MobileNumber"
												placeholder="Address Line 2"
												required
												className=" border-2 border-stroke outline-indigo-700 text-gray-900 rounded-lg w-full p-2.5 "
											/>
										</div>
									</div>
									<div className="flex flex-col gap-5">
										<input
											type="text"
											value={storeNumber}
											onChange={(e) => setStoreNumber(e.target.value)}
											placeholder="Store Number"
											required
											className=" border-2 border-stroke outline-indigo-700 text-gray-900 rounded-lg w-full p-2.5 "
										/>
									</div>
									<div className="flex flex-col gap-5">
										<input
											type="text"
											value={category}
											onChange={(e) => setCategory(e.target.value)}
											placeholder="Category"
											required
											className=" border-2 border-stroke outline-indigo-700 text-gray-900 rounded-lg w-full p-2.5 "
										/>
										<select
											className="w-full border border-gray-300 rounded-md p-3 outline-indigo-700"
											onChange={(e) => setStatus(e.target.value)}
											value={status}
										>
											<option>Status</option>
											<option value="Active">Active</option>
											<option value="Inactive">Inactive</option>
											<option value="Suspended">Suspended</option>
										</select>
									</div>

									<button
										type="submit"
										className="w-full text-white bg-indigo-700 hover:opacity-75 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
									>
										{loading
											? "Saving..."
											: selectedStores
											? "Update Store"
											: "Add Store"}
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
