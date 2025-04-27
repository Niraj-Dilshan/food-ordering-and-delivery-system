import api from '@/lib/axios';

export interface DeliveryStatus {
  PENDING: 'PENDING';
  ACCEPTED: 'ACCEPTED';
  IN_PROGRESS: 'IN_PROGRESS';
  DELIVERED: 'DELIVERED';
  CANCELLED: 'CANCELLED';
}

export interface IDelivery {
  _id?: string;
  orderId: string;
  driverId?: string;
  status: keyof DeliveryStatus;
  acceptedAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderDetails {
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
  [key: string]: unknown;
}

/**
 * Get all deliveries
 */
export const getAllDeliveries = async (): Promise<IDelivery[]> => {
  try {
    const response = await api.get<IDelivery[]>('/delivery-service/', {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch deliveries:', error);
    throw new Error('Failed to fetch deliveries');
  }
};

/**
 * Get deliveries for a specific customer
 */
export const getDeliveriesByCustomerId = async (customerId: string): Promise<IDelivery[]> => {
  try {
    const response = await api.get<IDelivery[]>(`/delivery-service/customer/${customerId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch customer deliveries:', error);
    throw new Error('Failed to fetch customer deliveries');
  }
};

/**
 * Get deliveries for a specific driver
 */
export const getDeliveriesByDriverId = async (driverId: string): Promise<IDelivery[]> => {
  try {
    const response = await api.get<IDelivery[]>(`/delivery-service/driver/${driverId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch driver deliveries:', error);
    throw new Error('Failed to fetch driver deliveries');
  }
};

/**
 * Get deliveries for a specific restaurant
 */
export const getDeliveriesByRestaurantId = async (restaurantId: string): Promise<IDelivery[]> => {
  try {
    console.log(`Fetching deliveries for restaurant ID: ${restaurantId}`);
    const apiUrl = `/delivery-service/restaurant/${restaurantId}`;
    
    // Log axios configuration for debugging
    console.log('Axios config:', {
      baseURL: api.defaults.baseURL,
      headers: api.defaults.headers,
      timeout: api.defaults.timeout
    });
    
    // Include credentials for authentication cookies
    const response = await api.get<IDelivery[]>(apiUrl, {
      withCredentials: true,
      // Try to bypass cache to get fresh data
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Restaurant deliveries response:', response);
    return response.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Failed to fetch restaurant deliveries:', error);
    
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    throw new Error(`Failed to fetch restaurant deliveries: ${error.message}`);
  }
};

/**
 * Get a specific delivery by ID
 */
export const getDeliveryById = async (deliveryId: string): Promise<IDelivery> => {
  try {
    const response = await api.get<IDelivery>(`/delivery-service/${deliveryId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch delivery:', error);
    throw new Error('Failed to fetch delivery');
  }
};

/**
 * Get delivery with order details
 */
export const getDeliveryWithOrderDetails = async (deliveryId: string): Promise<{ delivery: IDelivery; order: OrderDetails }> => {
  try {
    const response = await api.get<{ delivery: IDelivery; order: OrderDetails }>(`/delivery-service/${deliveryId}/with-order`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch delivery with order details:', error);
    throw new Error('Failed to fetch delivery with order details');
  }
};

/**
 * Create a new delivery
 */
export const createDelivery = async (deliveryData: Partial<IDelivery>): Promise<IDelivery> => {
  try {
    const response = await api.post<IDelivery>('/delivery-service/', deliveryData);
    return response.data;
  } catch (error) {
    console.error('Failed to create delivery:', error);
    throw new Error('Failed to create delivery');
  }
};

/**
 * Update a delivery
 */
export const updateDelivery = async (
  deliveryId: string, 
  updateData: Partial<IDelivery>
): Promise<IDelivery> => {
  try {
    const response = await api.put<IDelivery>(`/delivery-service/${deliveryId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Failed to update delivery:', error);
    throw new Error('Failed to update delivery');
  }
};

/**
 * Delete a delivery
 */
export const deleteDelivery = async (deliveryId: string): Promise<void> => {
  try {
    await api.delete(`/delivery-service/${deliveryId}`);
  } catch (error) {
    console.error('Failed to delete delivery:', error);
    throw new Error('Failed to delete delivery');
  }
}; 