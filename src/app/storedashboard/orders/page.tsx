
"use client";
import { db } from "../../lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  productImageUrl: string;
};

type Order = {
  id: string;
  createdAt: string;
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

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    console.error("No store found for this admin.");
    return null;
  };

  const fetchOrders = async (currentStoreId: string) => {
    try {
      console.log("Fetching orders for store:", currentStoreId);

      const ordersRef = collection(db, "Orders");
      const ordersSnapshot = await getDocs(ordersRef);

      if (ordersSnapshot.empty) {
        console.warn("No orders found in Firestore.");
        return;
      }

      const ordersList = await Promise.all(
        ordersSnapshot.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data();
          const orderId = orderDoc.id;
          const createdAt = orderData.createdAt?.toDate().toLocaleString() || "N/A";
          const location = await convertLocationToAddress(
            orderData.location?.latitude,
            orderData.location?.longitude
          );

          const storeRef = collection(db, `Orders/${orderId}/stores/${currentStoreId}/products`);
          const productSnapshot = await getDocs(storeRef);

          if (productSnapshot.empty) return null; // Skip if no products for this store

          const products: Product[] = productSnapshot.docs.map((productDoc) => {
            const productData = productDoc.data();
            return {
              id: productDoc.id,
              name: productData.name || "Unknown",
              price: productData.price || 0,
              category: productData.category || "Uncategorized",
              quantity: productData.quantity || 0,
              productImageUrl: productData.productImageUrl || "",
            };
          });

          return {
            id: orderId,
            createdAt,
            status: orderData.status || "pending",
            userId: orderData.userId || "Unknown User",
            location,
            products,
          };
        })
      );

      setOrders(ordersList.filter((order) => order !== null) as Order[]); // Remove null values
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  
//   const acceptOrder = async (order: Order) => {
// 	try {
// 	  const orderRef = doc(db, "Orders", order.id);
// 	  await updateDoc(orderRef, { status: "accepted" });
  
// 	  if (!storeId) {
// 		console.error("Store ID is not set.");
// 		return;
// 	  }
  
// 	  await Promise.all(
// 		order.products.map(async (product) => {
// 		  // Reference to the product inside the order
// 		//   const productRef = doc(db, `Orders/${order.id}/stores/${storeId}/products`, product.id);
  
// 		  // Reference to the store's product catalog
// 		  const storeProductRef = doc(db, `stores/${storeId}/categories/${product.catalogueCategoryId}/products/${product.id}`);
  
// 		  // Fetch the current stock from Firestore
// 		  const storeProductSnapshot = await getDocs(collection(db, `stores/${storeId}/categories/${product.catalogueCategoryId}/products`));
// 		  const storeProductDoc = storeProductSnapshot.docs.find((doc) => doc.id === product.id);
  
// 		  if (storeProductDoc) {
// 			const currentStock = storeProductDoc.data().stock || 0;
// 			const newStock = Math.max(currentStock - product.quantity, 0);
  
// 			// Update stock in Firestore
// 			await updateDoc(storeProductRef, { stock: newStock });
// 		  } else {
// 			console.warn(`Product with ID ${product.id} not found in store catalog.`);
// 		  }
// 		})
// 	  );
  
// 	  // Update order status in the local state
// 	  setOrders((prevOrders) =>
// 		prevOrders.map((o) => (o.id === order.id ? { ...o, status: "accepted" } : o))
// 	  );
  
// 	} catch (error) {
// 	  console.error("Error accepting order:", error);
// 	}
//   };

  
      
const acceptOrder = async (order: Order) => {
	try {
	  const orderRef = doc(db, "Orders", order.id);
	  await updateDoc(orderRef, { status: "accepted" });
  
	  if (!storeId) {
		console.error("Store ID is not set.");
		return;
	  }
  
	  await Promise.all(
		order.products.map(async (product) => {
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
  
		  // Step 4: Update stock
		  await updateDoc(categoryProductRef, { stock: newStock });
		})
	  );
  
	  setOrders((prevOrders) =>
		prevOrders.map((o) => (o.id === order.id ? { ...o, status: "accepted" } : o))
	  );
  
	} catch (error) {
	  console.error("Error accepting order:", error);
	}
  };
  
  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-3xl">Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center text-gray-600">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg shadow-md p-4 bg-white">
              <h3 className="text-lg font-semibold mb-2">Order ID: {order.id}</h3>
              <p className="text-sm text-gray-600">Created At: {order.createdAt}</p>
              <p className="text-sm text-gray-600">User: {order.userId}</p>
              <p className="text-sm text-gray-600">Location: {order.location}</p>
              <p className="text-sm text-gray-600 mb-2">Status: {order.status}</p>

              <div className="grid gap-4">
                {order.products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 border p-2 rounded-md">
                    <img
                      src={product.productImageUrl}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div>
                      <p className="text-md font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.category} - ₹{product.price} x {product.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.status === "pending" && (
                <button
                  onClick={() => acceptOrder(order)}
                  className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md"
                >
                  Accept Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
