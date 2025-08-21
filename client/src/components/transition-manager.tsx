import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

// State for tracking mounted pages
const mountedPages = new Set<string>();

interface TransitionManagerProps {
  children: React.ReactNode;
  location: string;
}

export function TransitionManager({ children, location }: TransitionManagerProps) {
  const [currentPage, setCurrentPage] = useState<React.ReactNode>(children);
  const [prevLocation, setPrevLocation] = useState<string>(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track mounted state for smoother transitions
  useEffect(() => {
    // Add current location to mounted pages
    mountedPages.add(location);
    
    // If location changed, handle transition
    if (location !== prevLocation) {
      // Start transition
      setIsTransitioning(true);
      
      // Keep the previous page visible during transition
      // Schedule update for next frame to ensure smooth transition
      requestAnimationFrame(() => {
        // Update with new children but keep transition state
        setCurrentPage(children);
        
        // Complete transition in next frame for smooth effect
        requestAnimationFrame(() => {
          setIsTransitioning(false);
          setPrevLocation(location);
        });
      });
    } else {
      // Same location, just update content
      setCurrentPage(children);
    }
    
    // Cleanup function to track unmounted pages
    return () => {};
  }, [children, location, prevLocation]);
  
  return (
    <div 
      className={`transition-page ${isTransitioning ? 'transitioning' : ''}`}
      style={{
        opacity: isTransitioning ? 0.98 : 1,
        transition: 'opacity 60ms ease-out',
        backgroundColor: 'var(--background)',
        minHeight: '100vh',
      }}
    >
      {currentPage}
    </div>
  );
}

// Hook for global navigation with transition
export function useTransitionLocation() {
  const [location, navigate] = useLocation();
  
  const smoothNavigate = (to: string, options?: { replace?: boolean }) => {
    // Pre-mount the target page before navigation
    mountedPages.add(to);
    
    // Perform the navigation in the next frame for smoother transition
    requestAnimationFrame(() => {
      navigate(to, options);
    });
  };
  
  return [location, smoothNavigate] as const;
}