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
import { getDeliveriesByCustomerId, IDelivery } from "@/services/delivery-service"
import { getCookie } from "cookies-next"

// Item interface
interface OrderItem {
  name: string;
  quantity: number;
}

// Sample data
const SAMPLE_ORDERS = [
  {
    id: "del-001",
    status: "IN_PROGRESS" as DeliveryStatus,
    orderId: "ORD-1234",
    restaurant: {
      name: "Burger Palace",
      address: "123 Main St, New York, NY",
      phone: "555-123-4567",
      location: { lat: 40.7128, lng: -74.006 },
    },
    customer: {
      name: "John Smith",
      address: "456 Park Ave, New York, NY",
      phone: "555-987-6543",
      location: { lat: 40.7282, lng: -73.9942 },
    },
    driver: {
      name: "Michael Johnson",
      phone: "555-555-5555",
      vehicle: "Honda Civic (ABC-1234)",
    },
    driverLocation: { lat: 40.72, lng: -74.0 },
    estimatedTime: "15 min",
    distance: "2.3 mi",
    amount: "24.50",
    items: [
      { name: "Cheeseburger", quantity: 2 },
      { name: "Fries", quantity: 1 },
      { name: "Soda", quantity: 2 },
    ],
    createdAt: new Date().toISOString(),
    timestamps: {
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      acceptedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      pickedUpAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  },
  {
    id: "del-002",
    status: "DELIVERED" as DeliveryStatus,
    orderId: "ORD-5678",
    restaurant: {
      name: "Pizza Express",
      address: "789 Broadway, New York, NY",
      phone: "555-222-3333",
      location: { lat: 40.7309, lng: -73.9872 },
    },
    customer: {
      name: "John Smith",
      address: "456 Park Ave, New York, NY",
      phone: "555-987-6543",
      location: { lat: 40.7282, lng: -73.9942 },
    },
    driver: {
      name: "David Brown",
      phone: "555-666-7777",
      vehicle: "Toyota Prius (XYZ-5678)",
    },
    driverLocation: { lat: 40.7282, lng: -73.9942 },
    estimatedTime: "0 min",
    distance: "1.8 mi",
    amount: "32.75",
    items: [
      { name: "Large Pepperoni Pizza", quantity: 1 },
      { name: "Garlic Knots", quantity: 1 },
      { name: "2L Soda", quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    timestamps: {
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      acceptedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      pickedUpAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      deliveredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  },
  {
    id: "del-003",
    status: "PENDING" as DeliveryStatus,
    orderId: "ORD-9012",
    restaurant: {
      name: "Sushi Delight",
      address: "567 West St, New York, NY",
      phone: "555-333-4444",
      location: { lat: 40.7352, lng: -74.0086 },
    },
    customer: {
      name: "John Smith",
      address: "456 Park Ave, New York, NY",
      phone: "555-987-6543",
      location: { lat: 40.7282, lng: -73.9942 },
    },
    driverLocation: { lat: 40.7352, lng: -74.0086 },
    estimatedTime: "25 min",
    distance: "2.5 mi",
    amount: "45.50",
    items: [
      { name: "California Roll", quantity: 2 },
      { name: "Spicy Tuna Roll", quantity: 1 },
      { name: "Miso Soup", quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    timestamps: {
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  },
]

export default function CustomerOrdersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([])
  const [activeOrder, setActiveOrder] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("Customer")

  // Get user ID from cookies or localStorage
  useEffect(() => {
    // Try to get from cookie first (for SSR)
    const cookieUserId = getCookie('userId')?.toString();
    
    // Otherwise try localStorage (client-side only)
    const localStorageUserId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId')
      : null;
    
    setUserId(cookieUserId || localStorageUserId);
    
    // Get user name if available
    if (typeof window !== 'undefined') {
      const firstName = localStorage.getItem('firstName');
      const lastName = localStorage.getItem('lastName');
      if (firstName || lastName) {
        setUserName(`${firstName || ''} ${lastName || ''}`.trim());
      }
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (userId) {
        try {
          const customerId = userId;
          const data = await getDeliveriesByCustomerId(customerId);
          
          // Transform data to match the UI requirements
          const transformedData = data.map((delivery: IDelivery) => {
            return {
              id: delivery._id || "",
              status: delivery.status as DeliveryStatus,
              orderId: delivery.orderId,
              restaurant: {
                name: "Restaurant Name", // This should come from another API using delivery.restaurantId
                address: "Restaurant Address",
                phone: "Restaurant Phone",
                location: { lat: 40.7128, lng: -74.006 }, // Default location, should be replaced
              },
              customer: {
                name: userName || "Customer",
                address: "Customer Address",
                phone: "Customer Phone",
                location: { lat: 40.7282, lng: -73.9942 },
              },
              driver: delivery.driverId ? {
                name: "Driver Name", // This should come from another API using delivery.driverId
                phone: "Driver Phone",
                vehicle: "Vehicle Info",
              } : undefined,
              driverLocation: { lat: 40.72, lng: -74.0 },
              estimatedTime: "15 min",
              distance: "2.3 mi",
              amount: "24.50",
              items: [
                { name: "Item 1", quantity: 1 },
                { name: "Item 2", quantity: 1 },
              ],
              createdAt: delivery.createdAt,
              timestamps: {
                createdAt: delivery.createdAt,
                acceptedAt: delivery.acceptedAt,
                deliveredAt: delivery.deliveredAt,
              },
            }
          })
          
          setOrders(transformedData.length > 0 ? transformedData : SAMPLE_ORDERS)
        } catch (error) {
          console.error("Failed to fetch orders:", error)
          setOrders(SAMPLE_ORDERS) // Fallback to sample data
        }
      } else {
        setOrders(SAMPLE_ORDERS) // Fallback to sample data
      }
      setLoading(false)
    }

    fetchOrders()
  }, [userId, userName])

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

  const submitRating = () => {
    // In a real app, this would submit the rating to the backend
    setShowRating(false)
    // Show a success message or update the UI
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
                    {activeOrderData.items.map((item: OrderItem, index: number) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${(Number.parseFloat(activeOrderData.amount) - 5).toFixed(2)}</span>
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
                      <span>${activeOrderData.amount}</span>
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
