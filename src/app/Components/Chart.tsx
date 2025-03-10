import React, { useEffect, useRef } from "react"
import { Chart, ChartConfiguration, registerables } from "chart.js"

Chart.register(...registerables) // ✅ Register necessary modules

export default function CardLineChart() {
	const chartRef = useRef<HTMLCanvasElement | null>(null)
	const chartInstance = useRef<Chart | null>(null)

	useEffect(() => {
		// Destroy existing chart instance before creating a new one
		if (chartInstance.current) {
			chartInstance.current.destroy()
		}

		if (!chartRef.current) return
		const ctx = chartRef.current.getContext("2d")
		if (!ctx) return

		const config: ChartConfiguration = {
			type: "line",
			data: {
				labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
				datasets: [
					{
						label: new Date().getFullYear().toString(),
						backgroundColor: "#3182ce",
						borderColor: "#3182ce",
						data: [65, 78, 66, 44, 56, 67, 75],
						fill: false,
					},
					{
						label: (new Date().getFullYear() - 1).toString(),
						backgroundColor: "#edf2f7",
						borderColor: "#edf2f7",
						data: [40, 68, 86, 74, 56, 60, 87],
						fill: false,
					},
				],
			},
			options: {
				maintainAspectRatio: false,
				responsive: true,
				plugins: {
					legend: {
						labels: { color: "white" },
						align: "end",
						position: "bottom",
					},
				},
				scales: {
					x: {
						ticks: { color: "rgba(255,255,255,.7)" },
						grid: {
							color: "rgba(33, 37, 41, 0.3)",
						},
					},
					y: {
						ticks: { color: "rgba(255,255,255,.7)" },
						grid: {
							color: "rgba(255, 255, 255, 0.15)",
						},
					},
				},
			},
		}

		chartInstance.current = new Chart(ctx, config)

		// Cleanup function to destroy chart when component unmounts
		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy()
				chartInstance.current = null
			}
		}
	}, [])

	return (
		<div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-blueGray-700">
			<div className="rounded-t mb-0 px-4 py-3 bg-transparent">
				<div className="flex flex-wrap items-center">
					<div className="relative w-full max-w-full flex-grow flex-1">
						<h6 className="uppercase text-blueGray-100 mb-1 text-xs font-semibold">
							Overview
						</h6>
						<h2 className="text-dark text-xl font-semibold">
							Sales Value
						</h2>
					</div>
				</div>
			</div>
			<div className="p-4 flex-auto">
				{/* Chart */}
				<div className="relative h-350-px">
					<canvas ref={chartRef}></canvas>
				</div>
			</div>
		</div>
	)
}
