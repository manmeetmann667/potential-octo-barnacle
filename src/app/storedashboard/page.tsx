"use client"
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
import React, { useEffect, useState } from "react"
import { db } from "../lib/firebase"
import { Plus, Boxes, Package, ShoppingBag } from "lucide-react"
interface Task {
	id: string
	task: string
	completed: boolean
}
import { motion } from "framer-motion"

export default function page() {
	const [showModal, setShowModal] = useState(false)
	const [newTask, setNewTask] = useState("")
	const [tasks, setTasks] = useState<Task[]>([])
	const [currentDate, setCurrentDate] = useState("")
	const [totalCategories, setTotalCategories] = useState(0)
	const [totalProducts, setTotalProducts] = useState(0)
	const [totalOrdersToday, setTotalOrdersToday] = useState(0)
	const [loading, setLoading] = useState(true)
	const [storeId, setStoreId] = useState<string | null>(null)

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

	// Get storeId from localStorage
	useEffect(() => {
		const storedStoreId = localStorage.getItem("storeId")
		if (storedStoreId) {
			setStoreId(storedStoreId)
			fetchData(storedStoreId)
		} else {
			console.error("No storeId found in localStorage")
			setLoading(false)
		}
	}, [])

	// Fetch categories & products from Firestore based on storeId
	const fetchData = async (storeId: string) => {
		try {
			// Fetch categories for the storeId
			const categoriesSnapshot = await getDocs(
				collection(db, `stores/${storeId}/categories`)
			)
			setTotalCategories(categoriesSnapshot.size)

			// Fetch products inside each category
			let totalProductsCount = 0
			for (const categoryDoc of categoriesSnapshot.docs) {
				const productsSnapshot = await getDocs(
					collection(
						db,
						`stores/${storeId}/categories/${categoryDoc.id}/products`
					)
				)
				totalProductsCount += productsSnapshot.size
			}
			setTotalProducts(totalProductsCount)
		} catch (error) {
			console.error("Error fetching categories/products:", error)
		} finally {
			setLoading(false)
		}
	}

	// Real-time listener for tasks
	useEffect(() => {
		const unsubscribe = onSnapshot(
			collection(db, "StoreTasks"),
			(snapshot) => {
				setTasks(
					snapshot.docs.map((doc) => ({
						id: doc.id,
						task: doc.data().task,
						completed: doc.data().completed || false,
					}))
				)
			}
		)
		return () => unsubscribe()
	}, [])

	// Real-time listener for today's pending orders
	useEffect(() => {
		if (!storeId) return

		const startOfDay = new Date()
		startOfDay.setHours(0, 0, 0, 0)
		const endOfDay = new Date()
		endOfDay.setHours(23, 59, 59, 999)

		const ordersQuery = query(
			collection(db, "Orders"),
			where(`storeStatuses.${storeId}`, "==", "pending"),
			where("createdAt", ">=", Timestamp.fromDate(startOfDay)),
			where("createdAt", "<=", Timestamp.fromDate(endOfDay))
		)

		const unsubscribe = onSnapshot(
			ordersQuery,
			(snapshot) => {
				setTotalOrdersToday(snapshot.size)
			},
			(error) => {
				console.error("Error fetching today's orders:", error)
			}
		)

		return () => unsubscribe()
	}, [storeId])

	const toggleCompletion = async (
		taskId: string,
		isChecked: boolean
	) => {
		try {
			const taskRef = doc(db, "StoreTasks", taskId)
			await updateDoc(taskRef, { completed: isChecked })
		} catch (error) {
			console.error("Error updating task completion: ", error)
		}
	}

	const addTask = async () => {
		if (!newTask.trim()) return

		try {
			await addDoc(collection(db, "StoreTasks"), {
				task: newTask,
				createdAt: new Date(),
			})
			setNewTask("")
			setShowModal(false)
		} catch (error) {
			console.error("Error adding task: ", error)
		}
	}

	const deleteTask = async (taskId: string) => {
		try {
			await deleteDoc(doc(db, "StoreTasks", taskId))
			setTasks(tasks.filter((task) => task.id !== taskId))
		} catch (error) {
			console.error("Error deleting task: ", error)
		}
	}

	return (
		<div className="p-6 bg-gray-100 min-h-screen">
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

			{/* Dashboard Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
				{[
					{
						title: "Total Categories",
						value: totalCategories,
						icon: <Boxes size={28} />,
						color: "bg-purple-500",
					},
					{
						title: "Total Products",
						value: totalProducts,
						icon: <Package size={28} />,
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
						<motion.p
							className="text-3xl font-bold"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8 }}
						>
							{item.value}
						</motion.p>
					</motion.div>
				))}
			</div>

			{/* Task List */}
			<div className="bg-white p-6 rounded-xl shadow-md mt-6">
				<h3 className="text-lg font-semibold mb-4">
					Tasks for today
				</h3>
				{loading ? (
					<p>Loading...</p>
				) : tasks.length === 0 ? (
					<p>No tasks available</p>
				) : (
					tasks.map((task, i) => (
						<div
							key={i}
							className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-2"
						>
							<span>{task.task}</span>
							<div className="flex justify-center items-center gap-5">
								<input
									type="checkbox"
									checked={task.completed}
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
					))
				)}
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
