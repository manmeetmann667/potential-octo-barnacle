
"use client";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "lucide-react";

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
  products: Product[];
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user?.email) {
        const id = await fetchStoreId(user.email);
        setStoreId(id);
        if (id) fetchOrders(id);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchStoreId = async (userEmail: string) => {
    const q = query(collection(db, "stores"), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : querySnapshot.docs[0].id;
  };

  const fetchOrders = async (currentStoreId: string) => {
    try {
      const ordersRef = collection(db, "Orders");
      const ordersSnapshot = await getDocs(ordersRef);
      
      if (ordersSnapshot.empty) return;

      const ordersList = await Promise.all(
        ordersSnapshot.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data();
          const orderId = orderDoc.id;
          const createdAt = orderData.createdAt?.toDate() || new Date();
          const location = await convertLocationToAddress(
            orderData.location?.latitude,
            orderData.location?.longitude
          );

          const storeRef = collection(db, `Orders/${orderId}/stores/${currentStoreId}/products`);
          const productSnapshot = await getDocs(storeRef);
          if (productSnapshot.empty) return null;

          const products: Product[] = await Promise.all(
            productSnapshot.docs.map(async (productDoc) => {
              const productData = productDoc.data();
              const stock = await fetchProductStock(currentStoreId, productData.id);
              return {
                id: productDoc.id,
                name: productData.name || "Unknown",
                price: productData.price || 0,
                // category: productData.category || "Uncategorized",
                quantity: productData.quantity || 0,
                productImageUrl: productData.productImageUrl || "",
                stock,
              };
            })
          );
          return { id: orderId, createdAt, status: orderData.status || "pending", userId: orderData.userId || "Unknown User", location, products };
        })
      );

      setOrders(ordersList.filter((order) => order !== null).sort((a, b) => b!.createdAt.getTime() - a!.createdAt.getTime()) as Order[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const acceptOrder = async (order: Order) => {
    try {
      const orderRef = doc(db, "Orders", order.id);
      await updateDoc(orderRef, { status: "accepted" });
  
      if (!storeId) {
        console.error("Store ID is not set.");
        return;
      }
  
      const updatedProducts = [...order.products]; // Copy order products to update in state
  
      await Promise.all(
        order.products.map(async (product, index) => {
          let catalogueCategoryId: string | null = null;
  
          // Step 1: Search for the category where the product exists
          const categoriesRef = collection(db, `stores/${storeId}/categories`);
          const categoriesSnapshot = await getDocs(categoriesRef);
  
          for (const categoryDoc of categoriesSnapshot.docs) {
            const productsRef = collection(db, `stores/${storeId}/categories/${categoryDoc.id}/products`);
            const productSnapshot = await getDoc(doc(productsRef, product.id));
  
            if (productSnapshot.exists()) {
              catalogueCategoryId = categoryDoc.id;
              break; // Stop searching once found
            }
          }
  
          if (!catalogueCategoryId) {
            console.warn(`Product with ID ${product.id} not found in any category.`);
            return;
          }
  
          // Step 2: Construct the correct Firestore path
          const categoryProductRef = doc(db, `stores/${storeId}/categories/${catalogueCategoryId}/products/${product.id}`);
  
          // Step 3: Get the current stock
          const categoryProductSnapshot = await getDoc(categoryProductRef);
          if (!categoryProductSnapshot.exists()) {
            console.warn(`Product ${product.id} not found in category ${catalogueCategoryId}.`);
            return;
          }
  
          const currentStock = categoryProductSnapshot.data().stock || 0;
          const newStock = Math.max(currentStock - product.quantity, 0);
  
          // Step 4: Update stock in Firestore
          await updateDoc(categoryProductRef, { stock: newStock });
  
          // Step 5: Update stock in local state
          updatedProducts[index] = { ...product, stock: newStock };
        })
      );
  
      // Update orders state
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? { ...o, status: "accepted", products: updatedProducts } : o))
      );
  
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };
  

  const rejectOrder = async (order: Order) => {
    try {
      const orderRef = doc(db, "Orders", order.id);
      await updateDoc(orderRef, { status: "rejected" });
  
      if (!storeId) {
        console.error("Store ID is not set.");
        return;
      }
  
      // Log rejection message (optional)
      console.warn(`Order ${order.id} has been rejected.`);
  
      // Update state to reflect changes
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === order.id ? { ...o, status: "rejected" } : o))
      );
  
    } catch (error) {
      console.error("Error rejecting order:", error);
    }
  };
  
  const convertLocationToAddress = async (latitude: number, longitude: number) => {
    if (!latitude || !longitude) return "Location not available";

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      return data.display_name || "Unknown Location";
    } catch (error) {
      console.error("Error fetching location:", error);
      return "Unknown Location";
    }
  };
  
  const fetchProductStock = async (storeId: string, productId: string) => {
    const categoriesRef = collection(db, `stores/${storeId}/categories`);
    const categoriesSnapshot = await getDocs(categoriesRef);

    for (const categoryDoc of categoriesSnapshot.docs) {
      const productRef = doc(db, `stores/${storeId}/categories/${categoryDoc.id}/products/${productId}`);
      const productSnapshot = await getDoc(productRef);
      if (productSnapshot.exists()) return productSnapshot.data().stock || 0;
    }
    return 0;
  };
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-6 text-gray-800">📦 Manage Orders</h2>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No orders found.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
              {/* Order Header */}
              <div className="flex   items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-6">Order ID: {order.id}</h3>
                  <p className="text-lg text-gray-800">
                    📅 {new Date(order.createdAt).toLocaleString()} 
                  </p>
                  <p className="text-lg text-gray-800 mt-5 mb-5">
                     📍 {order.location}
                  </p>
                  <p className="text-m text-gray-800"> UserId: {order.userId}</p>
                </div>
                <span
                  className={`px-3  py-2 rounded-full text-white text-sm font-medium flex items-center  gap-1 ${
                    order.status === "pending"
                      ? "bg-yellow-500"
                      : order.status === "accepted"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                >
                  {order.status === "pending" ? <ClockIcon className="w-4 h-4" /> : null}
                  {order.status === "accepted" ? <CheckCircleIcon className="w-4 h-4" /> : null}
                  {order.status === "rejected" ? <XCircleIcon className="w-4 h-4" /> : null}
                  {order.status.toUpperCase()}
                </span>
              </div>

              {/* Products Table */}
              <div className="border rounded-lg overflow-hidden mt-4">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Quantity ordered</th>
                      <th className="p-3 text-left">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-3 flex items-center gap-3">
                          <img src={product.productImageUrl} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
                          <span className="text-gray-800">{product.name}</span>
                        </td>
                        <td className="p-3 text-gray-500">
                          {/* {product.catalogueCategoryName || "Unknown"} */}
                        </td>
                        <td className="p-3 text-gray-700 font-semibold">₹{product.price}</td>
                        <td className="p-3 text-gray-700">{product.quantity}</td>
                        <td className="p-3 text-gray-500">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              {order.status === "pending" && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => acceptOrder(order)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition-all shadow-md"
                  >
                    ✅ Accept Order
                  </button>

                  <button
                    onClick={() => rejectOrder(order)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-all shadow-md"
                  >
                    ❌ Reject Order
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

