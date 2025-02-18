import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ToastContainer } from "react-toastify"

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body>
				<ToastContainer position="top-right" autoClose={3000} />
				{children}
			</body>
		</html>
	)
}
