// Page.jsx
"use client"
import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
	addAgent,
	fetchAgents,
	importUsersFromAgentFirestore,
	updateAgent,
	deleteAgent,
} from "../../service/agent.service"
import { X } from "lucide-react"

interface Agent {
	agentId: string
	agentName: string
	mobileNumber: string
	image?: string
	email: string // Ensure email is included
	password: string // Ensure password is included
	personalEmail: string
}

export default function Page() {
	const deliveryAgent = "agent"
	const [agentName, setAgentName] = useState("")
	const [mobileNumber, setMobileNumber] = useState("")
	const [loading, setLoading] = useState(false)
	const [personalEmail, setPersonalEmail] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const [fileName, setFileName] = useState("")
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(
		null
	)
	const [agents, setAgents] = useState<Agent[]>([])
	const [isFetching, setIsFetching] = useState(true)

	// Fetch agents
	const getAgents = async () => {
		setIsFetching(true)
		try {
			const data = await fetchAgents()
			setAgents((data as []) || []) // Ensure data is an array
			console.log(data)
		} catch (error) {
			toast.error("Unable to Fetch Data!!")
		} finally {
			setIsFetching(false)
		}
	}

	useEffect(() => {
		getAgents()
		importUsersFromAgentFirestore()
	}, [])

	const generateValues = () => {
		const timeStamp = Date.now()
		const agentId = `${mobileNumber.slice(-4)}-${timeStamp}`
		const email = `${agentName
			.toLowerCase()
			.replace(/\s+/g, "")}-${mobileNumber.substring(
			0,
			3
		)}@${deliveryAgent.toLowerCase()}.com`
		const password = Math.random().toString(36).slice(-10)
		return { agentId, email, password }
	}

	const handleImageUpload = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onloadend = () => {
				setFileName(reader.result as string)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		const { email, agentId, password } = generateValues()

		try {
			if (selectedAgent) {
				// Update existing agent
				await updateAgent(selectedAgent.agentId, {
					agentName,
					mobileNumber,
					personalEmail,
					email, // Include email
					password, // Include password
					image: fileName || selectedAgent.image,
				})
				toast.success("Agent Updated Successfully")
			} else {
				// Add new agent
				const res = await addAgent({
					agentName,
					agentId,
					mobileNumber,
					personalEmail,
					email, // Include email
					password, // Include password
					image: fileName,
				})

				if (res) {
					toast.success("Agent Added Successfully")
					const emailResp = await fetch("/api/send-email", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							toEmail: personalEmail,
							agentEmail: email,
							agentPassword: password,
						}),
					})

					const emailData = await emailResp.json()
					if (!emailResp.ok) {
						throw new Error("Failed to send email")
					}

					if (emailData.success) {
						toast.success("Email sent to agent successfully!")
					} else {
						toast.error("Failed to send email to agent.")
					}
				}
			}

			setIsOpen(false)
			clearFormFields()
			await getAgents()
			await importUsersFromAgentFirestore()
		} catch (error) {
			toast.error(
				`Unable to ${selectedAgent ? "update" : "add"} Agent!`
			)
		} finally {
			setLoading(false)
		}
	}

	const isFormValid = agentName && mobileNumber && personalEmail

	const clearFormFields = () => {
		setAgentName("")
		setMobileNumber("")
		setFileName("")
		setPersonalEmail("")
		setSelectedAgent(null)
	}

	const handleEditClick = (agent: Agent) => {
		setSelectedAgent(agent)
		setAgentName(agent.agentName)
		setMobileNumber(agent.mobileNumber)
		setPersonalEmail(agent.personalEmail) // Use personalEmail
		setFileName("")
		setIsOpen(true)
	}

	const handleDeleteClick = async (agentId: string) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this Agent?"
		)
		if (confirmDelete) {
			try {
				await deleteAgent(agentId)
				toast.success("Agent deleted successfully!")
				await getAgents()
			} catch (error) {
				toast.error("Error deleting Agent!")
			}
		}
	}

	const handleCloseModal = () => {
		setIsOpen(false)
		clearFormFields()
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
								<th className="px-4 py-2">Image</th>
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
										{agent.image ? (
											<img
												src={agent.image}
												alt={agent.agentName}
												className="w-16 h-16 rounded-full shadow-lg mx-auto"
											/>
										) : (
											"No Image"
										)}
									</td>
									<td className="px-4 py-2">
										{agent.email || "N/A"}
									</td>
									<td className="px-4 py-2">
										{agent.password || "N/A"}
									</td>
									<td className="px-4 py-2">
										<div className="flex items-center justify-center gap-5">
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
							<button
								type="submit"
								className="bg-blue-600 text-white p-2 w-full rounded"
								disabled={loading || !isFormValid}
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
