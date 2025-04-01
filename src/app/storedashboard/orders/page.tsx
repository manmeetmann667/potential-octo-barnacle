
"use client";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs } from "firebase/firestore";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { CheckCircleIcon, ClockIcon, XCircleIcon, QrCodeIcon, PackageIcon, TruckIcon } from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';

type ProductStatus = "pending" | "accepted" | "reviewed" | "rejected" | "picked" | "onway" | "delivered";

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productImageUrl: string;
  stock: number;
  status: ProductStatus;
  rejectionReason?: string;
  updatedPrice?: number;
};

type StoreOrder = {
  id: string;
  storeId: string;
  status: ProductStatus;
  createdAt: Date;
  timestamps: {
    accepted?: Date;
    rejected?: Date;
    packaged?: Date;
    onway?: Date;
    delivered?: Date;
  };
};

type Order = {
  id: string;
  userId: string;
  createdAt: Date;
  status: ProductStatus;
  storeStatuses: Record<string, ProductStatus>;
  storeOrders: StoreOrder[];
  products: Product[];
  timestamps: {
    created?: Date;
    accepted?: Date;
    rejected?: Date;
    packaged?: Date;
    onway?: Date;
    delivered?: Date;
  };
};

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string;
  orderId: string;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, qrData, orderId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Order #{orderId.substring(0, 8)}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="flex flex-col items-center">
          <QRCodeSVG
            value={qrData}
            size={256}
            level="H"
            includeMargin={true}
          />
          <p className="mt-4 text-sm text-gray-600 text-center">
            Scan this QR code to update product status
          </p>
        </div>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderShimmer = () => {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-full w-24"></div>
      </div>
      
      <div className="border rounded-lg overflow-hidden mt-4">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3"><div className="h-4 bg-gray-200 rounded"></div></th>
              <th className="p-3"><div className="h-4 bg-gray-200 rounded"></div></th>
              <th className="p-3"><div className="h-4 bg-gray-200 rounded"></div></th>
              <th className="p-3"><div className="h-4 bg-gray-200 rounded"></div></th>
              <th className="p-3"><div className="h-4 bg-gray-200 rounded"></div></th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-t">
                <td className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-gray-200"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="p-3"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                <td className="p-3"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                <td className="p-3"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                <td className="p-3"><div className="h-8 bg-gray-200 rounded-full w-24 mx-auto"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex gap-4">
        <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [processingProducts, setProcessingProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    orderId: string;
    qrData: string;
  }>({
    isOpen: false,
    orderId: "",
    qrData: ""
  });

  const fetchStoreId = useCallback(async (userEmail: string) => {
    const q = query(collection(db, "stores"), where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.id || null;
  }, []);

  const determineOverallOrderStatus = (storeStatuses: Record<string, ProductStatus>): ProductStatus => {
    if (!storeStatuses || Object.keys(storeStatuses).length === 0) {
      return "pending";
    }
    
    const statusValues = Object.values(storeStatuses);
    
    if (statusValues.length === 1) {
      return statusValues[0];
    }
    
    const allAccepted = statusValues.every(status => status === "accepted");
    const allRejected = statusValues.every(status => status === "rejected");
    const hasPending = statusValues.some(status => status === "pending");
    
    if (allAccepted) return "accepted";
    if (allRejected) return "rejected";
    
    if (!hasPending && statusValues.some(status => status === "accepted") && statusValues.some(status => status === "rejected")) {
      return "reviewed";
    }
    
    return "pending";
  };

  const determineOrderStatus = (storeStatuses: { [s: string]: unknown; } | ArrayLike<unknown>) => {
    if (!storeStatuses || Object.keys(storeStatuses).length === 0) {
      return "pending";
    }
    
    const statusValues = Object.values(storeStatuses);
    
    if (statusValues.length === 1 && statusValues[0] === "rejected") {
      return "rejected";
    }
    
    if (statusValues.length === 1 && statusValues[0] === "accepted") {
      return "accepted";
    }
    
    const allAccepted = statusValues.every(status => status === "accepted");
    const allRejected = statusValues.every(status => status === "rejected");
    const hasPending = statusValues.some(status => status === "pending");
    
    if (allAccepted) return "accepted";
    if (allRejected) return "rejected";
    
    if (!hasPending && statusValues.some(status => status === "accepted") && statusValues.some(status => status === "rejected")) {
      return "reviewed";
    }
    
    return "pending";
  };

  const fetchStoreOrders = useCallback(async (orderId: string) => {
    const storeOrdersRef = collection(db, `Orders/${orderId}/StoreOrders`);
    const snapshot = await getDocs(storeOrdersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      storeId: doc.data().storeId,
      status: doc.data().status || "pending",
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      timestamps: {
        accepted: doc.data().acceptedAt?.toDate(),
        rejected: doc.data().rejectedAt?.toDate(),
        packaged: doc.data().packagedAt?.toDate(),
        onway: doc.data().onwayAt?.toDate(),
        delivered: doc.data().deliveredAt?.toDate(),
      }
    } as StoreOrder));
  }, []);

  const fetchProductsForOrder = useCallback(async (orderId: string, storeOrderId: string) => {
    const productsRef = collection(db, `Orders/${orderId}/StoreOrders/${storeOrderId}/products`);
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || "Unknown",
      price: doc.data().price || 0,
      quantity: doc.data().quantity || 0,
      productImageUrl: doc.data().productImageUrl || "",
      stock: 0,
      status: doc.data().status || "pending",
      rejectionReason: doc.data().rejectionReason,
      updatedPrice: doc.data().updatedPrice
    } as Product));
  }, []);

  const checkAndUpdateOrderStatus = useCallback(async (orderId: string) => {
    if (!storeId) return;
    
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const storeOrder = order.storeOrders.find(so => so.storeId === storeId);
      if (!storeOrder) return;
      
      const allProductsRejected = order.products.every(p => p.status === "rejected");
      
      if (allProductsRejected) {
        const storeOrderRef = doc(db, `Orders/${orderId}/StoreOrders/${storeOrder.id}`);
        await updateDoc(storeOrderRef, { 
          status: "rejected",
          rejectedAt: new Date()
        });
        
        const orderRef = doc(db, "Orders", orderId);
        const orderDoc = await getDoc(orderRef);
        
        if (orderDoc.exists()) {
          const storeStatuses = orderDoc.data().storeStatuses || {};
          await updateDoc(orderRef, {
            storeStatuses: {
              ...storeStatuses,
              [storeId]: "rejected"
            }
          });
        }
        
        setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status: "rejected",
              storeStatuses: {
                ...o.storeStatuses,
                [storeId]: "rejected"
              }
            };
          }
          return o;
        }));
      }
    } catch (error) {
      console.error("Error checking order status:", error);
    }
  }, [storeId, orders]);

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

  useEffect(() => {
    if (!storeId) return;

    setIsLoading(true);
    const ordersQuery = query(collection(db, "Orders"), where("storeStatuses." + storeId, "!=", null));
    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const storeOrders = await fetchStoreOrders(doc.id);
        const ourStoreOrder = storeOrders.find(so => so.storeId === storeId);
        if (!ourStoreOrder) return null;

        const products = await fetchProductsForOrder(doc.id, ourStoreOrder.id);
        const productsWithStock = await Promise.all(products.map(async (product) => ({
          ...product,
          stock: await fetchProductStock(product.id)
        })));

        return {
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: ourStoreOrder.status,
          userId: data.userId || "Unknown User",
          storeStatuses: data.storeStatuses || {},
          storeOrders,
          products: productsWithStock,
          timestamps: {
            created: data.createdAt?.toDate(),
            accepted: data.acceptedAt?.toDate(),
            rejected: data.rejectedAt?.toDate(),
            packaged: data.packagedAt?.toDate(),
            onway: data.onwayAt?.toDate(),
            delivered: data.deliveredAt?.toDate(),
          }
        } as Order;
      });

      const ordersList = (await Promise.all(ordersPromises)).filter(Boolean) as Order[];
      setOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [storeId, fetchStoreOrders, fetchProductsForOrder, fetchProductStock]);

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

  const updateStockForAllOrders = useCallback((productId: string, newStock: number) => {
    setOrders(prev => prev.map(order => ({
      ...order,
      products: order.products.map(product => 
        product.id === productId ? { ...product, stock: newStock } : product
      )
    })));
  }, []);
  
  const updateOrderBasedOnStoreStatuses = async (orderId: string) => {
    const orderRef = doc(db, "Orders", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists()) {
      const storeStatuses = orderDoc.data().storeStatuses || {};
      const updatedStatus = determineOrderStatus(storeStatuses);
      
      await updateDoc(orderRef, {
        status: updatedStatus,
        ...(updatedStatus === "accepted" && { acceptedAt: new Date() }),
        ...(updatedStatus === "rejected" && { rejectedAt: new Date() }),
        ...(updatedStatus === "reviewed" && { reviewedAt: new Date() })
      });
      
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: updatedStatus
          };
        }
        return o;
      }));
      
      return updatedStatus;
    }
    
    return null;
  };

  const updateOrderStatus = async (orderId:string, storeStatuses: ArrayLike<unknown> | { [s: string]: unknown; }) => {
    try {
      const newStatus = determineOrderStatus(storeStatuses);
      const orderRef = doc(db, "Orders", orderId);
      
      await updateDoc(orderRef, {
        status: newStatus,
        ...(newStatus === "accepted" && { acceptedAt: new Date() }),
        ...(newStatus === "rejected" && { rejectedAt: new Date() }),
        ...(newStatus === "reviewed" && { reviewedAt: new Date() })
      });
      
      console.log(`Order ${orderId} status updated to: ${newStatus}`);
      return newStatus;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  };
 
  const updateProductStatus = useCallback(async (orderId: string, productId: string, status: ProductStatus, reason?: string) => {
    if (!storeId) return;
    
    try {
      setProcessingProducts(prev => new Set(prev).add(productId));
      
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const storeOrder = order.storeOrders.find(so => so.storeId === storeId);
      if (!storeOrder) return;

      const productRef = doc(db, `Orders/${orderId}/StoreOrders/${storeOrder.id}/products`, productId);
      await updateDoc(productRef, { 
        status,
        ...(reason && { rejectionReason: reason }),
        ...(status === "rejected" && { updatedPrice: null })
      });

      const updatedProducts = order.products.map(p => {
        if (p.id === productId) {
          return { 
            ...p, 
            status,
            rejectionReason: reason,
            ...(status === "rejected" && { updatedPrice: undefined })
          };
        }
        return p;
      });

      const allProductsForStore = updatedProducts;
      const allAccepted = allProductsForStore.every(p => p.status === "accepted");
      const allRejected = allProductsForStore.every(p => p.status === "rejected");
      const hasPending = allProductsForStore.some(p => p.status === "pending");
      
      let storeOrderStatus: ProductStatus;
      if (allAccepted) {
        storeOrderStatus = "accepted";
      } else if (allRejected) {
        storeOrderStatus = "rejected";
      } else if (!hasPending && allProductsForStore.some(p => p.status === "accepted") && allProductsForStore.some(p => p.status === "rejected")) {
        storeOrderStatus = "reviewed";
      } else {
        storeOrderStatus = "pending";
      }
      
      const storeOrderRef = doc(db, `Orders/${orderId}/StoreOrders/${storeOrder.id}`);
      await updateDoc(storeOrderRef, { 
        status: storeOrderStatus,
        ...(storeOrderStatus === "accepted" && { acceptedAt: new Date() }),
        ...(storeOrderStatus === "rejected" && { rejectedAt: new Date() }),
        ...(storeOrderStatus === "reviewed" && { reviewedAt: new Date() })
      });

      const orderRef = doc(db, "Orders", orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const currentStoreStatuses = orderDoc.data().storeStatuses || {};
        const updatedStoreStatuses = {
          ...currentStoreStatuses,
          [storeId]: storeOrderStatus
        };
        
        await updateDoc(orderRef, {
          storeStatuses: updatedStoreStatuses
        });
        
        const overallStatus = determineOverallOrderStatus(updatedStoreStatuses);
        
        await updateDoc(orderRef, {
          status: overallStatus,
          ...(overallStatus === "accepted" && { acceptedAt: new Date() }),
          ...(overallStatus === "rejected" && { rejectedAt: new Date() }),
          ...(overallStatus === "reviewed" && { reviewedAt: new Date() })
        });
        
        setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              products: updatedProducts,
              status: storeOrderStatus,
              storeStatuses: updatedStoreStatuses
            };
          }
          return o;
        }));
      }
      
      if (status === "accepted") {
        const productInfo = await findProductDocRef(productId);
        if (productInfo) {
          const currentStock = Number(productInfo.data.stock) || 0;
          const orderQuantity = Number(order.products.find(p => p.id === productId)?.quantity || 0);
          const newStock = Math.max(currentStock - orderQuantity, 0);
          
          await updateDoc(productInfo.ref, { stock: newStock });
          updateStockForAllOrders(productId, newStock);
        }
      }

    } catch (error) {
      console.error("Error updating product status:", error);
    } finally {
      setProcessingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }, [storeId, orders, findProductDocRef, updateStockForAllOrders]);

  const getStatusIcon = (status: ProductStatus) => {
    switch (status) {
      case "pending": return <ClockIcon className="w-4 h-4" />;
      case "accepted": return <CheckCircleIcon className="w-4 h-4" />;
      case "rejected": return <XCircleIcon className="w-4 h-4" />;
      case "picked": return <PackageIcon className="w-4 h-4" />;
      case "onway": return <TruckIcon className="w-4 h-4" />;
      case "delivered": return <CheckCircleIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "picked": return "bg-blue-100 text-blue-800";
      case "onway": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toggleQRCode = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !storeId) return;

    const qrData = JSON.stringify({
      orderId,
      storeId,
      productIds: order.products.map(p => p.id),
      action: "updateStatus"
    });

    setQrModalData({
      isOpen: true,
      orderId,
      qrData
    });
  }, [orders, storeId]);

  const closeQRModal = useCallback(() => {
    setQrModalData(prev => ({ ...prev, isOpen: false }));
  }, []);

  const isAllProductsReviewed = (order: { products: any[]; }) => {
    return order.products.every((product) => product.status !== "pending");
  };
  
  

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-4xl font-bold mb-6 text-gray-800">📦 Manage Orders</h2>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <OrderShimmer key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <PackageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">No orders found for your store</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-lg rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Order #{order.id.substring(0, 8)}</h3>
                  <p className="text-gray-600 mt-1">
                    {order.createdAt.toLocaleString()} • {order.userId}
                  </p>
                </div>
                <button
                  onClick={() => toggleQRCode(order.id)}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                >
                  <QrCodeIcon className="w-4 h-4" />
                  Show QR
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden mt-4">
                <table className="w-full border-collapse">

