import { useLocation } from "wouter";
import { useCallback } from "react";

export function useRoutes() {
  const [location, setLocation] = useLocation();
  
  const navigateTo = useCallback((path: string) => {
    setLocation(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setLocation]);
  
  return {
    currentPath: location,
    navigateTo
  };
}
