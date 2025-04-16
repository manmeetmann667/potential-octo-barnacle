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

	// ✅ Format date
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

	// ✅ Get storeId from localStorage
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

	// ✅ Fetch categories & products from Firestore based on storeId
	const fetchData = async (storeId: string) => {
		try {
			// ✅ Fetch categories for the storeId
			const categoriesSnapshot = await getDocs(
				collection(db, `stores/${storeId}/categories`)
			)

			// ✅ Count total categories
			setTotalCategories(categoriesSnapshot.size)

			// ✅ Fetch products inside each category
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

			// ✅ Update the state
			setTotalProducts(totalProductsCount)
		} catch (error) {
			console.error("Error fetching categories/products:", error)
		} finally {
			setLoading(false)
		}
	}

	// ✅ Real-time listener for tasks
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

			{/* ✅ Dashboard Cards */}
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

			{/* ✅ Task List */}
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



// "use client"
// import {
// 	addDoc,
// 	collection,
// 	deleteDoc,
// 	doc,
// 	getDocs,
// 	onSnapshot,
// 	query,
// 	Timestamp,
// 	updateDoc,
// 	where,
// } from "firebase/firestore"
// import React, { useEffect, useState } from "react"
// import { db } from "../lib/firebase"
// import { Plus, Boxes, Package, ShoppingBag, TrendingUp, DollarSign, ListChecks } from "lucide-react"
// import { motion } from "framer-motion"

// interface Task {
// 	id: string
// 	task: string
// 	completed: boolean
// }

// export default function page() {
// 	const [showModal, setShowModal] = useState(false)
// 	const [newTask, setNewTask] = useState("")
// 	const [tasks, setTasks] = useState<Task[]>([])
// 	const [currentDate, setCurrentDate] = useState("")
// 	const [totalCategories, setTotalCategories] = useState(0)
// 	const [totalProducts, setTotalProducts] = useState(0)
// 	const [totalStock, setTotalStock] = useState(0)
// 	const [totalRevenue, setTotalRevenue] = useState(0)
// 	const [topCategory, setTopCategory] = useState("")
// 	const [loading, setLoading] = useState(true)
// 	const [storeId, setStoreId] = useState<string | null>(null)

// 	useEffect(() => {
// 		const date = new Date()
// 		const options: Intl.DateTimeFormatOptions = {
// 			weekday: "long",
// 			year: "numeric",
// 			month: "long",
// 			day: "numeric",
// 		}
// 		setCurrentDate(date.toLocaleDateString("en-US", options))
// 	}, [])

// 	useEffect(() => {
// 		const storedStoreId = localStorage.getItem("storeId")
// 		if (storedStoreId) {
// 			setStoreId(storedStoreId)
// 			fetchData(storedStoreId)
// 		} else {
// 			console.error("No storeId found in localStorage")
// 			setLoading(false)
// 		}
// 	}, [])

// 	const fetchData = async (storeId: string) => {
// 		try {
// 			const categoriesSnapshot = await getDocs(
// 				collection(db, `stores/${storeId}/categories`)
// 			)
// 			setTotalCategories(categoriesSnapshot.size)

// 			let totalProductsCount = 0
// 			let totalStockCount = 0
// 			let revenue = 0
// 			let maxProductCount = 0
// 			let topCat = ""

// 			for (const categoryDoc of categoriesSnapshot.docs) {
// 				const productsSnapshot = await getDocs(
// 					collection(db, `stores/${storeId}/categories/${categoryDoc.id}/products`)
// 				)
// 				totalProductsCount += productsSnapshot.size

// 				if (productsSnapshot.size > maxProductCount) {
// 					maxProductCount = productsSnapshot.size
// 					topCat = categoryDoc.data().catalogueCategoryName
// 				}

// 				productsSnapshot.forEach((doc) => {
// 					const data = doc.data()
// 					totalStockCount += parseInt(data.stock || 0)
// 					revenue += parseFloat(data.price || 0) * parseInt(data.stock || 0)
// 				})
// 			}