{/* 

                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Qty</th>
                      <th className="p-3 text-left">Stock</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.products.map((product) => (
                      <tr key={product.id} className={`border-t ${product.status === "rejected" ? "bg-red-50" : ""}`}>
                        <td className="p-3 flex items-center gap-3">
                          <img 
                            src={product.productImageUrl} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-md object-cover" 
                          />
                          <span className={`${product.status === "rejected" ? "line-through text-red-500" : ""}`}>
                            {product.name}
                          </span>
                        </td>
                        <td className="p-3">
                          {product.status === "rejected" ? (
                            <div className="flex flex-col">
                              <span className="line-through text-red-500">₹{product.price}</span>
                              {product.updatedPrice && (
                                <span className="text-green-600">₹{product.updatedPrice}</span>
                              )}
                            </div>
                          ) : (
                            <span>₹{product.price}</span>
                          )}
                        </td>
                        <td className="p-3">{product.quantity}</td>
                        <td className="p-3">{product.stock}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(product.status)}`}>
                            {getStatusIcon(product.status)}
                            {product.status}
                          </span>
                          {product.status === "rejected" && product.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1">{product.rejectionReason}</p>
                          )}
                        </td>
                        <td className="p-3">
                          {product.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateProductStatus(order.id, product.id, "accepted")}
                                disabled={processingProducts.has(product.id)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  processingProducts.has(product.id)
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                }`}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason) updateProductStatus(order.id, product.id, "rejected", reason);
                                }}
                                disabled={processingProducts.has(product.id)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  processingProducts.has(product.id)
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody> */}
                  <thead className="bg-gray-100 text-gray-700">
  <tr>
    <th className="p-3 text-left">Product</th>
    <th className="p-3 text-left">Price</th>
    <th className="p-3 text-left">Qty</th>
    <th className="p-3 text-left">Stock</th>
    <th className="p-3 text-left">Status</th>
    {!isAllProductsReviewed(order) && <th className="p-3 text-left">Actions</th>}
  </tr>
