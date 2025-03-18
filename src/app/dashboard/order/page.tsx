// // "use client"
// // import React from "react"

// // export default function Page() {
// // 	return (
// // 		<div>
// // 			<div className="flex justify-between items-center">
// // 				<h2 className="font-semibold text-5xl mb-10">Tables</h2>
// // 				<div className="flex gap-20 items-center font-semibold">
// // 					<div className="flex gap-1">
// // 						<h4>Dashboard /</h4>
// // 						<span className="text-blue-700">Order</span>
// // 					</div>
// // 				</div>
// // 			</div>

// // 			<table className="w-full border-collapse">
// // 				<thead>
// // 					<tr className="bg-gray-100">
// // 						<th className="px-4 py-2">Store ID</th>
// // 						<th className="px-4 py-2">Store Category</th>
// // 						<th className="px-4 py-2">Shop Number</th>
// // 						<th className="px-4 py-2">Total Orders</th>
// // 					</tr>
// // 				</thead>
// // 				<tbody>
// // 					<tr className="border-t text-center">
// // 						<td className="px-4 py-2">osaidfj</td>
// // 						<td className="px-4 py-2">osaidfj</td>
// // 						<td className="px-4 py-2">osaidfj</td>
// // 						<td className="px-4 py-2">osaidfj</td>
// // 					</tr>
// // 				</tbody>
// // 			</table>
// // 		</div>
// // 	)
// // }

// "use client";
// import { db } from "../../lib/firebase";
// import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, orderBy } from "firebase/firestore";
// import { useState, useEffect, useCallback } from "react";
// import { CheckCircleIcon, TruckIcon, UserIcon } from "lucide-react";

// type Product = {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   productImageUrl: string;
// };

// type Order = {
//   id: string;
//   createdAt: Date;
//   status: string;
//   userId: string;
//   location: string;
//   storeId: string;
//   storeName?: string;
//   products: Product[];
//   deliveryAgentId?: string;
//   deliveryAgentName?: string;
// };

// type DeliveryAgent = {
//   agentId: string;
//   agentName: string;
//   email: string;
//   mobilenumber: string;
//   status?:string;
//   isAvailable:boolean;
// //   currentOrders: number;

// };

// const SuperAdminOrders: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
//   const [storeNames, setStoreNames] = useState<Record<string, string>>({});
//   const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
//   const [selectedAgent, setSelectedAgent] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(true);

//   // Fetch store names for caching
//   const fetchStoreNames = useCallback(async () => {
//     const storesRef = collection(db, "stores");
//     const storesSnapshot = await getDocs(storesRef);
//     const storeData: Record<string, string> = {};
    
//     storesSnapshot.docs.forEach(doc => {
//       storeData[doc.id] = doc.data().name || "Unknown Store";
//     });
    
//     setStoreNames(storeData);
//     return storeData;
//   }, []);


//   // Fetch delivery agents
//   const fetchDeliveryAgents = useCallback(async () => {
//     const agentsRef = collection(db, "agents");
//     const agentsQuery = query(agentsRef, where("isAvailable", "==", true));
    
//     const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
//       const agentsList = snapshot.docs.map(doc => ({
//         agentId: doc.id,
//         agentName: doc.data().agentName || "Unknown Agent",
//         email: doc.data().email || "",
//         mobilenumber: doc.data().mobilenumber || "",
//         isAvailable: doc.data().isAvailable || true,
//         // currentOrders: doc.data().currentOrders || 0
//       }));
      
//       setDeliveryAgents(agentsList);
//     });
    
//     return unsubscribe;
//   }, []);

//   // Fetch accepted orders
//   const fetchAcceptedOrders = useCallback(async (storeData: Record<string, string>) => {
//     const ordersRef = collection(db, "Orders");
//     const ordersQuery = query(
//       ordersRef, 
//       where("status", "==", "accepted"),
//       where("deliveryAgentId", "==", null),
//       orderBy("createdAt", "desc")
//     );
    
