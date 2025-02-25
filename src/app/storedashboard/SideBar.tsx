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
		<div className="bg-gray-900 text-white h-screen w-64 p-5">
			<h2 className="text-2xl font-semibold mb-6">Menu</h2>
			<ul className="space-y-4">
				<li>
					<Link
						href="/storedashboard/Categories"
						className="hover:text-blue-400"
					>
						Categories
					</Link>
				</li>
				<li>
					<Link
						href="/storedashboard/Products"
						className="hover:text-blue-400"
					>
						Products
					</Link>
				</li>
				<li>
					<Link href="/orders" className="hover:text-blue-400">
						Orders
					</Link>
				</li>
				<li>
					<Link href="/sales" className="hover:text-blue-400">
						Sales
					</Link>
				</li>
				<li>
					<Link href="/barcode" className="hover:text-blue-400">
						BarCode
					</Link>
				</li>
				<li onClick={handleLogOut}>
					<Link href="/barcode" className="hover:text-blue-400">
						LogOut
					</Link>
				</li>
			</ul>
		</div>
	)
}