// 			setTotalProducts(totalProductsCount)
// 			setTotalStock(totalStockCount)
// 			setTotalRevenue(revenue)
// 			setTopCategory(topCat)
// 		} catch (error) {
// 			console.error("Error fetching store data:", error)
// 		} finally {
// 			setLoading(false)
// 		}
// 	}

// 	useEffect(() => {
// 		const unsubscribe = onSnapshot(collection(db, "StoreTasks"), (snapshot) => {
// 			setTasks(
// 				snapshot.docs.map((doc) => ({
// 					id: doc.id,
// 					task: doc.data().task,
// 					completed: doc.data().completed || false,
// 				}))
// 			)
// 		})
// 		return () => unsubscribe()
// 	}, [])

// 	const toggleCompletion = async (taskId: string, isChecked: boolean) => {
// 		try {
// 			await updateDoc(doc(db, "StoreTasks", taskId), { completed: isChecked })
// 		} catch (error) {
// 			console.error("Error updating task completion:", error)
// 		}
// 	}

// 	const addTask = async () => {
// 		if (!newTask.trim()) return
// 		try {
// 			await addDoc(collection(db, "StoreTasks"), {
// 				task: newTask,
// 				createdAt: new Date(),
// 			})
// 			setNewTask("")
// 			setShowModal(false)
// 		} catch (error) {
// 			console.error("Error adding task:", error)
// 		}
// 	}

// 	const deleteTask = async (taskId: string) => {
// 		try {
// 			await deleteDoc(doc(db, "StoreTasks", taskId))
// 			setTasks((prev) => prev.filter((task) => task.id !== taskId))
// 		} catch (error) {
// 			console.error("Error deleting task:", error)
// 		}
// 	}

// 	const dashboardStats = [
// 		{
// 			title: "Total Categories",
// 			value: totalCategories,
// 			icon: <Boxes size={28} />, color: "bg-purple-500",
// 		},
// 		{
// 			title: "Total Products",
// 			value: totalProducts,
// 			icon: <Package size={28} />, color: "bg-teal-500",
// 		},
// 		{
// 			title: "Total Stock",
// 			value: totalStock,
// 			icon: <TrendingUp size={28} />, color: "bg-blue-500",
// 		},
// 		{
// 			title: "Est. Revenue",
// 			value: `₹${totalRevenue.toLocaleString()}`,
// 			icon: <DollarSign size={28} />, color: "bg-green-600",
// 		},
// 		{
// 			title: "Top Category",
// 			value: topCategory || "N/A",
// 			icon: <ListChecks size={28} />, color: "bg-pink-500",
// 		},
// 	]

// 	return (
// 		<div className="p-6 bg-gray-100 min-h-screen">
// 			<div className="flex justify-between items-center mb-6 px-6">
// 				<div>
// 					<h1 className="text-xl font-bold text-gray-900">Hello, Admin</h1>
// 					<p className="text-gray-500 text-sm">Today is {currentDate}</p>
// 				</div>
// 				<button
// 					onClick={() => setShowModal(true)}
// 					className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
// 				>
// 					<Plus className="w-4 h-4 mr-2" /> Add New Task
// 				</button>
// 			</div>

// 			{/* Dashboard Cards */}
// 			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-6">
// 				{dashboardStats.map((item, index) => (
// 					<motion.div
// 						key={index}
// 						className="p-6 rounded-xl shadow-md bg-white flex flex-col items-start space-y-4"
// 						initial={{ opacity: 0, y: 20 }}
// 						animate={{ opacity: 1, y: 0 }}
// 						transition={{ duration: 0.5, delay: index * 0.1 }}
// 					>
// 						<div className={`p-3 rounded-full text-white ${item.color}`}>{item.icon}</div>
// 						<h2 className="text-lg font-semibold text-gray-700">{item.title}</h2>
// 						<motion.p
// 							className="text-2xl font-bold"
// 							initial={{ opacity: 0, scale: 0.8 }}
// 							animate={{ opacity: 1, scale: 1 }}
// 							transition={{ duration: 0.8 }}
// 						>
// 							{item.value}
// 						</motion.p>
// 					</motion.div>
// 				))}
// 			</div>

