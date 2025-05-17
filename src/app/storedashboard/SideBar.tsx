"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { logoutService } from "../service/login.service"
import { toast } from "react-toastify"
import {
	LayoutDashboard,
	Package,
	Tag,
	ShoppingCart,
	BarChart3,
	LogOut,
	QrCode,
} from "lucide-react"
import { useState, useEffect } from "react"
import { db } from "../lib/firebase" // Adjust the path to your Firebase config
import {
	collection,
	query,
	where,
	onSnapshot,
	getDocs,
} from "firebase/firestore"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default function Sidebar() {
	const router = useRouter()
	const pathname = usePathname()
	const [pendingOrdersCount, setPendingOrdersCount] =
		useState<number>(0)
	const [storeId, setStoreId] = useState<string | null>(null)

	// Fetch storeId based on authenticated user
	useEffect(() => {
		const auth = getAuth()
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user?.email) {
				const q = query(
					collection(db, "stores"),
					where("email", "==", user.email)
				)
				const querySnapshot = await getDocs(q)
				const id = querySnapshot.docs[0]?.id || null
				setStoreId(id)
			}
		})
		return () => unsubscribe()
	}, [])

	// Fetch pending orders count
	useEffect(() => {
		if (!storeId) return

		const ordersQuery = query(
			collection(db, "Orders"),
			where(`storeStatuses.${storeId}`, "==", "pending")
		)

		const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
			setPendingOrdersCount(snapshot.docs.length)
		})

		return () => unsubscribe()
	}, [storeId])

	const handleLogOut = async () => {
		await logoutService()
		toast.success("Logout Successfully")
		router.push("/")
	}

	const navItems = [
		{
			name: "Dashboard",
			href: "/storedashboard",
			icon: LayoutDashboard,
		},
		{
			name: "Categories",
			href: "/storedashboard/Categories",
			icon: Tag,
		},
		{
			name: "Products",
			href: "/storedashboard/Products",
			icon: Package,
		},
		{
			name: "Orders",
			href: "/storedashboard/orders",
			icon: ShoppingCart,
			badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
		},
		{ name: "Sales", href: "/sales", icon: BarChart3 },
		{ name: "BarCode", href: "/barcode", icon: QrCode },
	]

	return (
		<div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen w-64 flex flex-col px-4 py-6 shadow-xl rounded-r-2xl border-r border-gray-700">
			<h2 className="text-3xl font-bold mb-8 text-center tracking-tight">
				Admin
			</h2>
			<ul className="space-y-3 flex-1">
				{navItems.map(({ name, href, icon: Icon, badge }) => {
					const isActive = pathname === href
					return (
						<li key={name}>
							<Link
								href={href}
								className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 ${
									isActive
										? "bg-blue-600 text-white shadow-md"
										: "hover:bg-gray-700 hover:text-white text-gray-300"
								}`}
							>
								<div className="relative flex items-center">
									<Icon className="w-5 h-5" />
									{badge && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
											{badge}
										</span>
									)}
								</div>
								<span className="text-sm font-medium">{name}</span>
							</Link>
						</li>
					)
				})}
			</ul>
			<div className="mt-auto">
				<button
					onClick={handleLogOut}
					className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 transition-all"
				>
					<LogOut className="w-5 h-5" />
					Logout
				</button>
			</div>
		</div>
	)
}
