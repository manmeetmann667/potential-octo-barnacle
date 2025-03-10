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
				<main className="my-5 flex-grow mx-5">{children}</main>
			</div>
			{/* This ensures nested pages render inside */}
		</div>
	)
}
