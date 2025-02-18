"use client"
import React from "react"

export default function Page() {
	return (
		<div>
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-5xl mb-10">Tables</h2>
				<div className="flex gap-20 items-center font-semibold">
					<div className="flex gap-1">
						<h4>Dashboard /</h4>
						<span className="text-blue-700">Order</span>
					</div>
				</div>
			</div>

			<table className="w-full border-collapse">
				<thead>
					<tr className="bg-gray-100">
						<th className="px-4 py-2">Store ID</th>
						<th className="px-4 py-2">Store Category</th>
						<th className="px-4 py-2">Shop Number</th>
						<th className="px-4 py-2">Total Orders</th>
					</tr>
				</thead>

				<tbody>
					<tr className="border-t text-center">
						<td className="px-4 py-2">osaidfj</td>
						<td className="px-4 py-2">osaidfj</td>
						<td className="px-4 py-2">osaidfj</td>
						<td className="px-4 py-2">osaidfj</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
}