//     const ordersWithAgentQuery = query(
//       ordersRef,
//       where("status", "==", "accepted"),
//     //   where("deliveryAgentId", "!=", null),
//     //   orderBy("createdAt", "desc")
//     );
    
//     // Listen for orders without delivery agents
//     const unsubscribeNewOrders = onSnapshot(ordersQuery, async (snapshot) => {
//       const ordersPromises = snapshot.docs.map(async (doc) => {
//         const data = doc.data();
//         const products = await fetchProductsForOrder(doc.id);
        
//         return {
//           id: doc.id,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           status: data.status || "accepted",
//           userId: data.userId || "Unknown User",
//           location: data.location?.address || "Unknown Location",
//           storeId: data.storeId,
//           storeName: storeData[data.storeId] || "Unknown Store",
//           products: products,
//           deliveryAgentId: data.deliveryAgentId || null,
//           deliveryAgentName: data.deliveryAgentName || null
//         };
//       });

//       const newOrdersList = await Promise.all(ordersPromises);
      
//       // Listen for orders with delivery agents
//       const unsubscribeAssignedOrders = onSnapshot(ordersWithAgentQuery, async (snapshot) => {
//         const assignedOrdersPromises = snapshot.docs.map(async (doc) => {
//           const data = doc.data();
//           const products = await fetchProductsForOrder(doc.id);
          
//           return {
//             id: doc.id,
//             createdAt: data.createdAt?.toDate() || new Date(),
//             status: data.status || "accepted", 
//             userId: data.userId || "Unknown User",
//             location: data.location?.address || "Unknown Location",
//             storeId: data.storeId,
//             storeName: storeData[data.storeId] || "Unknown Store",
//             products: products,
//             deliveryAgentId: data.deliveryAgentId || null,
//             deliveryAgentName: data.deliveryAgentName || null
//           };
//         });
        
//         const assignedOrdersList = await Promise.all(assignedOrdersPromises);
        
//         // Combine and sort all orders
//         setOrders([...newOrdersList, ...assignedOrdersList].sort((a, b) => 
//           b.createdAt.getTime() - a.createdAt.getTime()
//         ));
//         setIsLoading(false);
//       });
      
//       return () => {
//         unsubscribeNewOrders();
//         unsubscribeAssignedOrders();
//       };
//     });
    
//     return unsubscribeNewOrders;
//   }, []);

//   const fetchProductsForOrder = useCallback(async (orderId: string) => {
//     const productsRef = collection(db, `Orders/${orderId}/products`);
//     const snapshot = await getDocs(productsRef);
//     return snapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         name: data.name || "Unknown",
//         price: data.price || 0,
//         quantity: data.quantity || 0,
//         productImageUrl: data.productImageUrl || ""
//       };
//     });
//   }, []);

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true);
//       const storeData = await fetchStoreNames();
//       const unsubscribeOrders = await fetchAcceptedOrders(storeData);
//       const unsubscribeAgents = await fetchDeliveryAgents();
      
//       return () => {
//         unsubscribeOrders();
//         unsubscribeAgents();
//       };
//     };
    
//     loadData();
//   }, [fetchStoreNames, fetchAcceptedOrders, fetchDeliveryAgents]);
//   const assignDeliveryAgent = useCallback(async (orderId: string) => {
// 	if (!selectedAgent) return;
	
// 	try {
// 	  const orderRef = doc(db, "Orders", orderId);
// 	  const agentRef = doc(db, "agents", selectedAgent);
	  
// 	  const agentSnap = await getDoc(agentRef);
// 	  if (!agentSnap.exists()) throw new Error("Agent not found");
	  
// 	  const agentData = agentSnap.data();
// 	  const agentName = agentData.agentName;
  
// 	  // Update Firestore
// 	  await updateDoc(orderRef, { 
// 		deliveryAgentId: selectedAgent,
// 		deliveryAgentName: agentName,
// 		status: "inDelivery"
// 	  });
  
