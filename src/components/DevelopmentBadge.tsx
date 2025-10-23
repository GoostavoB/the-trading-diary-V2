import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { Hammer } from "lucide-react";

export const DevelopmentBadge = () => {
  const { t } = useTranslation();
  
  return (
    <Badge variant="development" className="gap-1">
      <Hammer className="h-3 w-3" />
      {t('common.inDevelopment')}
    </Badge>
  );
};