// 			{/* Task List */}
// 			<div className="bg-white p-6 rounded-xl shadow-md mt-6 mx-6">
// 				<h3 className="text-lg font-semibold mb-4">Tasks for today</h3>
// 				{loading ? (
// 					<p>Loading...</p>
// 				) : tasks.length === 0 ? (
// 					<p>No tasks available</p>
// 				) : (
// 					tasks.map((task, i) => (
// 						<div key={i} className="flex items-center justify-between bg-gray-100 p-4 rounded-lg mb-2">
// 							<span>{task.task}</span>
// 							<div className="flex gap-5">
// 								<input
// 									type="checkbox"
// 									checked={task.completed}
// 									onChange={(e) => toggleCompletion(task.id, e.target.checked)}
// 									className="w-4 h-4"
// 								/>
// 								<button
// 									onClick={() => deleteTask(task.id)}
// 									className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm"
// 								>
// 									Delete
// 								</button>
// 							</div>
// 						</div>
// 					))
// 				)}
// 			</div>

// 			{/* Modal */}
// 			{showModal && (
// 				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
// 					<div className="bg-white p-6 rounded-lg shadow-md w-96">
// 						<h2 className="text-lg font-bold mb-4">Add New Task</h2>
// 						<input
// 							type="text"
// 							value={newTask}
// 							onChange={(e) => setNewTask(e.target.value)}
// 							className="w-full p-2 border rounded-lg mb-4"
// 							placeholder="Task name"
// 						/>
// 						<div className="flex justify-end gap-2">
// 							<button
// 								onClick={addTask}
// 								className="bg-blue-500 text-white px-4 py-2 rounded-lg"
// 							>
// 								Add
// 							</button>
// 							<button
// 								onClick={() => setShowModal(false)}
// 								className="bg-gray-300 px-4 py-2 rounded-lg"
// 							>
// 								Cancel
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			)}
// 		</div>
// 	)
// }


// "use client"
// import {
//   addDoc,
//   collection,
//   deleteDoc,
//   doc,
//   getDocs,
//   onSnapshot,
//   query,
//   Timestamp,
//   updateDoc,
//   where,
//   orderBy
// } from "firebase/firestore"
// import React, { useEffect, useState, useMemo } from "react"
// import { db } from "../lib/firebase"
// import { Plus, Boxes, Package, ShoppingBag, AlertTriangle, TrendingUp, BarChart2, Clock, Calendar, DollarSign } from "lucide-react"
// import { motion } from "framer-motion"
// import { Line, Bar, Pie } from 'react-chartjs-2'
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js'

// // Register ChartJS components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// )

// interface Task {
//   id: string
//   task: string
//   completed: boolean
// }

// interface Product {
//   id: string
//   catalogueProductName: string
//   price: number
//   stock: number
//   productImageUrl?: string
//   catalogueCategoryName: string
// }

// interface Order {
//   id: string
//   createdAt: Timestamp
//   status: string
//   total: number
//   products: {
//     id: string
//     name: string
//     price: number
//     quantity: number
//   }[]
// }

// interface Category {
//   id: string
//   catalogueCategoryName: string
//   productCount: number
// }

// export default function AdminDashboard() {
//   const [showModal, setShowModal] = useState(false)
//   const [newTask, setNewTask] = useState("")
//   const [tasks, setTasks] = useState<Task[]>([])
//   const [currentDate, setCurrentDate] = useState("")
//   const [categories, setCategories] = useState<Category[]>([])
//   const [products, setProducts] = useState<Product[]>([])
//   const [orders, setOrders] = useState<Order[]>([])
//   const [todayOrders, setTodayOrders] = useState<Order[]>([])
//   const [loading, setLoading] = useState(true)
//   const [storeId, setStoreId] = useState<string | null>(null)
//   const [activeTab, setActiveTab] = useState('dashboard')

