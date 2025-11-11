import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UpgradeModal, UpgradeSource, UpgradeIllustration } from '@/components/UpgradeModal';
import { upgradeModalBus } from '@/lib/openUpgradeModal';

interface UpgradeModalConfig {
  source: UpgradeSource;
  title?: string;
  message?: string;
  illustration?: UpgradeIllustration;
  requiredPlan?: 'basic' | 'pro' | 'elite';
  onPlanSelected?: (planId: string) => void;
  onDismiss?: () => void;
}

interface UpgradeModalContextType {
  openModal: (config: UpgradeModalConfig) => void;
  closeModal: () => void;
  isOpen: boolean;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export const UpgradeModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<UpgradeModalConfig | null>(null);

  // Subscribe to global event bus
  useEffect(() => {
    const unsubscribe = upgradeModalBus.subscribe((modalConfig) => {
      openModal(modalConfig);
    });
    return unsubscribe;
  }, []);

  const openModal = (modalConfig: UpgradeModalConfig) => {
    setConfig(modalConfig);
    setIsOpen(true);

    // Fire analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'upgrade_modal_view', {
        source: modalConfig.source,
        required_plan: modalConfig.requiredPlan,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const closeModal = () => {
    // Fire analytics event
    if (typeof window !== 'undefined' && (window as any).gtag && config) {
      (window as any).gtag('event', 'upgrade_modal_dismiss', {
        source: config.source,
        timestamp: new Date().toISOString(),
      });
    }

    if (config?.onDismiss) {
      config.onDismiss();
    }

    setIsOpen(false);
    // Keep config for a moment to allow smooth animation
    setTimeout(() => setConfig(null), 300);
  };

  const handlePlanSelected = (planId: string) => {
    // Fire analytics event
    if (typeof window !== 'undefined' && (window as any).gtag && config) {
      (window as any).gtag('event', 'upgrade_modal_plan_click', {
        source: config.source,
        plan_id: planId,
        timestamp: new Date().toISOString(),
      });
    }

    if (config?.onPlanSelected) {
      config.onPlanSelected(planId);
    }
  };

  return (
    <UpgradeModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      {config && (
        <UpgradeModal
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          source={config.source}
          title={config.title}
          message={config.message}
          illustration={config.illustration}
          requiredPlan={config.requiredPlan}
          onPlanSelected={handlePlanSelected}
        />
      )}
    </UpgradeModalContext.Provider>
  );
};

export const useUpgradeModal = () => {
  const context = useContext(UpgradeModalContext);
  if (context === undefined) {
    throw new Error('useUpgradeModal must be used within UpgradeModalProvider');
  }
  return context;
};
