import Navbar from "./Navbar"
import SideBar from "./SideBar"

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div>
			<Navbar />
			<div className="flex">
				<SideBar />
				<main className="ml-72 flex-grow mt-10 mb-10 mr-10">
					{children}
				</main>
			</div>
			{/* This ensures nested pages render inside */}
		</div>
	)
}