//   // Format date
//   useEffect(() => {
//     const date = new Date()
//     const options: Intl.DateTimeFormatOptions = {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     }
//     setCurrentDate(date.toLocaleDateString("en-US", options))
//   }, [])

//   // Get storeId from localStorage
//   useEffect(() => {
//     const storedStoreId = localStorage.getItem("storeId")
//     if (storedStoreId) {
//       setStoreId(storedStoreId)
//       fetchData(storedStoreId)
//     } else {
//       console.error("No storeId found in localStorage")
//       setLoading(false)
//     }
//   }, [])

//   // Fetch all data
//   const fetchData = async (storeId: string) => {
//     try {
//       setLoading(true)
      
//       // Fetch categories
//       const categoriesSnapshot = await getDocs(
//         collection(db, `stores/${storeId}/categories`)
//       )
      
//     //   const categoriesData = await Promise.all(categoriesSnapshot.docs.map(async (categoryDoc) => {
//     //     const productsSnapshot = await getDocs(
//     //       collection(db, `stores/${storeId}/categories/${categoryDoc.id}/products`)
//     //     )
        
//     //     return {
//     //       id: categoryDoc.id,
//     //       catalogueCategoryName: categoryDoc.data().catalogueCategoryName,
//     //       productCount: productsSnapshot.size
//     //     }
//     //   })setCategories(categoriesData);

// 	const categoriesData = await Promise.all(categoriesSnapshot.docs.map(async (categoryDoc) => {
// 		const productsSnapshot = await getDocs(
// 		  collection(db, `stores/${storeId}/categories/${categoryDoc.id}/products`)
// 		);
		
// 		return {
// 		  id: categoryDoc.id,
// 		  catalogueCategoryName: categoryDoc.data().catalogueCategoryName,
// 		  productCount: productsSnapshot.size
// 		};
// 	  }));
	  
// 	  setCategories(categoriesData);
//       // Fetch all products
//       const allProducts: Product[] = []
//       for (const category of categoriesData) {
//         const productsSnapshot = await getDocs(
//           collection(db, `stores/${storeId}/categories/${category.id}/products`)
//         )
        
//         productsSnapshot.forEach(doc => {
//           allProducts.push({
//             id: doc.id,
//             ...doc.data(),
//             stock: Number(doc.data().stock) || 0,
//             price: Number(doc.data().price) || 0
//           } as Product)
//         })
//       }
      
//       setProducts(allProducts)

//       // Fetch orders
//       const ordersQuery = query(
//         collection(db, `stores/${storeId}/StoreOrders`),
//         orderBy('createdAt', 'desc')
//       )
      
//       const ordersSnapshot = await getDocs(ordersQuery)
//       const ordersData: Order[] = []
      
//       for (const orderDoc of ordersSnapshot.docs) {
//         const productsSnapshot = await getDocs(
//           collection(db, `stores/${storeId}/StoreOrders/${orderDoc.id}/products`)
//         )
        
//         const orderProducts = productsSnapshot.docs.map(doc => ({
//           id: doc.id,
//           ...doc.data()
//         }))
        
//         const total = orderProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0)
        
//         ordersData.push({
//           id: orderDoc.id,
//           ...orderDoc.data(),
//           products: orderProducts,
//           total,
//           createdAt: orderDoc.data().createdAt
//         } as Order)
//       }
      
//       setOrders(ordersData)
      
//       // Filter today's orders
//       const today = new Date()
//       today.setHours(0, 0, 0, 0)
      
//       const todayOrdersData = ordersData.filter(order => 
//         order.createdAt.toDate() >= today
//       )
      
//       setTodayOrders(todayOrdersData)
      
