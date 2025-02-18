"use client"
import { Store, MoveUp, Users, ListOrdered } from "lucide-react"
import ChartComponent from "../Components/Chart"

export default function Dashboard() {
	return (
		<div>
			<div className="flex items-center gap-10 justify-evenly">
				<div className="w-[350px] h-auto max-w-sm border rounded-3xl shadow-sm bg-gray-100">
					<div className="px-5 pt-5 pb-5 flex flex-col">
						<a href="#">
							<div className="bg-green-400 mt-5 mb-5 flex justify-center items-center p-7 rounded-full w-20 h-20">
								<Store className="text-3xl text-black" />
							</div>
						</a>
						<div className="ml-2 flex flex-col">
							<span className="  text-3xl font-bold text-black">
								20
							</span>
							<div className="flex items-center justify-between">
								<h2 className="mt-2">Total Stores Added</h2>
								<div className="flex items-center text-green-600 font-semibold">
									<MoveUp />
									<span>0.43%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="w-[350px] h-auto max-w-sm border rounded-3xl shadow-sm bg-gray-100">
					<div className="px-5 pt-5 pb-5 flex flex-col">
						<a href="#">
							<div className="bg-orange-400 mt-5 mb-5 flex justify-center items-center p-7 rounded-full w-20 h-20">
								<Users className="text-3xl text-black" />
							</div>
						</a>
						<div className="ml-2 flex flex-col">
							<span className="  text-3xl font-bold text-black">
								20
							</span>
							<div className="flex items-center justify-between">
								<h2 className="mt-2">Total Users Added</h2>
								<div className="flex items-center text-green-600 font-semibold">
									<MoveUp />
									<span>0.43%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="w-[350px] h-auto max-w-sm border rounded-3xl shadow-sm bg-gray-100">
					<div className="px-5 pt-5 pb-5 flex flex-col">
						<a href="#">
							<div className="bg-purple-400 mt-5 mb-5 flex justify-center items-center p-7 rounded-full w-20 h-20">
								<ListOrdered className="text-3xl text-black" />
							</div>
						</a>
						<div className="ml-2 flex flex-col">
							<span className="  text-3xl font-bold text-black">
								20
							</span>
							<div className="flex items-center justify-between">
								<h2 className="mt-2">Total Orders</h2>
								<div className="flex items-center text-green-600 font-semibold">
									<MoveUp />
									<span>0.43%</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div
				id="column-chart"
				className="h-[200px] w-[900px] mt-10 ml-10"
			>
				{/* <ChartComponent /> */}
			</div>
		</div>
	)
}
