"use client"
import { db } from "../../lib/firebase"
import {
	collection,
	query,
	where,
	onSnapshot,
	updateDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
} from "firebase/firestore"
import { useState, useEffect, useCallback } from "react"
import {
	CheckCircleIcon,
	TruckIcon,
	UserIcon,
	PackageIcon,
	ClockIcon,
} from "lucide-react"

// type ProductStatus = "pending" | "accepted" | "rejected" | "packaged" | "onway" | "delivered";
type ProductStatus =
	| "pending"
	| "reviewed"
	| "accepted"
	| "rejected"
	| "assigned"
	| "picked"
	| "onway"
	| "delivered"

type Product = {
	id: string
	name: string
	price: number
	quantity: number
	productImageUrl: string
	status: ProductStatus
}

type StoreOrder = {
	id: string
	storeId: string
	status: ProductStatus
	createdAt: Date
	timestamps: {
		accepted?: Date
		rejected?: Date
		packaged?: Date
		onway?: Date
		delivered?: Date
	}
}

type Order = {
	id: string
	userId: string
	createdAt: Date
	status: ProductStatus
	storeStatuses: Record<string, ProductStatus>
	storeOrders: StoreOrder[]
	products: Product[]
	location: {
		address: string
		latitude: number
		longitude: number
	}
	deliveryAgentId?: string | null
	deliveryAgentName?: string
	storeName?: string
}

type DeliveryAgent = {
	agentId: string
	agentName: string
	email: string
	mobilenumber: string
	status?: string
	isAvailable: boolean
}