//     } catch (error) {
//       console.error("Error fetching data:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Real-time listener for tasks
//   useEffect(() => {
//     const unsubscribe = onSnapshot(
//       collection(db, "StoreTasks"),
//       (snapshot) => {
//         setTasks(
//           snapshot.docs.map((doc) => ({
//             id: doc.id,
//             task: doc.data().task,
//             completed: doc.data().completed || false,
//           }))
//         )
//       }
//     )
//     return () => unsubscribe()
//   }, [])

//   const toggleCompletion = async (taskId: string, isChecked: boolean) => {
//     try {
//       const taskRef = doc(db, "StoreTasks", taskId)
//       await updateDoc(taskRef, { completed: isChecked })
//     } catch (error) {
//       console.error("Error updating task completion: ", error)
//     }
//   }

//   const addTask = async () => {
//     if (!newTask.trim()) return

//     try {
//       await addDoc(collection(db, "StoreTasks"), {
//         task: newTask,
//         createdAt: new Date(),
//       })
//       setNewTask("")
//       setShowModal(false)
//     } catch (error) {
//       console.error("Error adding task: ", error)
//     }
//   }

//   const deleteTask = async (taskId: string) => {
//     try {
//       await deleteDoc(doc(db, "StoreTasks", taskId))
//       setTasks(tasks.filter((task) => task.id !== taskId))
//     } catch (error) {
//       console.error("Error deleting task: ", error)
//     }
//   }

//   // Calculate statistics
//   const totalRevenue = useMemo(() => 
//     orders.reduce((sum, order) => sum + order.total, 0), 
//     [orders]
//   )

//   const todayRevenue = useMemo(() => 
//     todayOrders.reduce((sum, order) => sum + order.total, 0), 
//     [todayOrders]
//   )

//   const lowStockProducts = useMemo(() => 
//     products.filter(product => product.stock < 10).sort((a, b) => a.stock - b.stock),
//     [products]
//   )

//   const revenueByCategory = useMemo(() => {
//     const revenueMap: Record<string, number> = {}
    
//     orders.forEach(order => {
//       order.products.forEach(product => {
//         const category = products.find(p => p.id === product.id)?.catalogueCategoryName || 'Unknown'
//         revenueMap[category] = (revenueMap[category] || 0) + (product.price * product.quantity)
//       })
//     })
    
//     return Object.entries(revenueMap).map(([category, revenue]) => ({
//       category,
//       revenue
//     })).sort((a, b) => b.revenue - a.revenue)
//   }, [orders, products])

//   const revenueByProduct = useMemo(() => {
//     const revenueMap: Record<string, {name: string, revenue: number}> = {}
    
//     orders.forEach(order => {
//       order.products.forEach(product => {
//         const productName = products.find(p => p.id === product.id)?.catalogueProductName || product.name
//         revenueMap[product.id] = {
//           name: productName,
//           revenue: (revenueMap[product.id]?.revenue || 0) + (product.price * product.quantity)
//         }
//       })
//     })
    
//     return Object.entries(revenueMap).map(([id, data]) => ({
//       id,
//       name: data.name,
//       revenue: data.revenue
//     })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
//   }, [orders, products])

//   // Chart data
//   const ordersChartData = {
//     labels: Array.from({length: 7}, (_, i) => {
//       const date = new Date()
//       date.setDate(date.getDate() - (6 - i))
//       return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
//     }),
//     datasets: [{
//       label: 'Orders',
//       data: Array.from({length: 7}, (_, i) => {
//         const date = new Date()
//         date.setDate(date.getDate() - (6 - i))
//         date.setHours(0, 0, 0, 0)
//         const nextDay = new Date(date)
//         nextDay.setDate(date.getDate() + 1)
        
//         return orders.filter(order => 
//           order.createdAt.toDate() >= date && order.createdAt.toDate() < nextDay
//         ).length
//       }),
//       borderColor: 'rgb(99, 102, 241)',
//       backgroundColor: 'rgba(99, 102, 241, 0.5)',
//       tension: 0.3
//     }]
//   }

