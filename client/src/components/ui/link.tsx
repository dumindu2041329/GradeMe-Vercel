import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useRouteTransition } from '@/hooks/use-route-transition';
import { useCallback } from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  activeClassName?: string;
  prefetch?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Link({
  href,
  className,
  activeClassName,
  onClick,
  children,
  ...props
}: LinkProps) {
  const [location] = useLocation();
  const { navigateWithTransition } = useRouteTransition();
  const isActive = location === href;
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Call any custom onClick handlers
    if (onClick) onClick();
    
    // Use the transition navigation
    if (location !== href) {
      navigateWithTransition(href);
    }
  }, [onClick, href, location, navigateWithTransition]);
  
  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        className,
        isActive && activeClassName,
        'transition-colors duration-200'
      )}
      {...props}
    >
      {children}
    </a>
  );
}