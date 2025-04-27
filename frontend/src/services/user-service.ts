import api from '@/lib/axios';
import { setCookie } from 'cookies-next';

// Types
export interface CuisineType {
  id: string;
  name: string;
}

export interface RestaurantType {
  id: string;
  type: string;
  capacity: number;
}

export interface VehicleType {
  id: string;
  type: string;
  capacity: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  phone?: string;
  userType: 'admin' | 'customer' | 'restaurant' | 'driver';
}

// Registration types
export interface RegisterCommonData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePictureUrl?: string | null;
}

export interface RestaurantRegistrationData extends RegisterCommonData {
  restaurantName: string;
  licenseNumber: string;
  restaurantTypeId: string;
  cuisineTypeIds: string[];
  operatingHours: Array<{
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
  documents: Array<{
    name: string;
    url: string;
  }>;
  location: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DriverRegistrationData extends RegisterCommonData {
  vehicleTypeId: string;
  licensePlate: string;
  documents: Array<{
    name: string;
    url: string;
  }>;
  location: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CustomerRegistrationData extends RegisterCommonData {
  location?: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
}

// User related API calls
export const userService = {
  // Get the current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/users/me');
    return response.data;
  },

  // Add the getUserById method
  getUserById: async (userId: string): Promise<User> => {
    try {
      const response = await api.get<User>(`/user-service/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },

  // User login
  login: async (email: string, password: string): Promise<any> => {
    try {
      const device = navigator.userAgent;
      
      interface AuthResponse {
        token: string;
        userId: string;
        sessionId: string;
        userType?: string;
      }
      
      const response = await api.post<AuthResponse>('/auth-service/auth/signin', {
        email,
        password,
        device,
        ipAddress: "127.0.0.1"
      });
      
      console.log('Auth response in user-service:', response.data);
      if (response.data.sessionId) {
        console.log('SessionId received:', response.data.sessionId);
      } else {
        console.warn('No sessionId received in response:', response.data);
        console.log('Full response properties:', Object.keys(response.data));
      }
      
      const result = { ...response.data };
      
      try {
        interface UserResponse {
          userType: string;
          [key: string]: any;
        }
        
        const userResponse = await api.get<UserResponse>(`/user-service/users/email/${email}`);
        console.log('User response:', userResponse.data);
        
        if (userResponse.data && userResponse.data.userType) {
          result.userType = userResponse.data.userType.toLowerCase();
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('userType', result.userType);
            localStorage.setItem('sessionId', response.data.sessionId || '');
          }
          
          setCookie('authToken', response.data.token, { maxAge: 30 * 24 * 60 * 60, path: '/' });
          setCookie('userId', response.data.userId, { maxAge: 30 * 24 * 60 * 60, path: '/' });
          setCookie('userType', result.userType, { maxAge: 30 * 24 * 60 * 60, path: '/' });
        }
      } catch (userError) {
        console.error('Error fetching user details:', userError);
      }
      
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/session-service/api/sessions/invalidate');
      console.log('Session invalidated');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userType');
        localStorage.removeItem('sessionId');
      }
      
      document.cookie = 'authToken=; Max-Age=0; path=/;';
      document.cookie = 'userId=; Max-Age=0; path=/;';
      document.cookie = 'userType=; Max-Age=0; path=/;';
    } catch (err) {
      console.error('Error invalidating session:', err);
    }
  },

  getCuisineTypes: async (): Promise<CuisineType[]> => {
    try {
      const response = await api.get<CuisineType[]>('/user-service/cuisine-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching cuisine types:', error);
      throw error;
    }
  },

  getRestaurantTypes: async (): Promise<RestaurantType[]> => {
    const response = await api.get<RestaurantType[]>('/user-service/restaurant-types');
    return response.data;
  },

  getVehicleTypes: async (): Promise<VehicleType[]> => {
    try {
      const response = await api.get<VehicleType[]>('/user-service/vehicle-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      throw error;
    }
  },

  getAdmins: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/user-service/users/type/ADMIN');
      return response.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  },

  getRestaurants: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/user-service/users/type/RESTAURANT');
      return response.data;
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      throw error;
    }
  },

  getDrivers: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/user-service/users/type/DRIVER');
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  getCustomers: async (): Promise<User[]> => {
    try {
      const response = await api.get<User[]>('/user-service/users/type/CUSTOMER');
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  register: async (data: CustomerRegistrationData | RestaurantRegistrationData | DriverRegistrationData, userType: 'customer' | 'restaurant' | 'driver'): Promise<any> => {
    const registrationData: any = {
      email: data.email,
      password: data.password,
      userType: userType.toUpperCase(),
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
        contactNumber: data.phone,
        profilePictureUrl: data.profilePictureUrl || undefined,
      }
    };

    if (userType === 'restaurant' && 'restaurantName' in data) {
      Object.assign(registrationData.profile, {
        restaurantName: data.restaurantName,
        restaurantLicenseNumber: data.licenseNumber,
        restaurantTypeId: data.restaurantTypeId,
        cuisineTypeIds: data.cuisineTypeIds,
        restaurantDocuments: data.documents,
        restaurantAddress: data.location,
        location: data.locationCoordinates,
        openingTime: data.operatingHours.map(hours => ({
          day: hours.day,
          openingTime: hours.openTime,
          closingTime: hours.closeTime,
          isOpen: hours.isOpen
        }))
      });
    } else if (userType === 'driver' && 'vehicleTypeId' in data) {
      Object.assign(registrationData.profile, {
        vehicleTypeId: data.vehicleTypeId,
        vehicleNumber: data.licensePlate,
        vehicleDocuments: data.documents,
        location: data.locationCoordinates
      });
    } else if (userType === 'customer') {
      if ('locationCoordinates' in data && data.locationCoordinates) {
        Object.assign(registrationData.profile, {
          location: data.locationCoordinates
        });
      }
    }

    try {
      try {
        interface EmailExistsResponse {
          exists: boolean;
        }
        const checkResponse = await api.get<EmailExistsResponse>(`/user-service/users/email/${data.email}/exists`);
        if (checkResponse.data && checkResponse.data.exists) {
          throw new Error('This email is already registered. <a href="/sign-in" className="text-blue-600 hover:underline">Sign in instead?</a>');
        }
      } catch (checkError: any) {
        if (checkError.message.includes('This email is already registered')) {
          throw checkError;
        }
      }

      const response = await api.post('/auth-service/auth/signup', registrationData);

      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/sign-in';
      }

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed. Please try again.';

      if (errorMessage.includes('Email already exists') || errorMessage.includes('already in use') || error.response?.status === 409) {
        throw new Error('This email is already registered. <a href="/sign-in" class="text-blue-600 hover:underline">Sign in instead?</a>');
      }

      throw new Error(errorMessage);
    }
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/api/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/api/users/${id}`, userData);
    return response.data;
  },

  updateProfileImage: async (userId: string, imageUrl: string): Promise<User> => {
    const response = await api.put<User>(`/api/users/${userId}/profile-picture`, { profilePictureUrl: imageUrl });
    return response.data;
  },

  deleteUser: async (userId: string, userType: string): Promise<void> => {
    try {
      await api.request({ method: 'DELETE', url: `/user-service/users/${userId}`, data: { userType: userType.toUpperCase() } });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  createRestaurantType: async (restaurantType: Omit<RestaurantType, 'id'>): Promise<RestaurantType> => {
    try {
      const response = await api.post<RestaurantType>('/user-service/restaurant-types', restaurantType);
      return response.data;
    } catch (error) {
      console.error('Error creating restaurant type:', error);
      throw error;
    }
  },

  updateRestaurantType: async (restaurantType: RestaurantType): Promise<RestaurantType> => {
    try {
      const response = await api.put<RestaurantType>(`/user-service/restaurant-types/${restaurantType.id}`, { type: restaurantType.type, capacity: restaurantType.capacity });
      return response.data;
    } catch (error) {
      console.error('Error updating restaurant type:', error);
      throw error;
    }
  },

  deleteRestaurantType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/user-service/restaurant-types/${id}`);
    } catch (error) {
      console.error('Error deleting restaurant type:', error);
      throw error;
    }
  },

  createVehicleType: async (vehicleType: Omit<VehicleType, 'id'>): Promise<VehicleType> => {
    try {
      const response = await api.post<VehicleType>('/user-service/vehicle-types', vehicleType);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle type:', error);
      throw error;
    }
  },

  updateVehicleType: async (vehicleType: VehicleType): Promise<VehicleType> => {
    try {
      const response = await api.put<VehicleType>(`/user-service/vehicle-types/${vehicleType.id}`, { type: vehicleType.type, capacity: vehicleType.capacity });
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle type:', error);
      throw error;
    }
  },

  deleteVehicleType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/user-service/vehicle-types/${id}`);
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      throw error;
    }
  },

  createCuisineType: async (cuisineType: Omit<CuisineType, 'id'>): Promise<CuisineType> => {
    try {
      const response = await api.post<CuisineType>('/user-service/cuisine-types', cuisineType);
      return response.data;
    } catch (error) {
      console.error('Error creating cuisine type:', error);
      throw error;
    }
  },

  updateCuisineType: async (cuisineType: CuisineType): Promise<CuisineType> => {
    try {
      const response = await api.put<CuisineType>(`/user-service/cuisine-types/${cuisineType.id}`, { name: cuisineType.name });
      return response.data;
    } catch (error) {
      console.error('Error updating cuisine type:', error);
      throw error;
    }
  },

  deleteCuisineType: async (id: string): Promise<void> => {
    try {
      await api.delete(`/user-service/cuisine-types/${id}`);
    } catch (error) {
      console.error('Error deleting cuisine type:', error);
      throw error;
    }
  }
};

export default userService;
