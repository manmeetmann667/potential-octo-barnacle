"use client"

import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { addAgent, getAgents } from "../../service/agent.service" // Adjust path if needed
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
	const [isOpen, setIsOpen] = useState(false)
	const [fileName, setFileName] = useState("")

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
			const res = await addAgent({
				agentName,
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
	}

	// Close modal
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
							<h2 className="text-xl font-semibold">Add Agent</h2>
							<X className="cursor-pointer" onClick={handleCloseModal} />
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
								type="file"
								accept="image/*"
								onChange={handleImageUpload}
								className="w-full p-2"
							/>
							<button className="bg-blue-600 text-white p-2 w-full rounded">
								{loading ? "Saving..." : "Add Agent"}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	)
}