// 	  // Update local state immediately
// 	  setOrders(prev => prev.map(order => 
// 		order.id === orderId ? {
// 		  ...order,
// 		  deliveryAgentId: selectedAgent,
// 		  deliveryAgentName: agentName,
// 		  status: "inDelivery"
// 		} : order
// 	  ));
  
// 	  setSelectedAgent("");
// 	  setAssigningOrder(null);
  
// 	} catch (error) {
// 	  console.error("Assignment failed:", error);
// 	  alert("Assignment failed. Please try again.");
// 	}
//   }, [selectedAgent]);
// //   const assignDeliveryAgent = useCallback(async (orderId: string) => {
// //     if (!selectedAgent) return;
    
// //     try {
// //       const orderRef = doc(db, "Orders", orderId);
// //       const agentRef = doc(db, "agents", selectedAgent);
      
// //       // Get agent data
// //       const agentSnap = await getDoc(agentRef);
// //       if (!agentSnap.exists()) throw new Error("Delivery agent not found");
      
// //       const agentData = agentSnap.data();
// //       const agentName = agentData.name || "Unknown Agent";
// //     //   const currentOrders = agentData.currentOrders || 0;
      
// //       // Update order with agent info
// //       await updateDoc(orderRef, { 
// //         deliveryAgentId: selectedAgent,
// //         deliveryAgentName: agentName,
// //         status: "inDelivery"
// //       });
      
// //       // Update agent's current orders count
// //     //   await updateDoc(agentRef, {
// //     //     currentOrders: currentOrders + 1
// //     //   });
      
// //       // Reset selection
// //       setSelectedAgent("");
// //       setAssigningOrder(null);
      
// //     } catch (error) {
// //       console.error("Error assigning delivery agent:", error);
// //       alert("Failed to assign delivery agent. Please try again.");
// //     }
// //   }, [selectedAgent]);

//   const startAssigning = (orderId: string) => {
//     setAssigningOrder(orderId);
//     setSelectedAgent("");
//   };

//   const cancelAssigning = () => {
//     setAssigningOrder(null);
//     setSelectedAgent("");
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h2 className="text-4xl font-bold mb-6 text-gray-800">🚚 Assign Delivery Agents</h2>
      
//       {isLoading ? (
//         <div className="text-center py-10">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading orders...</p>
//         </div>
//       ) : orders.length === 0 ? (
//         <div className="bg-white rounded-xl shadow-lg p-8 text-center">
//           <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//           <p className="text-xl text-gray-600">No orders requiring delivery assignment at this time.</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {orders.map((order) => (
//             <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
//               <div className="flex items-center justify-between mb-4">
//                 <div>
//                   <div className="flex items-center mb-2">
//                     <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
//                       Accepted
//                     </span>
//                     {order.deliveryAgentId && (
//                       <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//                         <TruckIcon className="w-3 h-3 mr-1" />
//                         In Delivery
//                       </span>
//                     )}
//                   </div>
                  
//                   <h3 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h3>
                  
//                   <div className="mt-3 space-y-2 text-gray-700">
//                     <p className="flex items-center">
//                       <span className="font-medium mr-2">Store:</span> 
//                       {order.storeName}
//                     </p>
//                     <p className="flex items-center">
//                       <span className="font-medium mr-2">Date:</span>
//                       {order.createdAt.toLocaleString()}
//                     </p>
//                     <p className="flex items-center">
//                       <span className="font-medium mr-2">Location:</span>
//                       {order.location}
//                     </p>
//                     {order.deliveryAgentId && (
//                       <p className="flex items-center text-blue-600">
//                         <UserIcon className="w-4 h-4 mr-1" />
//                         <span className="font-medium mr-2">Assigned to:</span>
//                         {order.deliveryAgentName}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
              