</thead>
<tbody>
  {order.products.map((product) => (
    <tr key={product.id} className={`border-t ${product.status === "rejected" ? "bg-red-50" : ""}`}>
      <td className="p-3 flex items-center gap-3">
        <img 
          src={product.productImageUrl} 
          alt={product.name} 
          className="w-12 h-12 rounded-md object-cover" 
        />
        <span className={`${product.status === "rejected" ? "line-through text-red-500" : ""}`}>
          {product.name}
        </span>
      </td>
      <td className="p-3">
        {product.status === "rejected" ? (
          <div className="flex flex-col">
            <span className="line-through text-red-500">₹{product.price}</span>
            {product.updatedPrice && <span className="text-green-600">₹{product.updatedPrice}</span>}
          </div>
        ) : (
          <span>₹{product.price}</span>
        )}
      </td>
      <td className="p-3">{product.quantity}</td>
      <td className="p-3">{product.stock}</td>
      <td className="p-3">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(product.status)}`}>
          {getStatusIcon(product.status)}
          {product.status}
        </span>
        {product.status === "rejected" && product.rejectionReason && (
          <p className="text-xs text-red-500 mt-1">{product.rejectionReason}</p>
        )}
      </td>

      {!isAllProductsReviewed(order) && (
        <td className="p-3">
          {product.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={() => updateProductStatus(order.id, product.id, "accepted")}
                disabled={processingProducts.has(product.id)}
                className={`px-3 py-1 text-xs rounded-md ${
                  processingProducts.has(product.id)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                Accept
              </button>
              <button
                onClick={() => {
                  const reason = prompt("Rejection reason:");
                  if (reason) updateProductStatus(order.id, product.id, "rejected", reason);
                }}
                disabled={processingProducts.has(product.id)}
                className={`px-3 py-1 text-xs rounded-md ${
                  processingProducts.has(product.id)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                Reject
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  ))}
</tbody>

                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <QRModal
        isOpen={qrModalData.isOpen}
        onClose={closeQRModal}
        qrData={qrModalData.qrData}
        orderId={qrModalData.orderId}
      />
    </div>
  );
};

export default Orders;