const SuperAdminOrders: React.FC = () => {
	const [unassignedOrders, setUnassignedOrders] = useState<Order[]>(
		[]
	)
	const [assignedOrders, setAssignedOrders] = useState<Order[]>([])
	const [deliveryAgents, setDeliveryAgents] = useState<
		DeliveryAgent[]
	>([])
	const [storeNames, setStoreNames] = useState<
		Record<string, string>
	>({})
	const [assigningOrder, setAssigningOrder] = useState<string | null>(
		null
	)
	const [selectedAgent, setSelectedAgent] = useState<string>("")
	const [isLoading, setIsLoading] = useState(true)
	const [activeTab, setActiveTab] = useState<
		"unassigned" | "assigned"
	>("unassigned")

	// Fetch store names for caching
	const fetchStoreNames = useCallback(async () => {
		const storesRef = collection(db, "stores")
		const storesSnapshot = await getDocs(storesRef)
		const storeData: Record<string, string> = {}

		storesSnapshot.docs.forEach((doc) => {
			storeData[doc.id] = doc.data().storeName || "Unknown Store"
		})

		setStoreNames(storeData)
		return storeData
	}, [])

	// Fetch delivery agents
	const fetchDeliveryAgents = useCallback(async () => {
		const agentsRef = collection(db, "agents")
		const agentsQuery = query(
			agentsRef,
			where("isAvaliable", "==", true)
		)

		const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
			const agentsList = snapshot.docs.map((doc) => ({
				agentId: doc.id,
				agentName: doc.data().agentName || "Unknown Agent",
				email: doc.data().email || "",
				mobilenumber: doc.data().mobilenumber || "",
				isAvaliable: doc.data().isAvailable || true,
			}))

			setDeliveryAgents(agentsList as [])
		})

		return unsubscribe
	}, [])

	// Helper function to fetch store orders for a specific order
	const fetchStoreOrders = useCallback(async (orderId: string) => {
		const storeOrdersRef = collection(
			db,
			`Orders/${orderId}/StoreOrders`
		)
		const snapshot = await getDocs(storeOrdersRef)
		return snapshot.docs.map(
			(doc) =>
				({
					id: doc.id,
					storeId: doc.data().storeId,
					status: doc.data().status || "pending",
					createdAt: doc.data().createdAt?.toDate() || new Date(),
					timestamps: {
						accepted: doc.data().acceptedAt?.toDate(),
						rejected: doc.data().rejectedAt?.toDate(),
						packaged: doc.data().packagedAt?.toDate(),
						onway: doc.data().onwayAt?.toDate(),
						delivered: doc.data().deliveredAt?.toDate(),
					},
				} as StoreOrder)
		)
	}, [])

	// Helper function to fetch products for a specific store order
	const fetchProductsForOrder = useCallback(
		async (orderId: string, storeOrderId: string) => {
			const productsRef = collection(
				db,
				`Orders/${orderId}/StoreOrders/${storeOrderId}/products`
			)
			const snapshot = await getDocs(productsRef)
			return snapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						name: doc.data().name || "Unknown",
						price: doc.data().price || 0,
						quantity: doc.data().quantity || 0,
						productImageUrl: doc.data().productImageUrl || "",
						status: doc.data().status || "pending",
					} as Product)
			)
		},
		[]
	)
	const fetchOrders = useCallback(
		async (storeData: Record<string, string>) => {
			const ordersRef = collection(db, "Orders")

			// Query for all orders ordered by creation date
			const ordersQuery = query(
				ordersRef,
				orderBy("createdAt", "desc")
			)

			const unsubscribe = onSnapshot(
				ordersQuery,
				async (snapshot) => {
					const unassigned: Order[] = []
					const assigned: Order[] = []

					for (const doc of snapshot.docs) {
						const data = doc.data()

						// Skip if completely rejected orders
						if (data.status === "rejected") continue

						// Fetch related data
						const storeOrders = await fetchStoreOrders(doc.id)
						const productsPromises = storeOrders.map((storeOrder) =>
							fetchProductsForOrder(doc.id, storeOrder.id)
						)
						const productsArrays = await Promise.all(productsPromises)
						const products = productsArrays.flat()

						const order: Order = {
							id: doc.id,
							createdAt: data.createdAt?.toDate() || new Date(),
							status: data.status || "pending",
							userId: data.userId || "Unknown User",
							location: {
								address: data.location?.address || "Unknown Location",
								latitude: data.location?.latitude || 0,
								longitude: data.location?.longitude || 0,
							},
							storeStatuses: data.storeStatuses || {},
							storeOrders,
							products,
							deliveryAgentId: data.deliveryAgentId || null,
							deliveryAgentName: data.deliveryAgentName || null,
							// storeName: storeData[data.storeId] || "Unknown Store"
							storeName:
								storeOrders.length > 0
									? storeData[storeOrders[0].storeId] ||
									  "Unknown Store"
									: storeData[data.storeId] || "Unknown Store",
						}

						// Simple categorization - if it has an agent, it's assigned
						if (data.deliveryAgentId) {
							assigned.push(order)
						}
						// For unassigned - only show those with accepted or reviewed status
						else if (
							data.status === "accepted" ||
							data.status === "reviewed"
						) {
							unassigned.push(order)
						}
					}

					setUnassignedOrders(
						unassigned.sort(
							(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
						)
					)
					setAssignedOrders(
						assigned.sort(
							(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
						)
					)
					setIsLoading(false)
				}
			)

			return unsubscribe
		},
		[fetchStoreOrders, fetchProductsForOrder]
	)

	useEffect(() => {
		const loadData = async () => {
			setIsLoading(true)
			const storeData = await fetchStoreNames()
			const unsubscribeOrders = await fetchOrders(storeData)
			const unsubscribeAgents = await fetchDeliveryAgents()

			return () => {
				unsubscribeOrders()
				unsubscribeAgents()
			}
		}

		loadData()
	}, [fetchStoreNames, fetchOrders, fetchDeliveryAgents])

	// Update assignDeliveryAgent function
	const assignDeliveryAgent = useCallback(
		async (orderId: string) => {
			if (!selectedAgent) return

			try {
				const orderRef = doc(db, "Orders", orderId)
				const agentRef = doc(db, "agents", selectedAgent)

				const agentSnap = await getDoc(agentRef)
				if (!agentSnap.exists()) throw new Error("Agent not found")

				const agentData = agentSnap.data()
				const agentName = agentData.agentName

				// Update Firestore with assigned status
				await updateDoc(orderRef, {
					deliveryAgentId: selectedAgent,
					deliveryAgentName: agentName,
					status: "assigned", // Changed from "onway" to "assigned"
					assignedAt: new Date(),
				})

				// Remove from unassigned orders locally
				setUnassignedOrders((prev) =>
					prev.filter((order) => order.id !== orderId)
				)

				// Add to assigned orders locally
				const updatedOrder = unassignedOrders.find(
					(order) => order.id === orderId
				)
				if (updatedOrder) {
					const newAssignedOrder: Order = {
						...updatedOrder,
						deliveryAgentId: selectedAgent,
						deliveryAgentName: agentName,
						status: "assigned" as ProductStatus, // Explicitly type the status
					}
					setAssignedOrders((prev) => [newAssignedOrder, ...prev])
				}

				setSelectedAgent("")
				setAssigningOrder(null)
			} catch (error) {
				console.error("Assignment failed:", error)
				alert("Assignment failed. Please try again.")
			}
		},
		[selectedAgent, unassignedOrders]
	)

	const startAssigning = (orderId: string) => {
		setAssigningOrder(orderId)
		setSelectedAgent("")
	}

	const cancelAssigning = () => {
		setAssigningOrder(null)
		setSelectedAgent("")
	}

	const getStatusBadge = (status: ProductStatus) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800"
			case "accepted":
				return "bg-blue-100 text-blue-800"
			case "rejected":
				return "bg-red-100 text-red-800"
			case "picked":
				return "bg-indigo-100 text-indigo-800"
			case "onway":
				return "bg-purple-100 text-purple-800"
			case "delivered":
				return "bg-green-100 text-green-800"
			default:
				return "bg-gray-100 text-gray-800"
		}
	}

	const getStatusIcon = (status: ProductStatus) => {
		switch (status) {
			case "pending":
				return <ClockIcon className="w-4 h-4" />
			case "accepted":
				return <CheckCircleIcon className="w-4 h-4" />
			case "picked":
				return <PackageIcon className="w-4 h-4" />
			case "onway":
				return <TruckIcon className="w-4 h-4" />
			case "delivered":
				return <CheckCircleIcon className="w-4 h-4" />
			default:
				return <ClockIcon className="w-4 h-4" />
		}
	}

	const renderOrderCard = (order: Order, isAssignable: boolean) => (
		<div
			key={order.id}
			className="bg-white shadow-lg rounded-xl p-6 border"
		>
			<div className="flex items-center justify-between mb-4">
				<div>
					<div className="flex items-center mb-2">
						<span
							className={`inline-flex items-center text-xs font-medium px-4 py-3  rounded-full mr-2 ${getStatusBadge(
								order.status
							)}`}
						>
							{getStatusIcon(order.status)}
							<span className="ml-1">
								{order.status.toUpperCase()}
							</span>
						</span>
						{isAssignable && (
							<span className="bg-green-100 text-green-800 text-xs  font-medium px-4 py-3 last:rounded-full">
								Ready for Delivery
							</span>
						)}
					</div>

					<h3 className="text-xl font-semibold">
						Order #{order.id.substring(0, 8)}
					</h3>

					<div className="mt-3 space-y-2 text-gray-700">
						<p className="flex items-center">
							<span className="font-medium mr-2">Store:</span>
							{order.storeName}
						</p>
						<p className="flex items-center">
							<span className="font-medium mr-2">Date:</span>
							{order.createdAt.toLocaleString()}
						</p>
						<p className="flex items-center">
							<span className="font-medium mr-2">Location:</span>
							{order.location.address}
						</p>
						{order.deliveryAgentId && (
							<p className="flex items-center text-blue-600">
								<UserIcon className="w-4 h-4 mr-1" />
								<span className="font-medium mr-2">Assigned to:</span>
								{order.deliveryAgentName}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="border rounded-lg overflow-hidden mt-4">
				<table className="w-full border-collapse">
					<thead className="bg-gray-100 text-gray-700">
						<tr>
							<th className="p-3 text-left">Product</th>
							<th className="p-3 text-center">Price</th>
							<th className="p-3 text-center">Quantity</th>
							<th className="p-3 text-center">Status</th>
						</tr>
					</thead>
					<tbody>
						{order.products.map((product) => (
							<tr key={product.id} className="border-t">
								<td className="p-3 flex items-center gap-3">
									<img
										src={product.productImageUrl}
										alt={product.name}
										className="w-12 h-12 rounded-md object-cover"
									/>
									<span
										className={`text-gray-800 ${
											product.status === "rejected"
												? "line-through text-red-500"
												: ""
										}`}
									>
										{product.name}
									</span>
								</td>
								<td className="p-3 text-gray-700 font-semibold text-center">
									₹{product.price}
								</td>
								<td className="p-3 text-gray-700 text-center">
									{product.quantity}
								</td>
								<td className="p-3 text-center">
									<span
										className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusBadge(
											product.status
										)}`}
									>
										{getStatusIcon(product.status)}
										{product.status}
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{isAssignable &&
				(assigningOrder === order.id ? (
					<div className="mt-6 p-4 bg-gray-50 rounded-lg border">
						<h4 className="font-medium mb-3">
							Assign Delivery Agent
						</h4>
						<div className="flex flex-wrap gap-3">
							<select
								value={selectedAgent}
								onChange={(e) => setSelectedAgent(e.target.value)}
								className="flex-grow p-2 border rounded-md"
							>
								<option value="">Select delivery agent</option>
								{deliveryAgents.map((agent) => (
									<option key={agent.agentId} value={agent.agentId}>
										{agent.agentName}
									</option>
								))}
							</select>
							<button
								onClick={() => assignDeliveryAgent(order.id)}
								disabled={!selectedAgent}
								className={`px-4 py-2 rounded-md ${
									selectedAgent
										? "bg-blue-600 hover:bg-blue-700 text-white"
										: "bg-gray-300 text-gray-500 cursor-not-allowed"
								}`}
							>
								Assign
							</button>
							<button
								onClick={cancelAssigning}
								className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
							>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="mt-6">
						<button
							onClick={() => startAssigning(order.id)}
							className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all shadow-md"
						>
							<TruckIcon className="w-5 h-5" />
							Assign Delivery Agent
						</button>
					</div>
				))}
		</div>
	)

	const renderNoOrdersMessage = (type: "unassigned" | "assigned") => (
		<div className="bg-white rounded-xl shadow-lg p-8 text-center">
			<TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
			<p className="text-xl text-gray-600">
				{type === "unassigned"
					? "No orders ready for delivery assignment at this time."
					: "No orders currently in delivery."}
			</p>
		</div>
	)

	return (
		<div className="max-w-6xl mx-auto p-6">
			<h2 className="text-4xl font-bold mb-6 text-gray-800">
				🚚 Delivery Management
			</h2>

			{/* Tab navigation */}
			<div className="flex border-b mb-6">
				<button
					onClick={() => setActiveTab("unassigned")}
					className={`py-2 px-4 font-medium text-lg ${
						activeTab === "unassigned"
							? "border-b-2 border-blue-600 text-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					Unassigned Orders
				</button>
				<button
					onClick={() => setActiveTab("assigned")}
					className={`py-2 px-4 font-medium text-lg ${
						activeTab === "assigned"
							? "border-b-2 border-blue-600 text-blue-600"
							: "text-gray-600 hover:text-blue-600"
					}`}
				>
					Assigned Orders
				</button>
			</div>

			{isLoading ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading orders...</p>
				</div>
			) : (
				<div className="space-y-6">
					{activeTab === "unassigned" ? (
						<div className="grid gap-6">
							{unassignedOrders.length > 0
								? unassignedOrders.map((order) =>
										renderOrderCard(order, true)
								  )
								: renderNoOrdersMessage("unassigned")}
						</div>
					) : (
						<div className="grid gap-6">
							{assignedOrders.length > 0
								? assignedOrders.map((order) =>
										renderOrderCard(order, false)
								  )
								: renderNoOrdersMessage("assigned")}
						</div>
					)}
				</div>
			)}
		</div>
	)
}

export default SuperAdminOrders
