import { useNavigate } from "react-router-dom";
import { AlertTriangle, Coins, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { COPY } from "@/config/copy";
import { trackUserJourney } from "@/utils/analyticsEvents";

export const UploadCreditsGate = () => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    trackUserJourney.upgradeClicked('upload_blocker_buy_credits');
    navigate('/credits/purchase');
  };

  const handleUpgrade = () => {
    trackUserJourney.upgradeClicked('upload_blocker_upgrade');
    navigate('/upgrade');
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
      <CardHeader className="text-center pb-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <CardTitle className="text-2xl">No Credits Remaining</CardTitle>
        <CardDescription className="text-base">
          Upload screenshots to extract trades automatically with AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-background rounded-lg p-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {COPY.credits.noneRemaining}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-primary" />
            <span>Each upload costs 1 credit and can detect up to 10 trades.</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            <span>Credits never expire.</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleBuyCredits}
            className="w-full"
          >
            <Coins className="w-4 h-4 mr-2" />
            Buy Credits
          </Button>
          <Button 
            size="lg" 
            onClick={handleUpgrade}
            className="w-full"
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Pro users save 60% on credits and get 30 monthly credits included
        </p>
      </CardContent>
    </Card>
  );
};
