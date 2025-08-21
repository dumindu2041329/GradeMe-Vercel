import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [location] = useLocation();
  const prevLocationRef = useRef(location);
  
  // Optimized transition system
  useEffect(() => {
    // Skip transition for first render
    if (prevLocationRef.current === location) {
      setDisplayChildren(children);
      return;
    }
    
    // For navigation changes, use optimized transition
    const transitionIn = () => {
      // Pre-load the new page content but keep it hidden
      setDisplayChildren(children);
      
      // Ensure browser has committed the new content before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Remove transition effect
          setIsTransitioning(false);
          prevLocationRef.current = location;
        });
      });
    };
    
    // Start the transition out
    setIsTransitioning(true);
    
    // Use a very minimal delay before transitioning in
    // This creates a smoother effect with no visible flashing
    const timer = setTimeout(transitionIn, 30);
    
    return () => clearTimeout(timer);
  }, [location, children]);

  return (
    <div 
      className={`page-transition ${isTransitioning ? "transitioning" : ""}`}
    >
      {displayChildren}
    </div>
  );
}