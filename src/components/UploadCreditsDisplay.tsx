import { useUploadCredits } from '@/hooks/useUploadCredits';
import { Upload, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Progress } from './ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export const UploadCreditsDisplay = () => {
  const { balance, limit, canUpload, isLoading } = useUploadCredits();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  const percentageUsed = limit > 0 ? ((limit - balance) / limit) * 100 : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 px-4 py-2 bg-card border rounded-lg">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {balance} / {limit}
                </span>
                <span className="text-xs text-muted-foreground">
                  Upload Credits
                </span>
              </div>
            </div>
            <div className="w-24">
              <Progress value={100 - percentageUsed} className="h-2" />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Buy
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Each image analysis uses 1 credit</p>
            <p>Each image can detect up to 10 trades</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extra credits: $2 for 10 uploads
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
