// "use client"
// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { logoutService } from "../service/login.service"
// import { toast } from "react-toastify"

// export default function Sidebar() {
// 	const router = useRouter()
// 	const handleLogOut = async () => {
// 		await logoutService()
// 		toast.success("Logout Successfully")
// 		router.push("/")
// 	}
// 	return (
// 		<div className="bg-gray-900 text-white min-h-screen flex flex-col w-64 flex-shrink-0 antialiased p-4">
// 			<h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">
// 				Menu
// 			</h2>
// 			<ul className="space-y-4">
// 				<li>
// 					<Link
// 						href="/storedashboard"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						Dashboard
// 					</Link>
// 				</li>
// 				<li>
// 					<Link
// 						href="/storedashboard/Categories"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						Categories
// 					</Link>
// 				</li>
// 				<li>
// 					<Link
// 						href="/storedashboard/Products"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						Products
// 					</Link>
// 				</li>
// 				<li>
// 					<Link
// 						href="/storedashboard/orders"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						Orders
// 					</Link>
// 				</li>
// 				<li>
// 					<Link
// 						href="/sales"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						Sales
// 					</Link>
// 				</li>
// 				<li>
// 					<Link
// 						href="/barcode"
// 						className="hover:text-blue-400 transition-all duration-300"
// 					>
// 						BarCode
// 					</Link>
// 				</li>
// 				<li onClick={handleLogOut} className="cursor-pointer">
// 					<span className="hover:text-red-500 transition-all duration-300">
// 						LogOut
// 					</span>
// 				</li>
// 			</ul>
// 		</div>
// 	)
// }




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
	QrCode
} from "lucide-react"

export default function Sidebar() {
	const router = useRouter()
	const pathname = usePathname()

	const handleLogOut = async () => {
		await logoutService()
		toast.success("Logout Successfully")
		router.push("/")
	}

	const navItems = [
		{ name: "Dashboard", href: "/storedashboard", icon: LayoutDashboard },
		{ name: "Categories", href: "/storedashboard/Categories", icon: Tag },
		{ name: "Products", href: "/storedashboard/Products", icon: Package },
		{ name: "Orders", href: "/storedashboard/orders", icon: ShoppingCart },
		{ name: "Sales", href: "/sales", icon: BarChart3 },
		{ name: "BarCode", href: "/barcode", icon: QrCode }
	]

	return (
		<div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen w-64 flex flex-col px-4 py-6 shadow-xl rounded-r-2xl border-r border-gray-700">
			<h2 className="text-3xl font-bold mb-8 text-center tracking-tight">Admin</h2>
			<ul className="space-y-3 flex-1">
				{navItems.map(({ name, href, icon: Icon }) => {
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
								<Icon className="w-5 h-5" />
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
