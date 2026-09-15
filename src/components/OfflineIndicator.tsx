import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { toast } from 'sonner';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! 🎉', {
        description: 'Your connection has been restored',
      });
      setShowIndicator(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline', {
        description: 'Some features may be limited',
        duration: Infinity,
      });
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up md:bottom-4">
      <div className="glass-strong px-4 py-2 rounded-full border border-destructive/50 shadow-lg flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-destructive animate-pulse" />
        <span className="text-sm font-medium text-foreground">Offline Mode</span>
      </div>
    </div>
  );
};