//               <div className="border rounded-lg overflow-hidden mt-4">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="p-3 text-left">Product</th>
//                       <th className="p-3 text-center">Price</th>
//                       <th className="p-3 text-center">Quantity</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {order.products.map((product) => (
//                       <tr key={product.id} className="border-t">
//                         <td className="p-3 flex items-center gap-3">
//                           <img 
//                             src={product.productImageUrl} 
//                             alt={product.name} 
//                             className="w-12 h-12 rounded-md object-cover"
//                           />
//                           <span className="text-gray-800">{product.name}</span>
//                         </td>
//                         <td className="p-3 text-gray-700 font-semibold text-center">₹{product.price}</td>
//                         <td className="p-3 text-gray-700 text-center">{product.quantity}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {!order.deliveryAgentId && (
//                 assigningOrder === order.id ? (
//                   <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
//                     <h4 className="font-medium mb-3">Assign Delivery Agent</h4>
//                     <div className="flex flex-wrap gap-3">
//                       <select 
//                         value={selectedAgent}
//                         onChange={(e) => setSelectedAgent(e.target.value)}
//                         className="flex-grow p-2 border rounded-md"
//                       >
//                         <option value="">Select delivery agent</option>
//                         {deliveryAgents.map(agent => (
//                           <option key={agent.agentId} value={agent.agentId}>
//                             {agent.agentName} 
// 							{/* ({agent.currentOrders} active orders) */}
//                           </option>
//                         ))}
//                       </select>
//                       <button
//                         onClick={() => assignDeliveryAgent(order.id)}
//                         disabled={!selectedAgent}
//                         className={`px-4 py-2 rounded-md ${
//                           selectedAgent 
//                             ? "bg-blue-600 hover:bg-blue-700 text-white" 
//                             : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                         }`}
//                       >
//                         Assign
//                       </button>
//                       <button
//                         onClick={cancelAssigning}
//                         className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="mt-6">
//                     <button
//                       onClick={() => startAssigning(order.id)}
//                       className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all shadow-md"
//                     >
//                       <TruckIcon className="w-5 h-5" />
//                       Assign Delivery Agent
//                     </button>
//                   </div>
//                 )
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SuperAdminOrders;




"use client";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, orderBy } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { CheckCircleIcon, TruckIcon, UserIcon } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productImageUrl: string;
};

type Order = {
  id: string;
  createdAt: Date;
  status: string;
  userId: string;
  location: string;
  storeId: string;
  storeName?: string;
  products: Product[];
  deliveryAgentId?: string;
  deliveryAgentName?: string;
};

type DeliveryAgent = {
  agentId: string;
  agentName: string;
  email: string;
  mobilenumber: string;
  status?: string;
  isAvailable: boolean;
};

