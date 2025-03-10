"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutService } from "../service/login.service"
import { toast } from "react-toastify"

export default function Sidebar() {
	const router = useRouter()
	const handleLogOut = async () => {
		await logoutService()
		toast.success("Logout Successfully")
		router.push("/")
	}
	return (
		<div className="bg-gray-900 text-white min-h-screen flex flex-col w-64 flex-shrink-0 antialiased p-4">
			<h2 className="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">
				Menu
			</h2>
			<ul className="space-y-4">
				<li>
					<Link
						href="/storedashboard"
						className="hover:text-blue-400 transition-all duration-300"
					>
						Dashboard
					</Link>
				</li>
				<li>
					<Link
						href="/storedashboard/Categories"
						className="hover:text-blue-400 transition-all duration-300"
					>
						Categories
					</Link>
				</li>
				<li>
					<Link
						href="/storedashboard/Products"
						className="hover:text-blue-400 transition-all duration-300"
					>
						Products
					</Link>
				</li>
				<li>
					<Link
						href="/storedashboard/orders"
						className="hover:text-blue-400 transition-all duration-300"
					>
						Orders
					</Link>
				</li>
				<li>
					<Link
						href="/sales"
						className="hover:text-blue-400 transition-all duration-300"
					>
						Sales
					</Link>
				</li>
				<li>
					<Link
						href="/barcode"
						className="hover:text-blue-400 transition-all duration-300"
					>
						BarCode
					</Link>
				</li>
				<li onClick={handleLogOut} className="cursor-pointer">
					<span className="hover:text-red-500 transition-all duration-300">
						LogOut
					</span>
				</li>
			</ul>
		</div>
	)
}
