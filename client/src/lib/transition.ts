/**
 * Creates a smooth transition overlay for navigation
 * This prevents white flashes when moving between routes
 */
export function createTransitionOverlay() {
  // Create a fixed overlay that covers the entire viewport
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'var(--background)';
  overlay.style.zIndex = '9999';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.transition = 'opacity 80ms ease-out';
  
  // Add to document
  document.body.appendChild(overlay);
  
  // Return the functions to show and hide the overlay
  return {
    // Show the overlay
    show: () => {
      overlay.style.opacity = '0.92';
      overlay.style.pointerEvents = 'all';
    },
    
    // Hide and remove the overlay
    hide: () => {
      overlay.style.opacity = '0';
      
      // Remove after transition completes
      setTimeout(() => {
        try {
          document.body.removeChild(overlay);
        } catch (e) {
          // Overlay might have been removed already
          console.log('Transition overlay already removed');
        }
      }, 100);
    }
  };
}

/**
 * Performs a smooth navigation between routes
 * @param navigate - The navigation function from wouter
 * @param to - Target route
 * @param options - Navigation options
 */
export function smoothNavigate(navigate: (to: string, options?: any) => void, to: string, options?: { replace?: boolean }) {
  // Create transition overlay
  const transition = createTransitionOverlay();
  
  // Show overlay
  transition.show();
  
  // Perform navigation after a minimal delay
  setTimeout(() => {
    navigate(to, options);
    
    // Hide overlay after navigation completes
    setTimeout(() => {
      transition.hide();
    }, 50);
  }, 10);
}