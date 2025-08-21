import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';

// Cache for preloaded routes
const preloadedRoutes = new Set<string>();

// Track route changes and provide instant transitions
export function useRouteTransition() {
  const [location, navigate] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousLocation = useRef(location);
  
  // Monitor route changes to handle transitions
  useEffect(() => {
    // When location changes, briefly mark as transitioning
    if (previousLocation.current !== location) {
      // Almost immediately finish transitioning
      previousLocation.current = location;
      
      // Preload adjacent routes for faster navigation next time
      preloadAdjacentRoutes();
    }
  }, [location]);
  
  // Preload adjacent routes
  const preloadAdjacentRoutes = useCallback(() => {
    // Only include admin routes (student dashboard has been removed)
    const adminRoutes = ["/", "/exams", "/students", "/results", "/profile", "/"];
    const allRoutes = adminRoutes;
    
    allRoutes.forEach(route => {
      if (route !== location && !preloadedRoutes.has(route)) {
        // Mark as preloaded
        preloadedRoutes.add(route);
        
        // Trigger a non-rendering navigation request to preload
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      }
    });
  }, [location]);
  
  // Virtually instant navigation with no delay
  const navigateWithTransition = useCallback((to: string) => {
    // For debugging
    console.log(`useRouteTransition navigating to: ${to}`);
    console.log(`Current location: ${location}`);
    
    // Always force navigation, even to the same route
    // This is crucial for re-rendering components when clicking on an already active link
    if (to === location) {
      // If navigating to the same location, force a re-render by using
      // a temporary different URL and then the actual URL
      console.log("Same location detected, forcing re-navigation");
      
      // Using a promise to create sequence of navigation events
      Promise.resolve()
        .then(() => {
          // First navigate to a dummy location to force change
          navigate("/nav-transition-temp", { replace: true });
        })
        .then(() => {
          // Then navigate to the actual target after a small delay
          setTimeout(() => {
            navigate(to, { replace: true });
            console.log(`Navigation completed to: ${to}`);
          }, 10);
        });
    } else {
      // Normal navigation to a different route
      navigate(to);
      console.log(`Normal navigation to: ${to}`);
    }
  }, [location, navigate]);
  
  return {
    isTransitioning: false, // Always false for instant navigation
    navigateWithTransition,
    currentLocation: location
  };
}