//   const revenueChartData = {
//     labels: revenueByCategory.map(item => item.category),
//     datasets: [{
//       label: 'Revenue by Category',
//       data: revenueByCategory.map(item => item.revenue),
//       backgroundColor: [
//         'rgba(255, 99, 132, 0.7)',
//         'rgba(54, 162, 235, 0.7)',
//         'rgba(255, 206, 86, 0.7)',
//         'rgba(75, 192, 192, 0.7)',
//         'rgba(153, 102, 255, 0.7)',
//       ],
//       borderWidth: 1
//     }]
//   }

//   const stockChartData = {
//     labels: products.slice(0, 10).map(product => product.catalogueProductName),
//     datasets: [{
//       label: 'Stock Levels',
//       data: products.slice(0, 10).map(product => product.stock),
//       backgroundColor: 'rgba(75, 192, 192, 0.7)',
//       borderColor: 'rgba(75, 192, 192, 1)',
//       borderWidth: 1
//     }]
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navigation */}
//       <nav className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex">
//               <div className="flex-shrink-0 flex items-center">
//                 <h1 className="text-xl font-bold text-indigo-600">Store Admin</h1>
//               </div>
//               <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
//                 <button
//                   onClick={() => setActiveTab('dashboard')}
//                   className={`${activeTab === 'dashboard' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
//                 >
//                   Dashboard
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('products')}
//                   className={`${activeTab === 'products' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
//                 >
//                   Products
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('orders')}
//                   className={`${activeTab === 'orders' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
//                 >
//                   Orders
//                 </button>
//                 <button
//                   onClick={() => setActiveTab('analytics')}
//                   className={`${activeTab === 'analytics' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
//                 >
//                   Analytics
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
//             <p className="text-gray-500">Today is {currentDate}</p>
//           </div>
//           <button
//             onClick={() => setShowModal(true)}
//             className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
//           >
//             <Plus className="w-4 h-4 mr-2" /> Add New Task
//           </button>
//         </div>

//         {/* Dashboard Stats */}
//         {activeTab === 'dashboard' && (
//           <>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               {/* Total Categories */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Categories</p>
//                     <h3 className="text-2xl font-bold mt-1">{categories.length}</h3>
//                   </div>
//                   <div className="bg-indigo-100 p-3 rounded-full">
//                     <Boxes className="text-indigo-600" size={20} />
//                   </div>
//                 </div>
//               </div>

//               {/* Total Products */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Products</p>
//                     <h3 className="text-2xl font-bold mt-1">{products.length}</h3>
//                   </div>
//                   <div className="bg-teal-100 p-3 rounded-full">
//                     <Package className="text-teal-600" size={20} />
//                   </div>
//                 </div>
//               </div>

//               {/* Today's Orders */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Today's Orders</p>
//                     <h3 className="text-2xl font-bold mt-1">{todayOrders.length}</h3>
//                   </div>
//                   <div className="bg-orange-100 p-3 rounded-full">
//                     <ShoppingBag className="text-orange-600" size={20} />
//                   </div>
//                 </div>
//               </div>

//               {/* Today's Revenue */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
//                     <h3 className="text-2xl font-bold mt-1">₹{todayRevenue.toLocaleString()}</h3>
//                   </div>
//                   <div className="bg-green-100 p-3 rounded-full">
//                     <DollarSign className="text-green-600" size={20} />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Charts Row */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//               {/* Orders Chart */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold mb-4 flex items-center">
//                   <TrendingUp className="mr-2" size={18} /> Orders Last 7 Days
//                 </h3>
//                 <div className="h-64">
//                   <Line data={ordersChartData} options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                       legend: {
//                         position: 'top',
//                       },
//                     },
//                   }} />
//                 </div>
//               </div>

