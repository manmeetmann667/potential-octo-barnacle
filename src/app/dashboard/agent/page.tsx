"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { X } from "lucide-react"
import {
	addAgent,
	deleteAgent,
	getAgents,
	updateAgent,
} from "../../service/agent.service" // Adjust path if needed

interface Agent {
	agentId: string
	agentName: string
	mobileNumber: string
	image?: string
	email: string
	password: string
}

export default function Page() {
	const [agentName, setAgentName] = useState("")
	const [mobileNumber, setMobileNumber] = useState("")
	const [personalEmail, setPersonalEmail] = useState("")
	const [fileName, setFileName] = useState("")
	const [loading, setLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
		null
	)
	const [agents, setAgents] = useState<Agent[]>([])
	const [isFetching, setIsFetching] = useState(true)

	// Fetch agents
	const fetchAgents = async () => {
		setIsFetching(true)
		try {
			const data = await getAgents()
			setAgents(data as Agent[])
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
	const handleImageUpload = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setFileName(reader.result as string) // Store Base64
			}
			reader.readAsDataURL(file)
		}
	}

	// Handle Form Submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			if (selectedAgent) {
				// Update agent (excluding personalEmail)
				await updateAgent(selectedAgent.agentId, {
					agentName,
					mobileNumber,
					image: fileName || selectedAgent.image, // Preserve existing image if no new file
				})
				toast.success("Agent Updated Successfully")
				setIsOpen(false)
				clearFormFields()
				await fetchAgents()
			} else {
				// Add new agent (includes personalEmail)
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
			}
		} catch (error) {
			toast.error("Unable to process request!")
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
		setSelectedAgent(null)
	}

	// Handle Edit Click
	const handleEditClick = (agent: Agent) => {
		setSelectedAgent(agent)
		setAgentName(agent.agentName)
		setMobileNumber(agent.mobileNumber)
		setPersonalEmail(agent.email) // Display email but won't update it
		setFileName("") // Reset image field
		setIsOpen(true)
	}

	// Close modal
	const handleCloseModal = () => {
		setIsOpen(false)
		clearFormFields()
	}

	// Handle Delete Click
	const handleDeleteClick = async (agentId: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this Agent?"
		)
		if (confirmDelete) {
			try {
				await deleteAgent(agentId)
				toast.success("Agent deleted successfully!")
				await fetchAgents()
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
						<tbody>
							{agents.map((agent) => (
								<tr
									key={agent.agentId}
									className="border-t text-center"
								>
									<td className="px-4 py-2">{agent.agentId}</td>
									<td className="px-4 py-2">{agent.agentName}</td>
									<td className="px-4 py-2">{agent.mobileNumber}</td>
									<td className="px-4 py-2">
										{agent.image && (
											<img
												src={agent.image}
												alt={agent.agentName}
												className="w-16 h-16 rounded-full shadow-lg"
											/>
										)}
									</td>
									<td className="px-4 py-2">{agent.email}</td>
									<td className="px-4 py-2">{agent.password}</td>
									<td className="px-4 py-2">
										<div className="flex items-center gap-5">
											<button
												className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
												onClick={() => handleEditClick(agent)}
											>
												Edit
											</button>
											<button
												type="button"
												onClick={() =>
													handleDeleteClick(agent.agentId)
												}
												className="bg-red-600 text-white px-4 py-1 rounded-lg hover:opacity-75 cursor-pointer"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
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
								className="border-2 border-stroke outline-indigo-700 text-gray-900 rounded-lg w-full p-2.5"
								disabled={!!selectedAgent} // Disable email field when editing
							/>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="w-full p-2"
							/>
							<button
								type="submit"
								className="bg-blue-600 text-white p-2 w-full rounded"
								disabled={loading}
							>
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
