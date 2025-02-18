"use client"
import Link from "next/link"
import React, { useState } from "react"

export default function Navbar() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	return (
		<div>
			<nav className="bg-white min-h-20 ml-60">
				<div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
					<div className="relative flex h-20 items-center justify-between">
						{/* Mobile menu button */}

						{/* Logo and Navigation Links */}
						<div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
							<div className="hidden sm:ml-6 sm:block">
								<div className="flex space-x-4">
									<h2 className="font-bold text-2xl">
										Super Admin Panel
									</h2>
								</div>
							</div>
						</div>

						{/* Profile and Notifications */}
						<div className="absolute gap-5 inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
							<button className="relative rounded-full text-black hover:text-gray-500 ">
								<svg
									className="size-8"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth="1.5"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
									/>
								</svg>
							</button>

							{/* User Profile Dropdown */}
							<div className="relative ml-3">
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className="relative flex rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
								>
									<span className="sr-only">Open user menu</span>
									<img
										className="size-10 rounded-full"
										src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
										alt="User Profile"
									/>
								</button>

								{/* Dropdown Menu */}
								{isDropdownOpen && (
									<div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5">
										<Link
											href="#"
											className="block px-4 py-2 text-sm text-gray-700"
										>
											Your Profile
										</Link>
										<Link
											href="#"
											className="block px-4 py-2 text-sm text-gray-700"
										>
											Settings
										</Link>
										<Link
											href="#"
											className="block px-4 py-2 text-sm text-gray-700"
										>
											Sign out
										</Link>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMobileMenuOpen && (
					<div className="sm:hidden">
						<div className="space-y-1 px-2 pt-2 pb-3">
							<Link
								href="#"
								className="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white"
							>
								Dashboard
							</Link>
							<Link
								href="#"
								className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
							>
								Team
							</Link>
							<Link
								href="#"
								className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
							>
								Projects
							</Link>
							<Link
								href="#"
								className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
							>
								Calendar
							</Link>
						</div>
					</div>
				)}
			</nav>
		</div>
	)
}
