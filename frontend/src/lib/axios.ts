import axios from 'axios';

// Base URL for all API requests
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

// Create Axios instance with default configuration
const api = axios.create({
  baseURL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies with cross-origin requests
});

// Request interceptor to attach the auth token
api.interceptors.request.use((config) => {
  // Get the token from localStorage if in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  // Always include Accept header for JSON responses
  if (config.headers) {
    config.headers.Accept = 'application/json';
  }
  
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    data: config.data
  });
  
  return config;
}, (error) => {
  // Handle request errors
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Network errors handling (server down, connection refused, etc)
    if (error.message === 'Network Error') {
      console.error('Network error detected:', error);
      // You could implement special handling for network errors here
      // For example, notification to user that the server is unreachable
    }
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out:', error);
      return Promise.reject({
        ...error,
        message: 'The request timed out. Please try again later.'
      });
    }
    
    // If 401 Unauthorized error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Here you could attempt to refresh the token
        // const refreshToken = localStorage.getItem('refreshToken');
        // const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        // localStorage.setItem('authToken', res.data.accessToken);
        
        // Return original request with new token
        // originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        // return api(originalRequest);
        
        // For now, just redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/sign-in';
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          window.location.href = '/sign-in';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // Handle API errors with proper messages
    if (error.response) {
      // The server responded with a status code outside of 2xx range
      console.error('API error response:', error.response.status, error.response.data);
      
      // You could handle different status codes differently
      switch (error.response.status) {
        case 404:
          error.userMessage = 'The requested resource was not found.';
          break;
        case 403:
          error.userMessage = 'You do not have permission to access this resource.';
          break;
        case 500:
          error.userMessage = 'An internal server error occurred. Please try again later.';
          break;
        default:
          error.userMessage = error.response.data?.message || 
                             'An error occurred with the API request.';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;