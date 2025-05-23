"use client"

import React, { useEffect, useState } from "react"
import { X } from "lucide-react"
import { toast } from "react-toastify"
import {
	addStore,
	fetchStores,
	importUsersFromFirestore,
	updateStore,
	deleteStore,
} from "../../service/store.service"

interface Store {
	storeId: string
	storeName: string
	addressOne: string
	addressTwo: string
	category: string
	storeNumber: string
	email: string
	password: string
	status: string
	personalEmail: string
	location?: { lat: number; lng: number }
}

export default function Page() {
	const [addressOne, setAddressOne] = useState("")
	const [addressTwo, setAddressTwo] = useState("")
	const [personalEmail, setPersonalEmail] = useState("")
	const [category, setCategory] = useState("")
	const [storeNumber, setStoreNumber] = useState("")
	const [loading, setLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [status, setStatus] = useState("Active")
	const [location, setLocation] = useState<{
		lat: number
		lng: number
	} | null>(null)
	const [storeName, setStoreName] = useState("")
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
			toast.error(
				(error as Error).message || "Unable to fetch stores!"
			)
		} finally {
			setIsFetching(false)
		}
	}

	useEffect(() => {
		getStores()
		importUsersFromFirestore()
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true) // Fixed typo: setLoadingampp -> setLoading

		try {
			if (selectedStores) {
				// Update existing store (exclude personalEmail, email, password)
				await updateStore(selectedStores.storeId, {
					storeName,
					addressOne,
					addressTwo,
					category,
					storeNumber,
					status,
					location: selectedStores.location || null,
				})
				toast.success("Store updated successfully")
				setIsOpen(false)
				clearFormFields()
				setSelectedStores(null)
				await getStores()
			} else {
				// Add new store
				const { storeId, email, password } = generateValues()
				await addStore({
					storeId,
					storeName,
					addressOne,
					addressTwo,
					category,
					storeNumber,
					email,
					password,
					status,
					personalEmail,
				})

				toast.success("Store added successfully")

				const emailRes = await fetch("/api/send-email", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						toEmail: personalEmail,
						storeEmail: email,
						storePassword: password,
					}),
				})

				const emailData = await emailRes.json()
				if (emailData.success) {
					toast.success("Email sent to store owner successfully!")
				} else {
					toast.error("Failed to send email to store owner.")
				}

				setIsOpen(false)
				clearFormFields()
				await getStores()
				await importUsersFromFirestore()
			}
		} catch (error) {
			toast.error(
				(error as Error).message ||
					(selectedStores
						? "Unable to update store!"
						: "Unable to add store!")
			)
		} finally {
			setLoading(false)
		}
	}

	const handleEditClick = (store: Store) => {
		setSelectedStores(store)
		setAddressOne(store.addressOne)
		setAddressTwo(store.addressTwo)
		setCategory(store.category)
		setStoreNumber(store.storeNumber)
		setStatus(store.status)
		setLocation(store.location || null)
		setStoreName(store.storeName || "")
		setPersonalEmail(store.personalEmail || "")
		setIsOpen(true)
	}

	const clearFormFields = () => {
		setCategory("")
		setAddressOne("")
		setAddressTwo("")
		setStoreNumber("")
		setPersonalEmail("")
		setStoreName("")
		setStatus("Active")
		setLocation(null)
		setSelectedStores(null)
	}

	const handleCloseModal = () => {
		setIsOpen(false)
		clearFormFields()
	}

	const handleDeleteClick = async (storeId: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this store?"
		)
		if (confirmDelete) {
			try {
				await deleteStore(storeId)
				toast.success("Store deleted successfully!")
				await getStores()
			} catch (error) {
				toast.error(
					(error as Error).message || "Error deleting store!"
				)
			}
		}
	}

	return (
		<div>
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">Stores</h2>
				<div className="flex gap-10 items-center font-semibold">
					<button
						onClick={() => setIsOpen(true)}
						className="bg-blue-700 text-white px-6 py-3 rounded-md cursor-pointer hover:opacity-75 transition-all"
					>
						+ Add Store
					</button>
				</div>
			</div>

			<div className="flex bg-white rounded-lg p-5 mt-10">
				{isFetching ? (
					<div className="w-full flex justify-center items-center text-lg font-semibold">
						Loading stores...
					</div>
				) : (
					<table className="border-collapse w-full">
						<thead>
							<tr className="bg-gray-100">
								<th className="px-4 py-2">Store Name</th>
								<th className="px-4 py-2">Address Line 1</th>
								<th className="px-4 py-2">Address Line 2</th>
								<th className="px-4 py-2">Store Category Name</th>
								<th className="px-4 py-2">Shop Number</th>
								<th className="px-4 py-2">Store Email</th>
								<th className="px-4 py-2">Store Password</th>
								<th className="px-4 py-2">Status</th>
								<th className="px-4 py-2">Action</th>
							</tr>
						</thead>
						<tbody>
							{stores.map((store) => (
								<tr
									key={store.storeId}
									className="border-t text-center"
								>
									<td className="px-4 py-2">{store.storeName}</td>
									<td className="px-4 py-2">{store.addressOne}</td>
									<td className="px-4 py-2">{store.addressTwo}</td>
									<td className="px-4 py-2">{store.category}</td>
									<td className="px-4 py-2">{store.storeNumber}</td>
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
									<td className="flex items-center px-5 gap-5 py-6">
										<button
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleEditClick(store)}
										>
											Edit
										</button>
										<button
											type="button"
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleDeleteClick(store.storeId)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="flex flex-col items-center justify-center mt-10 ml-20">
						<div className="w-full bg-white rounded-lg">
							<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
								<div className="flex items-center justify-between">
									<h2 className="text-4xl font-semibold">
										{selectedStores ? "Edit Store" : "Add Store"}
									</h2>
									<X
										className="hover:text-red-600 cursor-pointer"
										onClick={handleCloseModal}
									/>
								</div>
								<form className="space-y-4" onSubmit={handleSubmit}>
									<div className="flex-grow">
										<input
											type="text"
											value={storeName}
											onChange={(e) => setStoreName(e.target.value)}
											placeholder="Store Name"
											required
											className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
										/>
									</div>
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
												className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
											/>
										</div>
										<div className="flex-grow">
											<input
												type="text"
												value={addressTwo}
												onChange={(e) =>
													setAddressTwo(e.target.value)
												}
												placeholder="Address Line 2"
												required
												className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
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
											className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
										/>
									</div>
									<div className="flex flex-col gap-5">
										<input
											type="text"
											value={category}
											onChange={(e) => setCategory(e.target.value)}
											placeholder="Category"
											required
											className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
										/>
										<input
											type="email"
											value={personalEmail}
											onChange={(e) =>
												setPersonalEmail(e.target.value)
											}
											placeholder="Store Head Personal Email"
											className="border-2 border-stroke outline-indigo-700 rounded-lg w-full p-2.5"
											disabled={!!selectedStores} // Disable during editing
										/>
										<select
											className="w-full border border-gray-300 rounded-md p-3 outline-indigo-700"
											onChange={(e) => setStatus(e.target.value)}
											value={status}
										>
											<option value="">Select Status</option>
											<option value="Active">Active</option>
											<option value="Inactive">Inactive</option>
											<option value="Suspended">Suspended</option>
										</select>
									</div>
									<button
										type="submit"
										className="w-full text-white bg-indigo-700 hover:opacity-75 focus:ring-4 focus:outline-none font-medium rounded-lg text-sm px-5 py-2.5 text-center"
										disabled={loading}
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
