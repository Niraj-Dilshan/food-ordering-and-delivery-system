"use client"

import { useState, useEffect } from "react"
import { DeliveryCard } from "@/components/ui/delivery-card"
import { DeliveryTimeline } from "@/components/ui/delivery-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import type { DeliveryStatus } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"
import type { DeliveryStatus } from "@/components/ui/status-badge"
import { DeliveryMap } from "@/components/ui/delivery-map"
import { getDeliveriesByRestaurantId, updateDelivery, IDelivery, getDeliveryWithOrderDetails } from "@/services/delivery-service"
import { userService, User } from "@/services/user-service"
import { getCookie } from "cookies-next"

// Item interface
interface OrderItem {
  name: string;
  quantity: number;
}

// Extended User interface to include restaurant-specific fields
interface RestaurantUser extends User {
  restaurantName?: string;
  restaurantAddress?: string;
  location?: { lat: number; lng: number };
}

// Extended User interface to include driver-specific fields
interface DriverUser extends User {
  vehicleNumber?: string;
}

// Order interface for type checking
interface OrderData {
  customerId: string;
  customerDetails?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  cartItems?: Array<{
    itemName?: string;
    quantity?: number;
  }>;
}

export default function RestaurantDeliveriesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID from cookies or localStorage
  useEffect(() => {
    // Try to get from cookie first (for SSR)
    const cookieUserId = getCookie('userId')?.toString();
    
    // Otherwise try localStorage (client-side only)
    const localStorageUserId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId')
      : null;
    
    setUserId(cookieUserId || localStorageUserId);
  }, []);

  useEffect(() => {
    const fetchDeliveries = async () => {
      if (userId) {
        try {
          const restaurantId = userId;
          let data: IDelivery[] = [];
          
          try {
            data = await getDeliveriesByRestaurantId(restaurantId);
          } catch (error) {
            console.error("Error fetching deliveries from API:", error);
            
            // Fallback to empty array if network error occurs
            // Show a notification or toast here if you have a UI component for it
            // For example: toast.error("Could not connect to delivery service");
          }
          
          // Transform data to match the UI requirements
          const transformedDataPromises = data.map(async (delivery: IDelivery) => {
            let restaurantInfo = {
              name: "Restaurant Name",
              address: "Restaurant Address",
              phone: "Restaurant Phone",
              location: { lat: 40.7128, lng: -74.006 },
            };
            
            let customerInfo = {
              name: "Customer Name",
              address: "Customer Address",
              phone: "Customer Phone",
              location: { lat: 40.7282, lng: -73.9942 },
            };
            
            let driverInfo = undefined;
            let orderItems = [
              { name: "Item 1", quantity: 1 },
              { name: "Item 2", quantity: 1 },
            ];
            
            try {
              // Get restaurant info
              const restaurant = await userService.getUserById(restaurantId) as RestaurantUser;
              if (restaurant) {
                restaurantInfo = {
                  name: restaurant.restaurantName || `${restaurant.firstName} ${restaurant.lastName}'s Restaurant`,
                  address: restaurant.restaurantAddress || "Address not available",
                  phone: restaurant.phone || "Phone not available",
                  location: restaurant.location || { lat: 40.7128, lng: -74.006 },
                };
              }
              
              // Get order details to fetch customer and items
              const orderDetails = await getDeliveryWithOrderDetails(delivery._id || "");
              if (orderDetails && orderDetails.order) {
                const order = orderDetails.order as OrderData;
                
                // Get customer info
                if (order.customerId) {
                  const customer = await userService.getUserById(order.customerId);
                  if (customer) {
                    customerInfo = {
                      name: `${customer.firstName} ${customer.lastName}`,
                      address: order.customerDetails?.address || "Customer Address",
                      phone: customer.phone || "Phone not available",
                      location: { 
                        lat: order.customerDetails?.latitude || 40.7282, 
                        lng: order.customerDetails?.longitude || -73.9942 
                      },
                    };
                  }
                }
                
                // Get order items
                if (order.cartItems && Array.isArray(order.cartItems)) {
                  orderItems = order.cartItems.map((item) => ({
                    name: item.itemName || "Unknown Item",
                    quantity: item.quantity || 1,
                  }));
                }
              }
              
              // Get driver info if assigned
              if (delivery.driverId) {
                const driver = await userService.getUserById(delivery.driverId) as DriverUser;
                if (driver) {
                  driverInfo = {
                    name: `${driver.firstName} ${driver.lastName}`,
                    phone: driver.phone || "Phone not available",
                    vehicle: driver.vehicleNumber || "Vehicle info not available",
                  };
                }
              }
            } catch (error) {
              console.error("Error fetching additional delivery details:", error);
              // Fallback to default values already set
            }
            
            return {
              id: delivery._id,
              status: delivery.status as DeliveryStatus,
              orderId: delivery.orderId,
              restaurant: restaurantInfo,
              customer: customerInfo,
              driver: delivery.driverId ? driverInfo : undefined,
              driverLocation: { lat: 40.72, lng: -74.0 }, // This would need real-time location
              estimatedTime: "15 min", // Calculate based on distance
              distance: "2.3 mi", // Calculate using coordinates
              amount: "8.50", // Get from order
              items: orderItems,
              createdAt: delivery.createdAt,
              timestamps: {
                createdAt: delivery.createdAt,
                acceptedAt: delivery.acceptedAt,
                deliveredAt: delivery.deliveredAt,
              },
            };
          });
          
          const transformedData = await Promise.all(transformedDataPromises);
          setDeliveries(transformedData);
        } catch (error) {
          console.error("Failed to fetch deliveries:", error)
          setDeliveries([]) // Empty array instead of sample data
        }
      } else {
        setDeliveries([]) // Empty array instead of sample data
      }
      setLoading(false)
    }

    fetchDeliveries()
  }, [userId])

  const handleHandToDriver = async (id: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatedDelivery = await updateDelivery(id, { status: "IN_PROGRESS" })
      setDeliveries(
        deliveries.map((delivery) =>
          delivery.id === id ? { ...delivery, status: "IN_PROGRESS" as DeliveryStatus } : delivery,
        ),
      )
    } catch (error) {
      console.error("Failed to update delivery:", error)
    }
  }

  const handleViewDetails = (id: string) => {
    setActiveDelivery(id)
  }

  const filteredDeliveries = deliveries.filter(
    (delivery) =>
      delivery.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.customer.name && delivery.customer.name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const activeDeliveryData = deliveries.find((delivery) => delivery.id === activeDelivery)

  if (loading) {
    return (
      <>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading deliveries...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by order ID or customer..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {activeDelivery && activeDeliveryData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <DeliveryMap
                driverLocation={{
                  lat: activeDeliveryData.driverLocation.lat,
                  lng: activeDeliveryData.driverLocation.lng,
                  label: activeDeliveryData.driver?.name || "Driver",
                  icon: "driver",
                }}
                pickupLocation={{
                  lat: activeDeliveryData.restaurant.location.lat,
                  lng: activeDeliveryData.restaurant.location.lng,
                  label: activeDeliveryData.restaurant.name,
                  icon: "restaurant",
                }}
                dropoffLocation={{
                  lat: activeDeliveryData.customer.location.lat,
                  lng: activeDeliveryData.customer.location.lng,
                  label: activeDeliveryData.customer.name,
                  icon: "customer",
                }}
                className="h-[300px]"
              />

              <DeliveryTimeline status={activeDeliveryData.status} timestamps={activeDeliveryData.timestamps} />

              <div className="flex flex-wrap gap-2">
                {activeDeliveryData.status === "ACCEPTED" && (
                  <Button className="flex-1" onClick={() => handleHandToDriver(activeDeliveryData.id)}>
                    Hand to Driver
                  </Button>
                )}

                <Button variant="outline" className="flex-1" onClick={() => setActiveDelivery(null)}>
                  Back to List
                </Button>
              </div>
            </div>

            <div>
              <DeliveryCard
                id={activeDeliveryData.id}
                status={activeDeliveryData.status}
                orderId={activeDeliveryData.orderId}
                restaurant={activeDeliveryData.restaurant}
                customer={activeDeliveryData.customer}
                driver={activeDeliveryData.driver}
                estimatedTime={activeDeliveryData.estimatedTime}
                distance={activeDeliveryData.distance}
                amount={activeDeliveryData.amount}
                createdAt={activeDeliveryData.createdAt}
                viewType="restaurant"
                className="mb-4"
              />

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="font-medium">Order Details</h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {activeDeliveryData.items.map((item: OrderItem, index: number) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span>x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4 space-y-4">
              {filteredDeliveries.filter((d) => d.status === "PENDING").length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No pending deliveries</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDeliveries
                    .filter((d) => d.status === "PENDING")
                    .map((delivery) => (
                      <DeliveryCard
                        key={delivery.id}
                        id={delivery.id}
                        status={delivery.status}
                        orderId={delivery.orderId}
                        restaurant={delivery.restaurant}
                        customer={delivery.customer}
                        driver={delivery.driver}
                        estimatedTime={delivery.estimatedTime}
                        distance={delivery.distance}
                        amount={delivery.amount}
                        createdAt={delivery.createdAt}
                        viewType="restaurant"
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="active" className="mt-4 space-y-4">
              {filteredDeliveries.filter((d) => ["ACCEPTED", "IN_PROGRESS"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No active deliveries</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDeliveries
                    .filter((d) => ["ACCEPTED", "IN_PROGRESS"].includes(d.status))
                    .map((delivery) => (
                      <DeliveryCard
                        key={delivery.id}
                        id={delivery.id}
                        status={delivery.status}
                        orderId={delivery.orderId}
                        restaurant={delivery.restaurant}
                        customer={delivery.customer}
                        driver={delivery.driver}
                        estimatedTime={delivery.estimatedTime}
                        distance={delivery.distance}
                        amount={delivery.amount}
                        createdAt={delivery.createdAt}
                        viewType="restaurant"
                        onViewDetails={handleViewDetails}
                        onPickup={handleHandToDriver}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {filteredDeliveries.filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No completed deliveries</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDeliveries
                    .filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status))
                    .map((delivery) => (
                      <DeliveryCard
                        key={delivery.id}
                        id={delivery.id}
                        status={delivery.status}
                        orderId={delivery.orderId}
                        restaurant={delivery.restaurant}
                        customer={delivery.customer}
                        driver={delivery.driver}
                        estimatedTime={delivery.estimatedTime}
                        distance={delivery.distance}
                        amount={delivery.amount}
                        createdAt={delivery.createdAt}
                        viewType="restaurant"
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