const SuperAdminOrders: React.FC = () => {
  const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [storeNames, setStoreNames] = useState<Record<string, string>>({});
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"unassigned" | "assigned">("unassigned");

  // Fetch store names for caching
  const fetchStoreNames = useCallback(async () => {
    const storesRef = collection(db, "stores");
    const storesSnapshot = await getDocs(storesRef);
    const storeData: Record<string, string> = {};
    
    storesSnapshot.docs.forEach(doc => {
      storeData[doc.id] = doc.data().name || "Unknown Store";
    });
    
    setStoreNames(storeData);
    return storeData;
  }, []);

  // Fetch delivery agents
  const fetchDeliveryAgents = useCallback(async () => {
    const agentsRef = collection(db, "agents");
    const agentsQuery = query(agentsRef, where("isAvailable", "==", true));
    
    const unsubscribe = onSnapshot(agentsQuery, (snapshot) => {
      const agentsList = snapshot.docs.map(doc => ({
        agentId: doc.id,
        agentName: doc.data().agentName || "Unknown Agent",
        email: doc.data().email || "",
        mobilenumber: doc.data().mobilenumber || "",
        isAvailable: doc.data().isAvailable || true,
      }));
      
      setDeliveryAgents(agentsList);
    });
    
    return unsubscribe;
  }, []);

  const fetchProductsForOrder = useCallback(async (orderId: string) => {
    const productsRef = collection(db, `Orders/${orderId}/products`);
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "Unknown",
        price: data.price || 0,
        quantity: data.quantity || 0,
        productImageUrl: data.productImageUrl || ""
      };
    });
  }, []);

  // Fetch all orders and separate them by assignment status
  const fetchOrders = useCallback(async (storeData: Record<string, string>) => {
    const ordersRef = collection(db, "Orders");
    
    // Query for unassigned orders
    const unassignedQuery = query(
      ordersRef, 
      where("status", "==", "accepted"),
      where("deliveryAgentId", "==", null),
      orderBy("createdAt", "desc")
    );
    
    // Query for assigned orders
    const assignedQuery = query(
      ordersRef,
      where("status", "==", "assigned"),
      orderBy("createdAt", "desc")
    );
    
    // Listen for unassigned orders
    const unsubscribeUnassigned = onSnapshot(unassignedQuery, async (snapshot) => {
      const ordersPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const products = await fetchProductsForOrder(doc.id);
        
        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || "accepted",
          userId: data.userId || "Unknown User",
          location: data.location?.address || "Unknown Location",
          storeId: data.storeId,
          storeName: storeData[data.storeId] || "Unknown Store",
          products: products,
          deliveryAgentId: data.deliveryAgentId || null,
          deliveryAgentName: data.deliveryAgentName || null
        };
      });

      const unassignedOrdersList = await Promise.all(ordersPromises);
      setUnassignedOrders(unassignedOrdersList.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ));
      setIsLoading(false);
    });
    
    // Listen for assigned orders
    const unsubscribeAssigned = onSnapshot(assignedQuery, async (snapshot) => {
      const ordersPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const products = await fetchProductsForOrder(doc.id);
        
        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || "assigned",
          userId: data.userId || "Unknown User",
          location: data.location?.address || "Unknown Location",
          storeId: data.storeId,
          storeName: storeData[data.storeId] || "Unknown Store",
          products: products,
          deliveryAgentId: data.deliveryAgentId || null,
          deliveryAgentName: data.deliveryAgentName || null
        };
      });

      const assignedOrdersList = await Promise.all(ordersPromises);
      setAssignedOrders(assignedOrdersList.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ));
    });
    
    return () => {
      unsubscribeUnassigned();
      unsubscribeAssigned();
    };
  }, [fetchProductsForOrder]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const storeData = await fetchStoreNames();
      const unsubscribeOrders = await fetchOrders(storeData);
      const unsubscribeAgents = await fetchDeliveryAgents();
      
      return () => {
        unsubscribeOrders();
        unsubscribeAgents();
      };
    };
    
    loadData();
  }, [fetchStoreNames, fetchOrders, fetchDeliveryAgents]);

  const assignDeliveryAgent = useCallback(async (orderId: string) => {
    if (!selectedAgent) return;
    
    try {
      const orderRef = doc(db, "Orders", orderId);
      const agentRef = doc(db, "agents", selectedAgent);
      
      const agentSnap = await getDoc(agentRef);
      if (!agentSnap.exists()) throw new Error("Agent not found");
      
      const agentData = agentSnap.data();
      const agentName = agentData.agentName;
  
      // Update Firestore
      await updateDoc(orderRef, { 
        deliveryAgentId: selectedAgent,
        deliveryAgentName: agentName,
        status: "assigned"
      });
  
      // Remove from unassigned orders locally
      setUnassignedOrders(prev => prev.filter(order => order.id !== orderId));
      
      // Add to assigned orders locally
      const updatedOrder = unassignedOrders.find(order => order.id === orderId);
      if (updatedOrder) {
        const newAssignedOrder = {
          ...updatedOrder,
          deliveryAgentId: selectedAgent,
          deliveryAgentName: agentName,
          status: "assigned"
        };
        setAssignedOrders(prev => [newAssignedOrder, ...prev]);
      }
  
      setSelectedAgent("");
      setAssigningOrder(null);
  
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Assignment failed. Please try again.");
    }
  }, [selectedAgent, unassignedOrders]);

  const startAssigning = (orderId: string) => {
    setAssigningOrder(orderId);
    setSelectedAgent("");
  };

  const cancelAssigning = () => {
    setAssigningOrder(null);
    setSelectedAgent("");
  };

  const renderOrderCard = (order: Order, isAssignable: boolean) => (
    <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center mb-2">
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 ${
              order.deliveryAgentId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {order.deliveryAgentId ? 'In Delivery' : 'Accepted'}
            </span>
          </div>
          
          <h3 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h3>
          
          <div className="mt-3 space-y-2 text-gray-700">
            <p className="flex items-center">
              <span className="font-medium mr-2">Store:</span> 
              {order.storeName}
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">Date:</span>
              {order.createdAt.toLocaleString()}
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">Location:</span>
              {order.location}
            </p>
            {order.deliveryAgentId && (
              <p className="flex items-center text-blue-600">
                <UserIcon className="w-4 h-4 mr-1" />
                <span className="font-medium mr-2">Assigned to:</span>
                {order.deliveryAgentName}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden mt-4">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-center">Price</th>
              <th className="p-3 text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {order.products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-3 flex items-center gap-3">
                  <img 
                    src={product.productImageUrl} 
                    alt={product.name} 
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <span className="text-gray-800">{product.name}</span>
                </td>
                <td className="p-3 text-gray-700 font-semibold text-center">₹{product.price}</td>
                <td className="p-3 text-gray-700 text-center">{product.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAssignable && (
        assigningOrder === order.id ? (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium mb-3">Assign Delivery Agent</h4>
            <div className="flex flex-wrap gap-3">
              <select 
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="flex-grow p-2 border rounded-md"
              >
                <option value="">Select delivery agent</option>
                {deliveryAgents.map(agent => (
                  <option key={agent.agentId} value={agent.agentId}>
                    {agent.agentName}
                  </option>
                ))}
              </select>
              <button
                onClick={() => assignDeliveryAgent(order.id)}
                disabled={!selectedAgent}
                className={`px-4 py-2 rounded-md ${
                  selectedAgent 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Assign
              </button>
              <button
                onClick={cancelAssigning}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <button
              onClick={() => startAssigning(order.id)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all shadow-md"
            >
              <TruckIcon className="w-5 h-5" />
              Assign Delivery Agent
            </button>
          </div>
        )
      )}
    </div>
  );

  const renderNoOrdersMessage = (type: "unassigned" | "assigned") => (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <TruckIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <p className="text-xl text-gray-600">
        {type === "unassigned" 
          ? "No orders pending delivery assignment at this time." 
          : "No orders currently in delivery."}
      </p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-6 text-gray-800">🚚 Delivery Management</h2>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab("unassigned")}
          className={`py-2 px-4 font-medium text-lg ${
            activeTab === "unassigned" 
              ? "border-b-2 border-blue-600 text-blue-600" 
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Unassigned Orders
          </button>
        <button 
          onClick={() => setActiveTab("assigned")}
          className={`py-2 px-4 font-medium text-lg ${
            activeTab === "assigned" 
              ? "border-b-2 border-blue-600 text-blue-600" 
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          Assigned Orders
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "unassigned" ? (
            <div className="grid gap-6">
              {unassignedOrders.length > 0 ? (
                unassignedOrders.map((order) => renderOrderCard(order, true))
              ) : (
                renderNoOrdersMessage("unassigned")
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {assignedOrders.length > 0 ? (
                assignedOrders.map((order) => renderOrderCard(order, false))
              ) : (
                renderNoOrdersMessage("assigned")
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrders;