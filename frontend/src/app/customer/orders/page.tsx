"use client"

import { useState, useEffect } from "react"
// import { CustomerLayout } from "@/components/customer/customer-layout"
import { DeliveryCard } from "@/components/ui/delivery-card"
// import { DeliveryMap } from "@/components/ui/delivery-map"
import { DeliveryTimeline } from "@/components/ui/delivery-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DeliveryStatus } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DeliveryMap } from "@/components/ui/delivery-map"
import { getDeliveriesByCustomerId, IDelivery, getDeliveryWithOrderDetails, OrderDetails } from "@/services/delivery-service"
import { getCookie } from "cookies-next"

// Item interface
interface OrderItem {
  name: string;
  quantity: number;
}

// Extended delivery interface for UI
interface UIDelivery {
  id: string;
  status: DeliveryStatus;
  orderId: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    location: { lat: number; lng: number };
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    location: { lat: number; lng: number };
  };
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  driverLocation: { lat: number; lng: number };
  estimatedTime: string;
  distance: string;
  amount: string;
  items: OrderItem[];
  createdAt: string;
  timestamps: {
    createdAt: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    cancelledAt?: string;
  };
}

// Extended OrderDetails interface with expected fields
interface ExtendedOrderDetails extends OrderDetails {
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  restaurantDetails?: {
    location?: {
      latitude?: number;
      longitude?: number;
    };
  };
  customerPhone?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverLocation?: {
    latitude?: number;
    longitude?: number;
  };
  totalAmount?: number;
  distance?: string;
  estimatedDeliveryTime?: string;
  pickedUpAt?: string;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<UIDelivery[]>([])
  const [activeOrder, setActiveOrder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("Customer")
  const [userAddress, setUserAddress] = useState<string>("")
  const [userPhone, setUserPhone] = useState<string>("")

  // Get user ID from cookies or localStorage
  useEffect(() => {
    // Try to get from cookie first (for SSR)
    const cookieUserId = getCookie('userId')?.toString();
    
    // Otherwise try localStorage (client-side only)
    const localStorageUserId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId')
      : null;
    
    setUserId(cookieUserId || localStorageUserId);
    
    // Get user info if available
    if (typeof window !== 'undefined') {
      const firstName = localStorage.getItem('firstName');
      const lastName = localStorage.getItem('lastName');
      if (firstName || lastName) {
        setUserName(`${firstName || ''} ${lastName || ''}`.trim());
      }
      
      // Get additional user info
      const address = localStorage.getItem('address');
      if (address) setUserAddress(address);
      
      const phone = localStorage.getItem('phone');
      if (phone) setUserPhone(phone);
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (userId) {
        try {
          const customerId = userId;
          const deliveries = await getDeliveriesByCustomerId(customerId);
          
          // Transform data to match the UI requirements
          const transformedData = await Promise.all(deliveries.map(async (delivery: IDelivery) => {
            // For each delivery, fetch additional order details if available
            let orderDetails: ExtendedOrderDetails | null = null;
            try {
              const details = await getDeliveryWithOrderDetails(delivery._id || "");
              orderDetails = details.order as ExtendedOrderDetails;
            } catch (error) {
              console.error("Failed to fetch order details:", error);
            }
            
            // Extract restaurant details from order
            const restaurantName = orderDetails?.restaurantName || "Restaurant";
            const restaurantAddress = orderDetails?.restaurantAddress || "Address unavailable";
            const restaurantPhone = orderDetails?.restaurantPhone || "Phone unavailable";
            
            // Extract locations from order details
            const restaurantLocation = { 
              lat: orderDetails?.restaurantDetails?.location?.latitude || 40.7128, 
              lng: orderDetails?.restaurantDetails?.location?.longitude || -74.006 
            };
              
            const customerLocation = { 
              lat: orderDetails?.customerDetails?.latitude || 40.7282, 
              lng: orderDetails?.customerDetails?.longitude || -73.9942 
            };
            
            // Get driver details if available
            const driverName = orderDetails?.driverName || "Driver";
            const driverPhone = orderDetails?.driverPhone || "Phone unavailable";
            const driverVehicle = orderDetails?.driverVehicle || "Vehicle unavailable";
            
            // Get driver location from order details or use a fallback
            const driverLocation = { 
              lat: orderDetails?.driverLocation?.latitude || 40.72, 
              lng: orderDetails?.driverLocation?.longitude || -74.0 
            };
            
            // Create formatted order items
            const items: OrderItem[] = orderDetails?.cartItems?.map((item) => ({
              name: item?.itemName || "Unknown item",
              quantity: item?.quantity || 1
            })) || [];
            
            // Get order amount from details if available
            const orderAmount = orderDetails?.totalAmount ? 
              orderDetails.totalAmount.toString() : 
              "0.00";
            
            // Calculate distance and ETA if available in order details
            const distance = orderDetails?.distance || "Unknown";
            const estimatedTime = orderDetails?.estimatedDeliveryTime || "Unknown";
            
            // Use current timestamp as fallback for createdAt
            const createdAt = delivery.createdAt || new Date().toISOString();
            
            return {
              id: delivery._id || "",
              status: delivery.status as DeliveryStatus,
              orderId: delivery.orderId,
              restaurant: {
                name: restaurantName,
                address: restaurantAddress,
                phone: restaurantPhone,
                location: restaurantLocation,
              },
              customer: {
                name: userName || "Customer",
                address: userAddress || orderDetails?.customerDetails?.address || "Address unavailable",
                phone: userPhone || orderDetails?.customerPhone || "Phone unavailable",
                location: customerLocation,
              },
              driver: delivery.driverId ? {
                name: driverName,
                phone: driverPhone,
                vehicle: driverVehicle,
              } : undefined,
              driverLocation,
              estimatedTime,
              distance,
              amount: orderAmount,
              items,
              createdAt,
              timestamps: {
                createdAt, // Use same fallback
                acceptedAt: delivery.acceptedAt,
                pickedUpAt: orderDetails?.pickedUpAt,
                deliveredAt: delivery.deliveredAt,
              },
            } as UIDelivery;
          }));
          
          setOrders(transformedData)
        } catch (error) {
          console.error("Failed to fetch orders:", error)
          setOrders([])
        }
      } else {
        setOrders([])
      }
      setLoading(false)
    }

    fetchOrders()
  }, [userId, userName, userAddress, userPhone])

  const handleViewDetails = (id: string) => {
    setActiveOrder(id)
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.restaurant.name && order.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const activeOrderData = orders.find((order) => order.id === activeOrder)

  const handleRateDelivery = () => {
    setShowRating(true)
  }

  const submitRating = async () => {
    if (!activeOrderData || rating === 0) return;
    
    try {
      // This would be implemented to submit rating to the backend
      // await submitDeliveryRating(activeOrderData.id, rating);
      setShowRating(false);
      // Show a success message
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by order ID or restaurant..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {activeOrder && activeOrderData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {activeOrderData.status === "DELIVERED" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Delivered</CardTitle>
                    <CardDescription>Your order has been delivered successfully</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DeliveryTimeline status={activeOrderData.status} timestamps={activeOrderData.timestamps} />
                  </CardContent>
                  <CardFooter>
                    {!showRating ? (
                      <Button onClick={handleRateDelivery} className="w-full">
                        Rate Delivery
                      </Button>
                    ) : (
                      <div className="space-y-4 w-full">
                        <div className="flex justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setRating(star)} className="p-1">
                              <Star
                                className={`h-8 w-8 ${
                                  rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <Button onClick={submitRating} className="w-full" disabled={rating === 0}>
                          Submit Rating
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ) : (
                <DeliveryMap
                  driverLocation={{
                    lat: activeOrderData.driverLocation.lat,
                    lng: activeOrderData.driverLocation.lng,
                    label: activeOrderData.driver?.name || "Driver",
                    icon: "driver",
                  }}
                  pickupLocation={{
                    lat: activeOrderData.restaurant.location.lat,
                    lng: activeOrderData.restaurant.location.lng,
                    label: activeOrderData.restaurant.name,
                    icon: "restaurant",
                  }}
                  dropoffLocation={{
                    lat: activeOrderData.customer.location.lat,
                    lng: activeOrderData.customer.location.lng,
                    label: "Your Location",
                    icon: "customer",
                  }}
                  className="h-[400px]"
                />
              )}

              {activeOrderData.status !== "DELIVERED" && (
                <DeliveryTimeline status={activeOrderData.status} timestamps={activeOrderData.timestamps} />
              )}

              <Button variant="outline" className="w-full" onClick={() => setActiveOrder(null)}>
                Back to Orders
              </Button>
            </div>

            <div>
              <DeliveryCard
                id={activeOrderData.id}
                status={activeOrderData.status}
                orderId={activeOrderData.orderId}
                restaurant={activeOrderData.restaurant}
                customer={activeOrderData.customer}
                driver={activeOrderData.driver}
                estimatedTime={activeOrderData.estimatedTime}
                distance={activeOrderData.distance}
                amount={activeOrderData.amount}
                createdAt={activeOrderData.createdAt}
                viewType="customer"
                className="mb-4"
              />

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="font-medium">Order Summary</h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {activeOrderData.items.length > 0 ? (
                      activeOrderData.items.map((item: OrderItem, index: number) => (
                        <li key={index} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">No items available</li>
                    )}
                  </ul>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(Number.parseFloat(activeOrderData.amount || "0") - 5).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span>$3.50</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>$1.50</span>
                    </div>
                    <div className="mt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>${activeOrderData.amount || "0.00"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4 space-y-4">
              {filteredOrders.filter((d) => ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No active orders</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders
                    .filter((d) => ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(d.status))
                    .map((order) => (
                      <DeliveryCard
                        key={order.id}
                        id={order.id}
                        status={order.status}
                        orderId={order.orderId}
                        restaurant={order.restaurant}
                        customer={order.customer}
                        driver={order.driver}
                        estimatedTime={order.estimatedTime}
                        distance={order.distance}
                        amount={order.amount}
                        createdAt={order.createdAt}
                        viewType="customer"
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4 space-y-4">
              {filteredOrders.filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No completed orders</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders
                    .filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status))
                    .map((order) => (
                      <DeliveryCard
                        key={order.id}
                        id={order.id}
                        status={order.status}
                        orderId={order.orderId}
                        restaurant={order.restaurant}
                        customer={order.customer}
                        driver={order.driver}
                        estimatedTime={order.estimatedTime}
                        distance={order.distance}
                        amount={order.amount}
                        createdAt={order.createdAt}
                        viewType="customer"
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="all" className="mt-4 space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No orders found</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOrders.map((order) => (
                    <DeliveryCard
                      key={order.id}
                      id={order.id}
                      status={order.status}
                      orderId={order.orderId}
                      restaurant={order.restaurant}
                      customer={order.customer}
                      driver={order.driver}
                      estimatedTime={order.estimatedTime}
                      distance={order.distance}
                      amount={order.amount}
                      createdAt={order.createdAt}
                      viewType="customer"
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
