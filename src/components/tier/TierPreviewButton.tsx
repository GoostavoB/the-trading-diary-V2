import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTierPreview } from '@/hooks/useTierPreview';

export const TierPreviewButton = () => {
  const navigate = useNavigate();
  const { currentTierInfo, nextTierInfo, progressToNextTier } = useTierPreview();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        onClick={() => navigate('/tier-preview')}
        variant="outline"
        className="w-full justify-between group hover:bg-primary/5 hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: currentTierInfo.color }}
          >
            <Trophy size={16} className="text-primary-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{currentTierInfo.name}</p>
            {nextTierInfo && (
              <p className="text-xs text-muted-foreground">
                {Math.round(progressToNextTier)}% to {nextTierInfo.name}
              </p>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>
    </motion.div>
  );
};
