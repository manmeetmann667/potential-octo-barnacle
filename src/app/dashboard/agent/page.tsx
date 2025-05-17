"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
	addAgent,
	deleteAgent,
	getAgents,
	updateAgent,
} from "../../service/agent.service" // Adjust path if needed
import { X } from "lucide-react"

export default function Page() {
	interface Agent {
		agentId: string
		agentName: string
		mobileNumber: string
		image?: string
		email: string
		password: string
	}

	const [agentName, setAgentName] = useState("")
	const [mobileNumber, setMobileNumber] = useState("")
	const [loading, setLoading] = useState(false)
	const [personalEmail, setPersonalEmail] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const [fileName, setFileName] = useState("")
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
		null
	)

	// Fetch agents
	const [agents, setAgents] = useState<Agent[]>([])
	const [isFetching, setIsFetching] = useState(true)

	const fetchAgents = async () => {
		setIsFetching(true)
		try {
			const data = await getAgents()
			setAgents(data as [])
		} catch (error) {
			toast.error("Unable to Fetch Agents!")
		} finally {
			setIsFetching(false)
		}
	}

	useEffect(() => {
		fetchAgents()
	}, [])

	// Handle Image Upload (Base64 conversion)
	const handleImageUpload = (e: any) => {
		const file = e.target.files[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setFileName(reader.result as string) // Store Base64
			}
			reader.readAsDataURL(file)
		}
	}

	// Handle Form Submission
	const handleSubmit = async (e: any) => {
		e.preventDefault()
		setLoading(true)

		try {
			if (selectedAgent) {
				await updateAgent(selectedAgent.agentId, {
					agentName,
					mobileNumber,
					image: fileName,
				})
				toast.success("Store Updated Successfully")
				setIsOpen(false)
				clearFormFields() // Clear the form fields on success
				await getAgents() // Fetch updated store list
			}
			const res = await addAgent({
				agentName,
				personalEmail,
				mobileNumber,
				image: fileName,
			})

			if (res.success) {
				toast.success("Agent added successfully")
				setIsOpen(false)
				clearFormFields()
				await fetchAgents()
			}
		} catch (error) {
			toast.error("Unable to add Agent!")
		} finally {
			setLoading(false)
		}
	}

	// Clear form fields
	const clearFormFields = () => {
		setAgentName("")
		setMobileNumber("")
		setFileName("")
		setPersonalEmail("")
	}
	const handleEditClick = (agent: Agent) => {
		setSelectedAgent(agent)
		console.log(selectedAgent?.agentId)

		setAgentName(agent.agentName)
		setMobileNumber(agent.mobileNumber)
		setFileName("")

		setIsOpen(true)
	}

	// Close modal
	const handleCloseModal = () => {
		setIsOpen(false)
		clearFormFields()
	}
	const handleDeleteClick = async (storeId: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this Agent?"
		)
		if (confirmDelete) {
			try {
				await deleteAgent(storeId) // Call the delete function from store.service
				toast.success("Agent deleted successfully!")
				await fetchAgents() // Fetch updated store list after deletion
			} catch (error) {
				toast.error("Error deleting Agent!")
			}
		}
	}

	return (
		<div>
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl">Agents</h2>
				<button
					onClick={() => setIsOpen(true)}
					className="bg-blue-700 text-white px-6 py-3 rounded-md cursor-pointer hover:opacity-75 transition-all"
				>
					+ Add Agent
				</button>
			</div>

			{/* Table Section */}
			<div className="flex bg-white rounded-lg p-5 mt-10">
				{isFetching ? (
					<div className="w-full flex justify-center items-center text-lg font-semibold">
						Loading agents...
					</div>
				) : (
					<table className="w-full border-collapse">
						<thead>
							<tr className="bg-gray-100">
								<th className="px-4 py-2">Agent ID</th>
								<th className="px-4 py-2">Agent Name</th>
								<th className="px-4 py-2">Mobile Number</th>
								<th className="px-4 py-2">Image URL</th>
								<th className="px-4 py-2">Email</th>
								<th className="px-4 py-2">Password</th>
								<th className="px-4 py-2">Action</th>
							</tr>
						</thead>
						{agents.map((agent) => (
							<tbody key={agent.agentId}>
								<tr className="border-t text-center">
									<td className="px-4 py-2">{agent.agentId}</td>
									<td className="px-4 py-2">{agent.agentName}</td>
									<td className="px-4 py-2">{agent.mobileNumber}</td>
									<td className="px-4 py-2">
										<img
											src={agent.image}
											alt={agent.agentName}
											className="w-16 h-16 rounded-full shadow-lg"
										/>
									</td>
									<td className="px-4 py-2">{agent.email}</td>
									<td className="px-4 py-2">{agent.password}</td>
									<div className="flex items-center px-5 gap-5 py-6">
										<td
											className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											onClick={() => handleEditClick(agent)}
										>
											Edit
										</td>
										<button
											type="button"
											onClick={() => handleDeleteClick(agent.agentId)}
											className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											// onClick={() => handleDeleteClick(store.storeId)} // Delete function
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
					<div className="bg-white p-6 rounded-lg w-96">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-semibold">
								{selectedAgent ? "Edit Agent" : "Add Agent"}
							</h2>
							<X
								className="cursor-pointer"
								onClick={handleCloseModal}
							/>
						</div>
						<form className="space-y-4 mt-4" onSubmit={handleSubmit}>
							<input
								type="text"
								placeholder="Agent Name"
								value={agentName}
								onChange={(e) => setAgentName(e.target.value)}
								className="border w-full p-2 rounded"
								required
							/>
							<input
								type="text"
								placeholder="Mobile Number"
								value={mobileNumber}
								onChange={(e) => setMobileNumber(e.target.value)}
								className="border w-full p-2 rounded"
								required
							/>
							<input
								type="email"
								value={personalEmail}
								onChange={(e) => setPersonalEmail(e.target.value)}
								placeholder="Agent Personal Email"
								required
								className="border-2 border-stroke outline-indigo-700 text-gray-900 rounded-lg w-full p-2.5"
							/>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="w-full p-2"
							/>
							<button className="bg-blue-600 text-white p-2 w-full rounded">
								{loading
									? "Saving..."
									: selectedAgent
									? "Update Agent"
									: "Add Agent"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
