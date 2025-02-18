// src/middleware.ts
import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
	// Check if the user is authenticated by looking for a cookie
	const user = request.cookies.get("user") // Use cookie instead of localStorage

	// If the user is not authenticated, redirect to the login page
	if (!user) {
		return NextResponse.redirect(new URL("/", request.url)) // Redirect to login page
	}

	// If the user is authenticated, allow access to the page
	return NextResponse.next()
}

// Apply middleware to specific routes (in this case, the dashboard)
export const config = {
	matcher: [
		"/dashboard",
		"/dashboard/agent",
		"/dashboard/order",
		"/dashboard/store",
	], // Protect all routes under /dashboard
}
