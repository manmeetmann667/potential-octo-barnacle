

// "use client";
// import { db } from "../../lib/firebase";
// import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs } from "firebase/firestore";
// import { useState, useEffect, useCallback } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

// type Product = {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
//   productImageUrl: string;
//   stock: number;
// };

// type Order = {
//   id: string;
//   createdAt: Date;
//   status: string;
//   userId: string;
//   location: string;
//   storeId: string;
//   products: Product[];
// };

// const Orders: React.FC = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [storeId, setStoreId] = useState<string | null>(null);
//   const [locationCache, setLocationCache] = useState<Record<string, string>>({});
//   const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
//   // Add a state to force refresh the UI
//   const [refreshTrigger, setRefreshTrigger] = useState(0);

//   const getCachedLocation = useCallback(async (lat: number, lon: number) => {
//     const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
//     if (locationCache[key]) return locationCache[key];
    
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
//       );
//       const data = await response.json();
//       const address = data.display_name || "Unknown Location";
//       setLocationCache(prev => ({ ...prev, [key]: address }));
//       return address;
//     } catch (error) {
//       console.error("Error fetching location:", error);
//       return "Unknown Location";
//     }
//   }, [locationCache]);

//   const fetchStoreId = useCallback(async (userEmail: string) => {
//     const q = query(collection(db, "stores"), where("email", "==", userEmail));
//     const querySnapshot = await getDocs(q);
//     return querySnapshot.docs[0]?.id || null;
//   }, []);

//   const fetchProductsForOrder = useCallback(async (orderId: string) => {
//     const productsRef = collection(db, `Orders/${orderId}/products`);
//     const snapshot = await getDocs(productsRef);
//     return Promise.all(
//       snapshot.docs.map(async (doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           name: data.name || "Unknown",
//           price: data.price || 0,
//           quantity: data.quantity || 0,
//           productImageUrl: data.productImageUrl || "",
//           stock: 0 // Will be populated later
//         };
//       })
//     );
//   }, []);

//   const fetchProductStock = useCallback(async (productId: string) => {
//     if (!storeId) return 0;
    
//     const categoriesRef = collection(db, `stores/${storeId}/categories`);
//     const categoriesSnapshot = await getDocs(categoriesRef);

//     for (const categoryDoc of categoriesSnapshot.docs) {
//       const productRef = doc(db, `stores/${storeId}/categories/${categoryDoc.id}/products/${productId}`);
//       const snapshot = await getDoc(productRef);
//       if (snapshot.exists()) return snapshot.data().stock || 0;
//     }
//     return 0;
//   }, [storeId]);

//   useEffect(() => {
//     const auth = getAuth();
//     return onAuthStateChanged(auth, async (user) => {
//       if (user?.email) {
//         const id = await fetchStoreId(user.email);
//         setStoreId(id);
//       }
//     });
//   }, [fetchStoreId]);

//   // Add refreshTrigger to the dependency array
//   useEffect(() => {
//     if (!storeId) return;

//     const ordersQuery = query(collection(db, "Orders"), where("storeId", "==", storeId));
//     const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
//       const ordersPromises = snapshot.docs.map(async (doc) => {
//         const data = doc.data();
//         const products = await fetchProductsForOrder(doc.id);
        
//         const stockPromises = products.map(async (product) => ({
//           ...product,
//           stock: await fetchProductStock(product.id)
//         }));

//         const location = data.location
//           ? await getCachedLocation(data.location.latitude, data.location.longitude)
//           : "Unknown Location";

//         return {
//           id: doc.id,
//           createdAt: data.createdAt?.toDate() || new Date(),
//           status: data.status || "pending",
//           userId: data.userId || "Unknown User",
//           location,
//           storeId: data.storeId,
//           products: await Promise.all(stockPromises)
//         };
//       });

//       const ordersList = await Promise.all(ordersPromises);
//       setOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
//     });

//     return () => unsubscribe();
//   }, [storeId, fetchProductsForOrder, fetchProductStock, getCachedLocation, refreshTrigger]);

//   const updateOrderStatus = useCallback(async (orderId: string, status: "accepted" | "rejected") => {
//     const orderRef = doc(db, "Orders", orderId);
//     await updateDoc(orderRef, { status });
//   }, []);

//   // Find product document reference across all categories
//   const findProductDocRef = useCallback(async (productId: string) => {
//     if (!storeId) return null;
    
