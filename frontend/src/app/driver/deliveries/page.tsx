"use client"

import { useState, useEffect } from "react"
import { DeliveryCard } from "@/components/ui/delivery-card"
import { DeliveryRequestModal } from "@/components/ui/delivery-request-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DeliveryStatus } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { DeliveryMap } from "@/components/ui/delivery-map"
import { 
  getDeliveriesByDriverId, 
  updateDelivery, 
  IDelivery, 
  getDeliveryWithOrderDetails, 
  OrderDetails 
} from "@/services/delivery-service"
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
  customerName?: string;
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
  cartItems?: Array<{
    itemName?: string;
    quantity?: number;
  }>;
}

export default function DriverDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<UIDelivery[]>([])
  const [activeDelivery, setActiveDelivery] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newDeliveryRequest, setNewDeliveryRequest] = useState<UIDelivery | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [driverName, setDriverName] = useState<string>("Driver")
  const [driverPhone, setDriverPhone] = useState<string>("")
  const [driverVehicle, setDriverVehicle] = useState<string>("")

  // Get user ID from cookies or localStorage
  useEffect(() => {
    // Try to get from cookie first (for SSR)
    const cookieUserId = getCookie('userId')?.toString();
    
    // Otherwise try localStorage (client-side only)
    const localStorageUserId = typeof window !== 'undefined' 
      ? localStorage.getItem('userId')
      : null;
    
    setUserId(cookieUserId || localStorageUserId);
    
    // Get driver info if available
    if (typeof window !== 'undefined') {
      const firstName = localStorage.getItem('firstName');
      const lastName = localStorage.getItem('lastName');
      if (firstName || lastName) {
        setDriverName(`${firstName || ''} ${lastName || ''}`.trim());
      }
      
      // Get additional driver info
      const phone = localStorage.getItem('phone');
      if (phone) setDriverPhone(phone);
      
      const vehicle = localStorage.getItem('vehicle');
      if (vehicle) setDriverVehicle(vehicle);
    }
  }, []);

  useEffect(() => {
    const fetchDeliveries = async () => {
      if (userId) {
        try {
          setLoading(true);
          const driverId = userId;
          const apiDeliveries = await getDeliveriesByDriverId(driverId);
          
          // Transform data to match the UI requirements
          const transformedData = await Promise.all(apiDeliveries.map(async (delivery: IDelivery) => {
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
            
            // Get driver location from order details or use a fallback
            const driverLocation = { 
              lat: orderDetails?.driverLocation?.latitude || 40.72, 
              lng: orderDetails?.driverLocation?.longitude || -74.0 
            };
            
            // Create formatted order items
            const items: OrderItem[] = orderDetails?.cartItems?.map(item => ({
              name: (typeof item.itemName === 'string' && item.itemName) || "Unknown item",
              quantity: typeof item.quantity === 'number' ? item.quantity : 1
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
                name: orderDetails?.customerName || "Customer",
                address: orderDetails?.customerDetails?.address || "Address unavailable",
                phone: orderDetails?.customerPhone || "Phone unavailable",
                location: customerLocation,
              },
              driver: {
                name: driverName,
                phone: driverPhone,
                vehicle: driverVehicle || "Vehicle unavailable",
              },
              driverLocation,
              estimatedTime,
              distance,
              amount: orderAmount,
              items,
              createdAt,
            } as UIDelivery;
          }));
          
          setDeliveries(transformedData);
        } catch (error) {
          console.error("Failed to fetch deliveries:", error);
          setDeliveries([]);
        } finally {
          setLoading(false);
        }
      } else {
        setDeliveries([]);
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [userId, driverName, driverPhone, driverVehicle]);

  const refreshDeliveries = () => {
    if (userId) {
      // Refetch deliveries after an action
      getDeliveriesByDriverId(userId)
        .then(() => {
          // We'd need to transform the data again here
          // For simplicity, we're just calling the entire useEffect logic
          const driverIdValue = userId;
          if (driverIdValue) {
            setUserId(null);
            setTimeout(() => setUserId(driverIdValue), 10);
          }
        })
        .catch((error) => {
          console.error("Failed to refresh deliveries:", error);
        });
    }
  };

  const handleAcceptDelivery = async (id: string) => {
    if (!userId || !newDeliveryRequest) return;
    
    try {
      setShowRequestModal(false);
      
      // Update the delivery status in the backend
      await updateDelivery(id, {
        status: "ACCEPTED",
        driverId: userId,
      });
      
      // Add to local state (optimistic update)
      setDeliveries(prev => [...prev, {...newDeliveryRequest, status: "ACCEPTED" as DeliveryStatus}]);
      setActiveDelivery(id);
      
      // Refresh deliveries after a short delay
      setTimeout(refreshDeliveries, 1000);
    } catch (error) {
      console.error("Failed to accept delivery:", error);
      alert("Failed to accept delivery. Please try again.");
    }
  };

  const handleDeclineDelivery = () => {
    setShowRequestModal(false);
    setNewDeliveryRequest(null);
  };

  const handlePickupDelivery = async (id: string) => {
    try {
      // Update delivery status in the backend
      await updateDelivery(id, {
        status: "IN_PROGRESS",
      });
      
      // Update local state (optimistic update)
      setDeliveries(
        deliveries.map((delivery) =>
          delivery.id === id ? { ...delivery, status: "IN_PROGRESS" as DeliveryStatus } : delivery,
        ),
      );
      
      // Refresh deliveries after action
      setTimeout(refreshDeliveries, 1000);
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      alert("Failed to update delivery status. Please try again.");
    }
  };

  const handleDeliverDelivery = async (id: string) => {
    try {
      // Update delivery status in the backend
      await updateDelivery(id, {
        status: "DELIVERED",
      });
      
      // Update local state (optimistic update)
      setDeliveries(
        deliveries.map((delivery) =>
          delivery.id === id ? { ...delivery, status: "DELIVERED" as DeliveryStatus } : delivery,
        ),
      );
      
      // Refresh deliveries after action
      setTimeout(refreshDeliveries, 1000);
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      alert("Failed to update delivery status. Please try again.");
    }
  };

  const handleCancelDelivery = async (id: string) => {
    try {
      // Update delivery status in the backend
      await updateDelivery(id, {
        status: "CANCELLED",
      });
      
      // Update local state (optimistic update)
      setDeliveries(
        deliveries.map((delivery) =>
          delivery.id === id ? { ...delivery, status: "CANCELLED" as DeliveryStatus } : delivery,
        ),
      );
      
      // Refresh deliveries after action
      setTimeout(refreshDeliveries, 1000);
    } catch (error) {
      console.error("Failed to update delivery status:", error);
      alert("Failed to update delivery status. Please try again.");
    }
  };

  const handleViewDetails = (id: string) => {
    setActiveDelivery(id);
  };

  const handleSimulateNewRequest = async () => {
    try {
      // In a real app, pending deliveries would be pushed to the driver
      // Here we'll fetch pending deliveries from the API
      const pendingDeliveries = await fetch('/api/delivery-service/pending')
        .then(res => res.json())
        .catch(() => null);
      
      // If we have real pending deliveries, use the first one
      if (pendingDeliveries?.length > 0) {
        // Fetch full details for the delivery
        const deliveryDetails = await getDeliveryWithOrderDetails(pendingDeliveries[0]._id);
        const orderDetails = deliveryDetails.order as ExtendedOrderDetails;
        const delivery = deliveryDetails.delivery;
        
        // Transform to UI format
        const pendingDelivery: UIDelivery = {
          id: delivery._id || `sim-${Date.now()}`,
          status: "PENDING" as DeliveryStatus,
          orderId: delivery.orderId,
          restaurant: {
            name: orderDetails?.restaurantName || "Restaurant",
            address: orderDetails?.restaurantAddress || "Address unavailable",
            phone: orderDetails?.restaurantPhone || "Phone unavailable",
            location: { 
              lat: orderDetails?.restaurantDetails?.location?.latitude || 40.7128, 
              lng: orderDetails?.restaurantDetails?.location?.longitude || -74.006 
            },
          },
          customer: {
            name: orderDetails?.customerName || "Customer",
            address: orderDetails?.customerDetails?.address || "Address unavailable",
            phone: orderDetails?.customerPhone || "Phone unavailable",
            location: { 
              lat: orderDetails?.customerDetails?.latitude || 40.7282, 
              lng: orderDetails?.customerDetails?.longitude || -73.9942 
            },
          },
          driverLocation: { 
            lat: 40.72, // Driver's current location would come from GPS
            lng: -74.0 
          },
          estimatedTime: orderDetails?.estimatedDeliveryTime || "20 min",
          distance: orderDetails?.distance || "2.5 mi",
          amount: orderDetails?.totalAmount?.toString() || "10.50",
          items: orderDetails?.cartItems?.map(item => ({
            name: (typeof item.itemName === 'string' && item.itemName) || "Unknown item",
            quantity: typeof item.quantity === 'number' ? item.quantity : 1
          })) || [],
          createdAt: delivery.createdAt || new Date().toISOString(),
        };
        
        setNewDeliveryRequest(pendingDelivery);
        setShowRequestModal(true);
        return;
      }
      
      // Fallback to simulated data if no pending deliveries are available
      const simulatedRequest: UIDelivery = {
        id: `sim-${Date.now()}`,
        status: "PENDING" as DeliveryStatus,
        orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
        restaurant: {
          name: "Simulation Restaurant",
          address: "123 Test St, New York, NY",
          phone: "555-123-4567",
          location: { lat: 40.7128, lng: -74.006 },
        },
        customer: {
          name: "Test Customer",
          address: "456 Demo Ave, New York, NY",
          phone: "555-987-6543",
          location: { lat: 40.7282, lng: -73.9942 },
        },
        driverLocation: { lat: 40.72, lng: -74.0 },
        estimatedTime: "20 min",
        distance: "2.5 mi",
        amount: "10.50",
        items: [
          { name: "Test Item 1", quantity: 2 },
          { name: "Test Item 2", quantity: 1 },
        ],
        createdAt: new Date().toISOString(),
      };
      
      setNewDeliveryRequest(simulatedRequest);
      setShowRequestModal(true);
    } catch (error) {
      console.error("Error fetching pending deliveries:", error);
      alert("Could not fetch pending deliveries. Using simulated data instead.");
      
      // Fallback to simulated data
      const simulatedRequest: UIDelivery = {
        id: `sim-${Date.now()}`,
        status: "PENDING" as DeliveryStatus,
        orderId: `ORD-${Math.floor(Math.random() * 10000)}`,
        restaurant: {
          name: "Simulation Restaurant",
          address: "123 Test St, New York, NY",
          phone: "555-123-4567",
          location: { lat: 40.7128, lng: -74.006 },
        },
        customer: {
          name: "Test Customer",
          address: "456 Demo Ave, New York, NY",
          phone: "555-987-6543",
          location: { lat: 40.7282, lng: -73.9942 },
        },
        driverLocation: { lat: 40.72, lng: -74.0 },
        estimatedTime: "20 min",
        distance: "2.5 mi",
        amount: "10.50",
        items: [
          { name: "Test Item 1", quantity: 2 },
          { name: "Test Item 2", quantity: 1 },
        ],
        createdAt: new Date().toISOString(),
      };
      
      setNewDeliveryRequest(simulatedRequest);
      setShowRequestModal(true);
    }
  };

  const activeDeliveryData = deliveries.find((delivery) => delivery.id === activeDelivery);

  if (loading) {
    return (
      <>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading deliveries...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Active Deliveries</h1>
          <Button onClick={handleSimulateNewRequest}>Simulate New Request</Button>
        </div>

        {activeDelivery && activeDeliveryData ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <DeliveryMap
                driverLocation={{
                  lat: activeDeliveryData.driverLocation.lat,
                  lng: activeDeliveryData.driverLocation.lng,
                  label: "You",
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
                className="h-[400px]"
              />

              <div className="flex flex-wrap gap-2">
                {activeDeliveryData.status === "ACCEPTED" && (
                  <>
                    <Button className="flex-1" onClick={() => handlePickupDelivery(activeDeliveryData.id)}>
                      Mark as Picked Up
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCancelDelivery(activeDeliveryData.id)}
                    >
                      Cancel Delivery
                    </Button>
                  </>
                )}

                {activeDeliveryData.status === "IN_PROGRESS" && (
                  <Button className="flex-1" onClick={() => handleDeliverDelivery(activeDeliveryData.id)}>
                    Mark as Delivered
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
                viewType="driver"
                className="mb-4"
              />

              <div className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="font-medium">Order Details</h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {activeDeliveryData.items.length > 0 ? (
                      activeDeliveryData.items.map((item, index) => (
                        <li key={index} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>x{item.quantity}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">No items available</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4 space-y-4">
              {deliveries.filter((d) => ["ACCEPTED", "IN_PROGRESS"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No active deliveries</p>
                  <p className="text-xs text-muted-foreground">New delivery requests will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {deliveries
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
                        viewType="driver"
                        onViewDetails={handleViewDetails}
                        onPickup={handlePickupDelivery}
                        onDeliver={handleDeliverDelivery}
                        onCancel={handleCancelDelivery}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {deliveries.filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status)).length === 0 ? (
                <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border">
                  <p className="text-muted-foreground">No completed deliveries</p>
                  <p className="text-xs text-muted-foreground">Completed deliveries will appear here</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {deliveries
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
                        viewType="driver"
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {newDeliveryRequest && (
        <DeliveryRequestModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          delivery={newDeliveryRequest}
          onAccept={handleAcceptDelivery}
          onDecline={handleDeclineDelivery}
        />
      )}
    </>
  );
}