//               {/* Revenue by Category */}
//               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//                 <h3 className="text-lg font-semibold mb-4 flex items-center">
//                   <BarChart2 className="mr-2" size={18} /> Revenue by Category
//                 </h3>
//                 <div className="h-64">
//                   <Pie data={revenueChartData} options={{
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                       legend: {
//                         position: 'right',
//                       },
//                     },
//                   }} />
//                 </div>
//               </div>
//             </div>

//             {/* Low Stock Alerts */}
//             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
//               <h3 className="text-lg font-semibold mb-4 flex items-center">
//                 <AlertTriangle className="mr-2 text-yellow-500" size={18} /> Low Stock Alerts
//               </h3>
//               {lowStockProducts.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {lowStockProducts.map((product) => (
//                         <tr key={product.id}>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <div className="flex items-center">
//                               {product.productImageUrl ? (
//                                 <img className="h-10 w-10 rounded-md object-cover mr-3" src={product.productImageUrl} alt={product.catalogueProductName} />
//                               ) : (
//                                 <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
//                                   <Package size={16} className="text-gray-400" />
//                                 </div>
//                               )}
//                               <div className="text-sm font-medium text-gray-900">{product.catalogueProductName}</div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.catalogueCategoryName}</td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock < 5 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
//                               {product.stock} left
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.price.toLocaleString()}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No low stock products</p>
//               )}
//             </div>

//             {/* Recent Orders */}
//             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//               <h3 className="text-lg font-semibold mb-4 flex items-center">
//                 <Clock className="mr-2" size={18} /> Recent Orders
//               </h3>
//               {todayOrders.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white divide-y divide-gray-200">
//                       {todayOrders.slice(0, 5).map((order) => (
//                         <tr key={order.id}>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                             {order.createdAt.toDate().toLocaleTimeString()}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                               order.status === 'completed' ? 'bg-green-100 text-green-800' :
//                               order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                               'bg-blue-100 text-blue-800'
//                             }`}>
//                               {order.status}
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.total.toLocaleString()}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No orders today</p>
//               )}
//             </div>
//           </>
//         )}