//     const categoriesRef = collection(db, `stores/${storeId}/categories`);
//     const categoriesSnapshot = await getDocs(categoriesRef);

//     for (const categoryDoc of categoriesSnapshot.docs) {
//       const productRef = doc(db, `stores/${storeId}/categories/${categoryDoc.id}/products/${productId}`);
//       const snapshot = await getDoc(productRef);
//       if (snapshot.exists()) {
//         return { 
//           ref: productRef, 
//           data: snapshot.data(),
//           categoryId: categoryDoc.id 
//         };
//       }
//     }
//     return null;
//   }, [storeId]);

//   // Update local order data without waiting for Firestore to trigger the listener
//   const updateLocalOrderStock = useCallback((orderId: string, productId: string, newStock: number) => {
//     setOrders(currentOrders => 
//       currentOrders.map(order => {
//         if (order.id === orderId) {
//           return {
//             ...order,
//             products: order.products.map(product => {
//               if (product.id === productId) {
//                 return { ...product, stock: newStock };
//               }
//               return product;
//             })
//           };
//         }
//         return order;
//       })
//     );
//   }, []);

//   // Update local stock for all orders that contain the product
//   const updateStockForAllOrders = useCallback((productId: string, newStock: number) => {
//     setOrders(currentOrders => 
//       currentOrders.map(order => {
//         return {
//           ...order,
//           products: order.products.map(product => {
//             if (product.id === productId) {
//               return { ...product, stock: newStock };
//             }
//             return product;
//           })
//         };
//       })
//     );
//   }, []);

//   const acceptOrder = useCallback(async (order: Order) => {
//     if (!storeId) return;
    
//     // Prevent multiple processing of the same order
//     if (processingOrders.has(order.id)) return;
    
//     try {
//       setProcessingOrders(prev => new Set(prev).add(order.id));
      
//       // First update order status
//       await updateOrderStatus(order.id, "accepted");
      
//       // Then process each product one by one
//       for (const product of order.products) {
//         // Get the latest stock value directly from Firestore
//         const productInfo = await findProductDocRef(product.id);
        
//         if (productInfo) {
//           const { ref, data, categoryId } = productInfo;
//           console.log(`Product ${product.id} in category ${categoryId}:`);
//           console.log(`- Current stock: ${data.stock || 0}`);
//           console.log(`- Order quantity: ${product.quantity}`);
          
//           // Make sure we're working with numbers
//           const currentStock = Number(data.stock) || 0;
//           const orderQuantity = Number(product.quantity);
          
//           // Calculate new stock and prevent negative stock
//           const newStock = Math.max(currentStock - orderQuantity, 0);
          
//           console.log(`- New stock after reduction: ${newStock}`);
          
//           // Update the stock in Firestore
//           await updateDoc(ref, { stock: newStock });
          
//           // Update local state to reflect the new stock immediately
//           updateStockForAllOrders(product.id, newStock);
//         } else {
//           console.error(`Product ${product.id} not found in any category`);
//         }
//       }
      
//       // Force a UI refresh after all updates are done
//       setRefreshTrigger(prev => prev + 1);
      
//     } catch (error) {
//       console.error("Error accepting order:", error);
//     } finally {
//       // Remove from processing set when done
//       setProcessingOrders(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(order.id);
//         return newSet;
//       });
//     }
//   }, [storeId, updateOrderStatus, findProductDocRef, processingOrders, updateStockForAllOrders]);

//   const rejectOrder = useCallback(async (order: Order) => {
//     if (processingOrders.has(order.id)) return;
    
//     try {
//       setProcessingOrders(prev => new Set(prev).add(order.id));
//       await updateOrderStatus(order.id, "rejected");
//     } catch (error) {
//       console.error("Error rejecting order:", error);
//     } finally {
//       setProcessingOrders(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(order.id);
//         return newSet;
//       });
//     }
//   }, [updateOrderStatus, processingOrders]);

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <h2 className="text-4xl font-bold mb-6 text-gray-800">📦 Manage Orders</h2>

