import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingNotification {
  id: string;
  message: string;
  type: 'xp' | 'profit' | 'loss';
  x: number;
  y: number;
}

export const MicroFeedbackOverlay = memo(() => {
  const [notifications, setNotifications] = useState<FloatingNotification[]>([]);

  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const event = e as CustomEvent;
      const { type, message, x, y } = event.detail;

      const notification: FloatingNotification = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove after animation
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 2000);
    };

    window.addEventListener('micro-feedback', handleCustomEvent);
    return () => window.removeEventListener('micro-feedback', handleCustomEvent);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: notification.x,
              top: notification.y,
            }}
            className={`
              text-2xl font-bold px-4 py-2 rounded-lg shadow-lg
              ${notification.type === 'xp' ? 'text-primary bg-primary/10' : ''}
              ${notification.type === 'profit' ? 'text-green-500 bg-green-500/10' : ''}
              ${notification.type === 'loss' ? 'text-gray-500 bg-gray-500/10' : ''}
            `}
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

MicroFeedbackOverlay.displayName = 'MicroFeedbackOverlay';

// Helper to trigger micro-feedback from anywhere
export const triggerMicroFeedback = (
  type: 'xp' | 'profit' | 'loss',
  message: string,
  x?: number,
  y?: number
) => {
  const event = new CustomEvent('micro-feedback', {
    detail: { type, message, x, y }
  });
  window.dispatchEvent(event);
};