//         {/* Products Tab */}
//         {activeTab === 'products' && (
//           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//             <h3 className="text-lg font-semibold mb-4">All Products</h3>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {products.map((product) => {
//                     const productRevenue = revenueByProduct.find(p => p.id === product.id)?.revenue || 0
//                     return (
//                       <tr key={product.id}>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <div className="flex items-center">
//                             {product.productImageUrl ? (
//                               <img className="h-10 w-10 rounded-md object-cover mr-3" src={product.productImageUrl} alt={product.catalogueProductName} />
//                             ) : (
//                               <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
//                                 <Package size={16} className="text-gray-400" />
//                               </div>
//                             )}
//                             <div className="text-sm font-medium text-gray-900">{product.catalogueProductName}</div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.catalogueCategoryName}</td>
//                         <td className="px-6 py-4 whitespace-nowrap">
//                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             product.stock < 5 ? 'bg-red-100 text-red-800' :
//                             product.stock < 10 ? 'bg-yellow-100 text-yellow-800' :
//                             'bg-green-100 text-green-800'
//                           }`}>
//                             {product.stock}
//                           </span>
//                         </td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.price.toLocaleString()}</td>
//                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{productRevenue.toLocaleString()}</td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Orders Tab */}
//         {activeTab === 'orders' && (
//           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//             <h3 className="text-lg font-semibold mb-4">All Orders</h3>
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {orders.map((order) => (
//                     <tr key={order.id}>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {order.createdAt.toDate().toLocaleDateString()}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {order.products.length} items
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                           order.status === 'completed' ? 'bg-green-100 text-green-800' :
//                           order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                           'bg-blue-100 text-blue-800'
//                         }`}>
//                           {order.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{order.total.toLocaleString()}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Analytics Tab */}
//         {activeTab === 'analytics' && (
//           <div className="space-y-6">
//             {/* Revenue Overview */}
//             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//               <h3 className="text-lg font-semibold mb-4">Revenue Overview</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <p className="text-sm font-medium text-gray-500">Total Revenue</p>
//                   <h3 className="text-2xl font-bold mt-1">₹{totalRevenue.toLocaleString()}</h3>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <p className="text-sm font-medium text-gray-500">Today's Revenue</p>
//                   <h3 className="text-2xl font-bold mt-1">₹{todayRevenue.toLocaleString()}</h3>
//                 </div>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
//                   <h3 className="text-2xl font-bold mt-1">₹{orders.length > 0 ? (totalRevenue / orders.length).toLocaleString(undefined, {maximumFractionDigits: 2}) : 0}</h3>
//                 </div>
//               </div>
//               <div className="h-80">
//                 <Bar data={{
//                   labels: revenueByCategory.map(item => item.category),
//                   datasets: [{
//                     label: 'Revenue by Category',
//                     data: revenueByCategory.map(item => item.revenue),
//                     backgroundColor: 'rgba(79, 70, 229, 0.7)',
//                   }]
//                 }} options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       display: false
//                     },
//                   },
//                   scales: {
//                     y: {
//                       beginAtZero: true
//                     }
//                   }
//                 }} />
//               </div>
//             </div>

//             {/* Top Products */}
//             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//               <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
//               <div className="h-80">
//                 <Bar data={{
//                   labels: revenueByProduct.map(item => item.name),
//                   datasets: [{
//                     label: 'Revenue',
//                     data: revenueByProduct.map(item => item.revenue),
//                     backgroundColor: 'rgba(16, 185, 129, 0.7)',
//                   }]
//                 }} options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       display: false
//                     },
//                   },
//                   indexAxis: 'y',
//                   scales: {
//                     x: {
//                       beginAtZero: true
//                     }
//                   }
//                 }} />
//               </div>
//             </div>

//             {/* Stock Levels */}
//             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
//               <h3 className="text-lg font-semibold mb-4">Stock Levels</h3>
//               <div className="h-80">
//                 <Bar data={stockChartData} options={{
//                   responsive: true,
//                   maintainAspectRatio: false,
//                   plugins: {
//                     legend: {
//                       display: false
//                     },
//                   },
//                   scales: {
//                     y: {
//                       beginAtZero: true
//                     }
//                   }
//                 }} />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Task List */}
//         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
//           <h3 className="text-lg font-semibold mb-4">Tasks for today</h3>
//           {loading ? (
//             <p>Loading...</p>
//           ) : tasks.length === 0 ? (
//             <p>No tasks available</p>
//           ) : (
//             tasks.map((task, i) => (
//               <motion.div
//                 key={i}
//                 className="flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-2"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.3, delay: i * 0.05 }}
//               >
//                 <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.task}</span>
//                 <div className="flex justify-center items-center gap-5">
//                   <input
//                     type="checkbox"
//                     checked={task.completed}
//                     onChange={(e) => toggleCompletion(task.id, e.target.checked)}
//                     className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
//                   />
//                   <button
//                     onClick={() => deleteTask(task.id)}
//                     className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </motion.div>
//             ))
//           )}
//         </div>

//         {/* Modal for Adding Task */}
//         {showModal && (
//           <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//             <motion.div 
//               className="bg-white p-6 rounded-lg shadow-md w-96"
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//             >
//               <h2 className="text-lg font-bold mb-4">Add New Task</h2>
//               <input
//                 type="text"
//                 value={newTask}
//                 onChange={(e) => setNewTask(e.target.value)}
//                 className="w-full p-2 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
//                 placeholder="Task name"
//                 onKeyPress={(e) => e.key === 'Enter' && addTask()}
//               />
//               <div className="flex justify-end">
//                 <button
//                   onClick={() => setShowModal(false)}
//                   className="mr-2 bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={addTask}
//                   className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
//                 >
//                   Add Task
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }