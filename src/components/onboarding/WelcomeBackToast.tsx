import { useEffect } from 'react';
import { toast } from 'sonner';
import { useXPSystem } from '@/hooks/useXPSystem';
import { useWidgetAccess } from '@/hooks/useWidgetAccess';
import { Zap, Trophy } from 'lucide-react';

export function WelcomeBackToast() {
  const { xpData } = useXPSystem();
  const { getNextUnlock } = useWidgetAccess();

  useEffect(() => {
    // Only show once per session
    const hasShownToday = sessionStorage.getItem('welcome_toast_shown');
    if (hasShownToday) return;

    // Wait 2 seconds after page load
    const timer = setTimeout(() => {
      const nextWidget = getNextUnlock();
      
      if (nextWidget && xpData) {
        const requirement = xpData.totalXPEarned || 0;
        const xpNeeded = Math.max(0, 1000 - requirement); // Simplified for demo
        
        if (xpNeeded > 0 && xpNeeded < 1000) {
          toast.info(
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold mb-1">Welcome back!</p>
                <p className="text-sm text-muted-foreground">
                  You're <span className="font-semibold text-primary">{xpNeeded} XP</span> away from unlocking <span className="font-semibold">{nextWidget.title}</span>
                </p>
              </div>
            </div>,
            {
              duration: 5000,
              icon: <Zap className="w-5 h-5 text-primary" />,
            }
          );
          
          sessionStorage.setItem('welcome_toast_shown', 'true');
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [xpData, getNextUnlock]);

  return null;
}