//       {orders.length === 0 ? (
//         <p className="text-center text-gray-500 text-lg">No orders found.</p>
//       ) : (
//         <div className="space-y-6">
//           {orders.map((order) => (
//             <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
//               <div className="flex items-center justify-between mb-4">
//                 <div>
//                   <h3 className="text-xl font-semibold mb-6">Order ID: {order.id}</h3>
//                   <p className="text-lg text-gray-800">
//                     📅 {order.createdAt.toLocaleString()}
//                   </p>
//                   <p className="text-lg text-gray-800 mt-5 mb-5">
//                     📍 {order.location}
//                   </p>
//                   <p className="text-m text-gray-800"> UserId: {order.userId}</p>
//                 </div>
//                 <span
//                   className={`px-3 py-2 rounded-full text-white text-sm font-medium flex items-center gap-1 ${
//                     order.status === "pending" ? "bg-yellow-500" :
//                     order.status === "accepted" ? "bg-green-500" : "bg-red-500"
//                   }`}
//                 >
//                   {order.status === "pending" && <ClockIcon className="w-4 h-4" />}
//                   {order.status === "accepted" && <CheckCircleIcon className="w-4 h-4" />}
//                   {order.status === "rejected" && <XCircleIcon className="w-4 h-4" />}
//                   {order.status.toUpperCase()}
//                 </span>
//               </div>

//               <div className="border rounded-lg overflow-hidden mt-4">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-gray-100 text-gray-700">
//                     <tr>
//                       <th className="p-3 text-left">Product</th>
//                       <th className="p-3 text-left">Price</th>
//                       <th className="p-3 text-left">Quantity</th>
//                       <th className="p-3 text-left">Stock</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {order.products.map((product) => (
//                       <tr key={product.id} className="border-t">
//                         <td className="p-3 flex items-center gap-3">
//                           <img src={product.productImageUrl} alt={product.name} 
//                                className="w-12 h-12 rounded-md object-cover" />
//                           <span className="text-gray-800">{product.name}</span>
//                         </td>
//                         <td className="p-3 text-gray-700 font-semibold">₹{product.price}</td>
//                         <td className="p-3 text-gray-700">{product.quantity}</td>
//                         <td className="p-3 text-gray-500">{product.stock}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               {order.status === "pending" && (
//                 <div className="mt-6 flex gap-4">
//                   <button
//                     onClick={() => acceptOrder(order)}
//                     disabled={processingOrders.has(order.id)}
//                     className={`flex items-center gap-2 ${
//                       processingOrders.has(order.id) 
//                         ? "bg-gray-400 cursor-not-allowed" 
//                         : "bg-green-600 hover:bg-green-700"
//                     } text-white px-5 py-2 rounded-lg transition-all shadow-md`}
//                   >
//                     {processingOrders.has(order.id) ? "Processing..." : "✅ Accept Order"}
//                   </button>
//                   <button
//                     onClick={() => rejectOrder(order)}
//                     disabled={processingOrders.has(order.id)}
//                     className={`flex items-center gap-2 ${
//                       processingOrders.has(order.id) 
//                         ? "bg-gray-400 cursor-not-allowed" 
//                         : "bg-red-600 hover:bg-red-700"
//                     } text-white px-5 py-2 rounded-lg transition-all shadow-md`}
//                   >
//                     {processingOrders.has(order.id) ? "Processing..." : "❌ Reject Order"}
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Orders;


"use client";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CheckCircleIcon, ClockIcon, XCircleIcon, QrCodeIcon } from "lucide-react";
// import  from "qrcode.react";
// import QRCode from "react-qr-code";
import {QRCodeSVG} from 'qrcode.react';
type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productImageUrl: string;
  stock: number;
};

