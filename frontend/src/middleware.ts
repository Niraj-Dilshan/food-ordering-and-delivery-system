import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// User types for role-based access control
type UserType = 'admin' | 'customer' | 'restaurant' | 'driver';

// Map of routes to the user types that can access them
const PROTECTED_ROUTES: Record<string, UserType> = {
  '/admin': 'admin',
  '/customer': 'customer',
  '/restaurant': 'restaurant',
  '/driver': 'driver',
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/',
  '/about',
  '/contact',
  '/api',
  '/browse',
  '/_next',
  '/favicon.ico',
  '/placeholder.svg',
  '/unauthorized', // Added unauthorized page to public routes
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token and user type from cookies
  const token = request.cookies.get('authToken')?.value;
  const userType = request.cookies.get('userType')?.value?.toLowerCase() as UserType;
  const userId = request.cookies.get('userId')?.value;
  
  // If user has a valid session, redirect to their dashboard when accessing public routes
  // like sign-in, sign-up, or root path
  if (token && userType && userId) {
    if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up') {
      const dashboardUrl = `/${userType}`;
      console.log(`Valid session detected: Redirecting user to ${dashboardUrl}`);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }
  
  // If the user is at the root, redirect them to their appropriate dashboard
  if (pathname === '/' && userType) {
    const dashboardUrl = `/${userType}`;
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }
  
  // Check if trying to access a protected route
  const routePrefix = '/' + pathname.split('/')[1]; // Get first part of path
  const requiredRole = PROTECTED_ROUTES[routePrefix];
  
  // If this is a protected route, check permissions
  if (requiredRole) {
    // If no token or wrong user type, redirect to unauthorized
    if (!token || userType !== requiredRole) {
      console.log(`Unauthorized access attempt to ${pathname}`);
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Check if it's a public route
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // If not public and no token, redirect to sign-in
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}
