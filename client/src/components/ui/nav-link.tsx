import { useCallback } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useRouteTransition } from "@/hooks/use-route-transition";

interface NavLinkProps {
  href: string;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function NavLink({
  href,
  className,
  activeClassName,
  onClick,
  children,
  ...props
}: NavLinkProps & React.HTMLAttributes<HTMLAnchorElement>) {
  const [location] = useLocation();
  const { navigateWithTransition } = useRouteTransition();
  // Fix for exact matches and subpaths
  const isActive = 
    location === href || 
    // Special case for dashboard
    (href === '/' && location === '/') ||
    // For subpaths (like /students/*)
    (href !== '/' && location.startsWith(href));
  
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      
      // For debugging
      console.log(`NavLink clicked: ${href}`);
      
      // Call any onClick handlers passed to the component
      if (onClick) onClick();
      
      // Always navigate even if already on the same route
      // This forces re-render of components when clicking the same nav item twice
      if (href !== "#") {
        // Force reload by navigating through transition
        // We force this even if we're already on this page for re-rendering
        navigateWithTransition(href);
        
        // Additional logging to track navigation
        console.log(`Navigating to: ${href}`);
      }
    },
    [href, navigateWithTransition, onClick]
  );

  return (
    <a
      href={href}
      className={cn(
        className, 
        isActive && activeClassName,
        'transition-colors duration-200'
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}