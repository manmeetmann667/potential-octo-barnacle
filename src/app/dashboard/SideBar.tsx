"use client"
import Link from "next/link"
import React from "react"
import { logoutService } from "../service/login.service"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

export default function SideBar() {
	const router = useRouter()
	const handleLogOut = async () => {
		await logoutService()
		toast.success("Logout Successfully")
		router.push("/")
	}

	return (
		<div>
			<div className="min-h-screen flex flex-col max-w-64 flex-shrink-0 antialiased  text-gray-800">
				<div className="fixed flex flex-col top-0 left-0 w-64 bg-white h-full border-r">
					<div className="flex items-center justify-center h-14 ">
						<div className="font-bold text-3xl pt-6">Dashboard</div>
					</div>
					<div className="overflow-y-auto overflow-x-hidden flex-grow">
						<ul className="flex flex-col py-4 space-y-1">
							<li className="px-5">
								<div className="flex flex-row items-center h-8">
									<div className="text-sm font-light tracking-wide text-gray-500">
										Menu
									</div>
								</div>
							</li>
							<Link href={"/dashboard"}>
								<li>
									<div className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
										<span className="inline-flex justify-center items-center ml-4">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
												></path>
											</svg>
										</span>
										<span className="ml-2 text-sm tracking-wide truncate">
											Dashboard
										</span>
									</div>
								</li>
							</Link>
							<Link href={"/dashboard/store"}>
								<li>
									<div className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
										<span className="inline-flex justify-center items-center ml-4">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
												></path>
											</svg>
										</span>
										<span className="ml-2 text-sm tracking-wide truncate">
											Stores
										</span>
									</div>
								</li>
							</Link>
							<Link href={"/dashboard/agent"}>
								<li>
									<div className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
										<span className="inline-flex justify-center items-center ml-4">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
												></path>
											</svg>
										</span>
										<span className="ml-2 text-sm tracking-wide truncate">
											Delivery Agents
										</span>
									</div>
								</li>
							</Link>
							<Link href={"/dashboard/order"}>
								<li>
									<div className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6">
										<span className="inline-flex justify-center items-center ml-4">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
												></path>
											</svg>
										</span>
										<span className="ml-2 text-sm tracking-wide truncate">
											Orders
										</span>
									</div>
								</li>
							</Link>

							<li className="px-5">
								<div className="flex flex-row items-center h-8">
									<div className="text-sm font-light tracking-wide text-gray-500">
										Settings
									</div>
								</div>
							</li>

							<li>
								<a
									href="#"
									onClick={handleLogOut}
									className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-gray-50 text-gray-600 hover:text-gray-800 border-l-4 border-transparent hover:border-indigo-500 pr-6"
								>
									<span className="inline-flex justify-center items-center ml-4">
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
											></path>
										</svg>
									</span>
									<span className="ml-2 text-sm tracking-wide truncate">
										Logout
									</span>
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	)
}