type Order = {
  id: string;
  createdAt: Date;
  status: string;
  userId: string;
  location: string;
  storeId: string;
  products: Product[];
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [locationCache, setLocationCache] = useState<Record<string, string>>({});
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const [showQRCode, setShowQRCode] = useState<Record<string, boolean>>({});
  // Add a state to force refresh the UI
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const getCachedLocation = useCallback(async (lat: number, lon: number) => {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (locationCache[key]) return locationCache[key];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await response.json();
      const address = data.display_name || "Unknown Location";
      setLocationCache(prev => ({ ...prev, [key]: address }));
      return address;
    } catch (error) {
      console.error("Error fetching location:", error);
      return "Unknown Location";
    }
  }, [locationCache]);

  const fetchStoreId = useCallback(async (userEmail: string) => {
    const q = query(collection(db, "stores"), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.id || null;
  }, []);

  const fetchProductsForOrder = useCallback(async (orderId: string) => {
    const productsRef = collection(db, `Orders/${orderId}/products`);
    const snapshot = await getDocs(productsRef);
    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          price: data.price || 0,
          quantity: data.quantity || 0,
          productImageUrl: data.productImageUrl || "",
          stock: 0 // Will be populated later
        };
      })
    );
  }, []);

  const fetchProductStock = useCallback(async (productId: string) => {
    if (!storeId) return 0;
    
    const categoriesRef = collection(db, `stores/${storeId}/categories`);
    const categoriesSnapshot = await getDocs(categoriesRef);

    for (const categoryDoc of categoriesSnapshot.docs) {
      const productRef = doc(db, `stores/${storeId}/categories/${categoryDoc.id}/products/${productId}`);
      const snapshot = await getDoc(productRef);
      if (snapshot.exists()) return snapshot.data().stock || 0;
    }
    return 0;
  }, [storeId]);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        const id = await fetchStoreId(user.email);
        setStoreId(id);
      }
    });
  }, [fetchStoreId]);

  // Add refreshTrigger to the dependency array
  useEffect(() => {
    if (!storeId) return;

    const ordersQuery = query(collection(db, "Orders"), where("storeId", "==", storeId));
    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const products = await fetchProductsForOrder(doc.id);
        
        const stockPromises = products.map(async (product) => ({
          ...product,
          stock: await fetchProductStock(product.id)
        }));

        const location = data.location
          ? await getCachedLocation(data.location.latitude, data.location.longitude)
          : "Unknown Location";

        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || "pending",
          userId: data.userId || "Unknown User",
          location,
          storeId: data.storeId,
          products: await Promise.all(stockPromises)
        };
      });

      const ordersList = await Promise.all(ordersPromises);
      setOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    });

    return () => unsubscribe();
  }, [storeId, fetchProductsForOrder, fetchProductStock, getCachedLocation, refreshTrigger]);

  const updateOrderStatus = useCallback(async (orderId: string, status: "accepted" | "rejected") => {
    const orderRef = doc(db, "Orders", orderId);
    await updateDoc(orderRef, { status });
  }, []);

  // Find product document reference across all categories
  const findProductDocRef = useCallback(async (productId: string) => {
    if (!storeId) return null;
    
    const categoriesRef = collection(db, `stores/${storeId}/categories`);
    const categoriesSnapshot = await getDocs(categoriesRef);

    for (const categoryDoc of categoriesSnapshot.docs) {
      const productRef = doc(db, `stores/${storeId}/categories/${categoryDoc.id}/products/${productId}`);
      const snapshot = await getDoc(productRef);
      if (snapshot.exists()) {
        return { 
          ref: productRef, 
          data: snapshot.data(),
          categoryId: categoryDoc.id 
        };
      }
    }
    return null;
  }, [storeId]);

  // Update local order data without waiting for Firestore to trigger the listener
  const updateLocalOrderStock = useCallback((orderId: string, productId: string, newStock: number) => {
    setOrders(currentOrders => 
      currentOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            products: order.products.map(product => {
              if (product.id === productId) {
                return { ...product, stock: newStock };
              }
              return product;
            })
          };
        }
        return order;
      })
    );
  }, []);

  // Update local stock for all orders that contain the product
  const updateStockForAllOrders = useCallback((productId: string, newStock: number) => {
    setOrders(currentOrders => 
      currentOrders.map(order => {
        return {
          ...order,
          products: order.products.map(product => {
            if (product.id === productId) {
              return { ...product, stock: newStock };
            }
            return product;
          })
        };
      })
    );
  }, []);

  const acceptOrder = useCallback(async (order: Order) => {
    if (!storeId) return;
    
    // Prevent multiple processing of the same order
    if (processingOrders.has(order.id)) return;
    
    try {
      setProcessingOrders(prev => new Set(prev).add(order.id));
      
      // First update order status
      await updateOrderStatus(order.id, "accepted");
      
      // Then process each product one by one
      for (const product of order.products) {
        // Get the latest stock value directly from Firestore
        const productInfo = await findProductDocRef(product.id);
        
        if (productInfo) {
          const { ref, data, categoryId } = productInfo;
          console.log(`Product ${product.id} in category ${categoryId}:`);
          console.log(`- Current stock: ${data.stock || 0}`);
          console.log(`- Order quantity: ${product.quantity}`);
          
          // Make sure we're working with numbers
          const currentStock = Number(data.stock) || 0;
          const orderQuantity = Number(product.quantity);
          
          // Calculate new stock and prevent negative stock
          const newStock = Math.max(currentStock - orderQuantity, 0);
          
          console.log(`- New stock after reduction: ${newStock}`);
          
          // Update the stock in Firestore
          await updateDoc(ref, { stock: newStock });
          
          // Update local state to reflect the new stock immediately
          updateStockForAllOrders(product.id, newStock);
        } else {
          console.error(`Product ${product.id} not found in any category`);
        }
      }
      
      // Force a UI refresh after all updates are done
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error accepting order:", error);
    } finally {
      // Remove from processing set when done
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  }, [storeId, updateOrderStatus, findProductDocRef, processingOrders, updateStockForAllOrders]);

  const rejectOrder = useCallback(async (order: Order) => {
    if (processingOrders.has(order.id)) return;
    
    try {
      setProcessingOrders(prev => new Set(prev).add(order.id));
      await updateOrderStatus(order.id, "rejected");
    } catch (error) {
      console.error("Error rejecting order:", error);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(order.id);
        return newSet;
      });
    }
  }, [updateOrderStatus, processingOrders]);

  // Toggle QR code display for an order
  const toggleQRCode = useCallback((orderId: string) => {
    setShowQRCode(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  }, []);

  // // Generate order data for QR code
  // const generateOrderQRData = useCallback((order: Order) => {
  //   const orderData = {
  //     id: order.id,
  //     date: order.createdAt.toLocaleString(),
  //     location: order.location,
  //     // status: order.status,
  //     products: order.products.map(product => ({
  //       name: product.name,
  //       price: product.price,
  //       quantity: product.quantity
  //     }))
  //   };
  //   return JSON.stringify(orderData);
  // }, []);
  // Generate order data for QR code (modified to only include order ID)
const generateOrderQRData = useCallback((order: Order) => {
  // Return just the order ID as a string
  return order.id;
}, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-6 text-gray-800">📦 Manage Orders</h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-6">Order ID: {order.id}</h3>
                  <p className="text-lg text-gray-800">
                    📅 {order.createdAt.toLocaleString()}
                  </p>
                  <p className="text-lg text-gray-800 mt-5 mb-5">
                    📍 {order.location}
                  </p>
                  <p className="text-m text-gray-800"> UserId: {order.userId}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`px-3 py-2 rounded-full text-white text-sm font-medium flex items-center gap-1 ${
                      order.status === "pending" ? "bg-yellow-500" :
                      
                      order.status === "accepted" ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {order.status === "pending" && <ClockIcon className="w-4 h-4" />}
                    {order.status === "accepted" && <CheckCircleIcon className="w-4 h-4" />}
                    {order.status === "rejected" && <XCircleIcon className="w-4 h-4" />}
                    {order.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => toggleQRCode(order.id)}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    {showQRCode[order.id] ? "Hide QR Code" : "Show QR Code"}
                  </button>
                </div>
              </div>
              
              {showQRCode[order.id] && (
                <div className="flex justify-center my-6 p-4 bg-white border rounded-lg">
                  <div className="text-center">
                    <QRCodeSVG
                      value={generateOrderQRData(order)}
                      size={200}
                      level="H"
                      includeMargin={true}
                      // renderAs="svg"
                    />
                    <p className="mt-2 text-gray-600 text-sm">Scan to view order details</p>
                  </div>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden mt-4">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Quantity</th>
                      <th className="p-3 text-left">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-3 flex items-center gap-3">
                          <img src={product.productImageUrl} alt={product.name} 
                               className="w-12 h-12 rounded-md object-cover" />
                          <span className="text-gray-800">{product.name}</span>
                        </td>
                        <td className="p-3 text-gray-700 font-semibold">₹{product.price}</td>
                        <td className="p-3 text-gray-700">{product.quantity}</td>
                        <td className="p-3 text-gray-500">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {order.status === "pending" && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => acceptOrder(order)}
                    disabled={processingOrders.has(order.id)}
                    className={`flex items-center gap-2 ${
                      processingOrders.has(order.id) 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-green-600 hover:bg-green-700"
                    } text-white px-5 py-2 rounded-lg transition-all shadow-md`}
                  >
                    {processingOrders.has(order.id) ? "Processing..." : "✅ Accept Order"}
                  </button>
                  <button
                    onClick={() => rejectOrder(order)}
                    disabled={processingOrders.has(order.id)}
                    className={`flex items-center gap-2 ${
                      processingOrders.has(order.id) 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-red-600 hover:bg-red-700"
                    } text-white px-5 py-2 rounded-lg transition-all shadow-md`}
                  >
                    {processingOrders.has(order.id) ? "Processing..." : "❌ Reject Order"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;