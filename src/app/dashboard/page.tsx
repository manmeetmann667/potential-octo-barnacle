"use client"
import { Plus, Store, Users, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"

import { motion } from "framer-motion" // Import Framer Motion
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	onSnapshot,
	query,
	Timestamp,
	updateDoc,
	where,
} from "firebase/firestore"
import { db } from "../lib/firebase"
interface Task {
	id: string
	task: string
	completed: boolean
}

export default function Dashboard() {
	const [showModal, setShowModal] = useState(false)
	const [newTask, setNewTask] = useState("")
	const [tasks, setTasks] = useState<Task[]>([]) // ✅ Explicitly define the type
	const [currentDate, setCurrentDate] = useState("")
	const [totalStores, setTotalStores] = useState(0)
	const [totalAgents, setTotalAgents] = useState(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState(0)
	const [loading, setLoading] = useState(true) // ✅ Track loading state

	// Format date
	useEffect(() => {
		const date = new Date()
		const options: Intl.DateTimeFormatOptions = {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		}
		setCurrentDate(date.toLocaleDateString("en-US", options))
	}, [])

	// Fetch Firebase data
	useEffect(() => {
		const fetchData = async () => {
			try {
				const storesSnapshot = await getDocs(collection(db, "stores"))
				setTotalStores(storesSnapshot.size)

				const agentsSnapshot = await getDocs(collection(db, "agents"))
				setTotalAgents(agentsSnapshot.size)

				const today = new Date()
				today.setHours(0, 0, 0, 0)
				const todayTimestamp = Timestamp.fromDate(today)

				const ordersQuery = query(
					collection(db, "orders"),
					where("createdAt", ">=", todayTimestamp)
				)
				const ordersSnapshot = await getDocs(ordersQuery)
				setTotalOrdersToday(ordersSnapshot.size)
			} catch (error) {
				console.error("Error fetching data:", error)
			}
		}

		// Real-time listener
		const unsubscribe = onSnapshot(
			collection(db, "tasks"),
			(snapshot) => {
				setTasks(
					snapshot.docs.map((doc) => ({
						id: doc.id,
						task: doc.data().task,
						completed: doc.data().completed || false, // Default to false
					}))
				)
			}
		)
		setLoading(false) // ✅ Set loading to false after fetching

		fetchData()

		return () => unsubscribe() // Cleanup listener
	}, [])
	const toggleCompletion = async (
		taskId: string,
		isChecked: boolean
	) => {
		try {
			const taskRef = doc(db, "tasks", taskId)
			await updateDoc(taskRef, { completed: isChecked }) // ✅ Update Firestore
		} catch (error) {
			console.error("Error updating task completion: ", error)
		}
	}

	const addTask = async () => {
		if (!newTask.trim()) return // Prevent empty task submission

		try {
			await addDoc(collection(db, "tasks"), {
				task: newTask,
				createdAt: new Date(),
			})
			setNewTask("") // Clear input
			setShowModal(false) // Close modal
		} catch (error) {
			console.error("Error adding task: ", error)
		}
	}
	const deleteTask = async (taskId: string) => {
		try {
			await deleteDoc(doc(db, "tasks", taskId))
			setTasks(tasks.filter((task) => task.id !== taskId)) // Remove from UI
		} catch (error) {
			console.error("Error deleting task: ", error)
		}
	}

	return (
		<div className="p-6 bg-gray-100 min-h-screen">
			{/* Dashboard Header */}
			<div className="flex justify-between items-center mb-6 px-6">
				<div>
					<h1 className="text-xl font-bold text-gray-900">
						Hello, Admin
					</h1>
					<p className="text-gray-500 text-sm">
						Today is {currentDate}
					</p>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
				>
					<Plus className="w-4 h-4 mr-2" /> Add New Task
				</button>
			</div>

			{/* Statistics Section */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
				{[
					{
						title: "Total Stores",
						value: totalStores,
						icon: <Store size={28} />,
						color: "bg-purple-500",
					},
					{
						title: "Total Agents",
						value: totalAgents,
						icon: <Users size={28} />,
						color: "bg-teal-500",
					},
					{
						title: "Orders Today",
						value: totalOrdersToday,
						icon: <ShoppingBag size={28} />,
						color: "bg-orange-500",
					},
				].map((item, index) => (
					<motion.div
						key={index}
						className="p-6 rounded-xl shadow-md bg-white flex flex-col items-start space-y-4"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: index * 0.2 }}
					>
						<div
							className={`p-3 rounded-full text-white ${item.color}`}
						>
							{item.icon}
						</div>
						<h2 className="text-lg font-semibold text-gray-700">
							{item.title}
						</h2>

						{/* Animated Number */}
						<motion.p
							className="text-3xl font-bold"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8 }}
						>
							{item.value}
						</motion.p>

						{/* Smooth Expanding Progress Bar */}
						<div className="w-full bg-gray-200 rounded-full h-2">
							<motion.div
								className={`h-2 rounded-full ${item.color}`}
								initial={{ width: "0%" }}
								animate={{
									width: `${Math.min(item.value * 10, 100)}%`,
								}}
								transition={{ duration: 1, ease: "easeOut" }}
							></motion.div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Tasks Section */}
			<div className="flex justify-between">
				<div className=" gap-6 px-6 mt-6 w-[600px]">
					<div className="bg-white p-6 rounded-xl shadow-md">
						<h3 className="text-lg font-semibold mb-4">
							Tasks for today
						</h3>
						{/* ✅ Show Loading while fetching */}
						{loading ? (
							<p className="text-gray-500">Loading...</p>
						) : tasks.length === 0 ? (
							// ✅ Show "No tasks" if the list is empty
							<p className="text-gray-500">No tasks available</p>
						) : (
							<div className="space-y-4">
								{tasks.map((task, i) => (
									<div
										key={i}
										className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
									>
										<span>{task.task}</span>
										<div className="flex justify-center items-center gap-5">
											<input
												type="checkbox"
												checked={task.completed} // ✅ Show persistent checkbox state
												onChange={(e) =>
													toggleCompletion(task.id, e.target.checked)
												}
												className="w-4 h-4"
											/>
											<button
												onClick={() => deleteTask(task.id)}
												className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm"
											>
												Delete
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
				<div className=" gap-6 px-6 mt-6 w-[600px]">
					<div className="bg-white p-6 rounded-xl shadow-md">
						<h3 className="text-lg font-semibold mb-4">
							Total Orders
						</h3>
						<div className="space-y-4">
							{tasks.map((task, i) => (
								<div
									key={i}
									className="flex items-center justify-between bg-gray-100 p-4 rounded-lg"
								>
									<span>{task.task}</span>
									<input type="checkbox" className="w-4 h-4" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			{/* Modal for Adding Task */}
			{showModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
					<div className="bg-white p-6 rounded-lg shadow-md w-96">
						<h2 className="text-lg font-bold mb-4">Add New Task</h2>
						<input
							type="text"
							value={newTask}
							onChange={(e) => setNewTask(e.target.value)}
							className="w-full p-2 border rounded-lg mb-4"
							placeholder="Task name"
						/>
						<button
							onClick={addTask}
							className="bg-blue-500 text-white px-4 py-2 rounded-lg"
						>
							Add
						</button>
						<button
							onClick={() => setShowModal(false)}
							className="ml-2 bg-gray-300 px-4 py-2 rounded-lg"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
