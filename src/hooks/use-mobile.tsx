import { useState, useEffect, useCallback } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    setIsMobile(width < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  return isMobile;
}