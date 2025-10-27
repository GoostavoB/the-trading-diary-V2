import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, Clock, Hash, Trash2, Upload } from "lucide-react";
import { useBrokerTemplates } from "@/hooks/useBrokerTemplates";
import { formatDistanceToNow } from "date-fns";

interface BrokerTemplateManagerProps {
  onLoadTemplate: (templateId: string, brokerName: string, mappings: Record<string, string>) => void;
  currentBrokerName?: string;
  currentMappings?: Record<string, string>;
  currentHeaders?: string[];
  onSaveRequest?: () => { brokerName: string; mappings: Record<string, string>; headers: string[] };
}

export const BrokerTemplateManager = ({
  onLoadTemplate,
  currentBrokerName,
  currentMappings,
  currentHeaders,
  onSaveRequest
}: BrokerTemplateManagerProps) => {
  const { templates, isLoading, saveTemplate, deleteTemplate } = useBrokerTemplates();
  const [rememberMapping, setRememberMapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async () => {
    if (!currentBrokerName || !currentMappings || !currentHeaders) {
      return;
    }

    setIsSaving(true);
    try {
      await saveTemplate({
        brokerName: currentBrokerName,
        columnMappings: currentMappings,
        sampleHeaders: currentHeaders
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Delete this template? This cannot be undone.')) {
      await deleteTemplate(templateId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save Current Mapping */}
      {currentBrokerName && currentMappings && (
        <Card className="p-4 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-semibold">Save This Mapping</h4>
              <p className="text-sm text-muted-foreground">
                Remember for "{currentBrokerName}"
              </p>
            </div>
            <Button
              onClick={handleSaveTemplate}
              disabled={isSaving || !rememberMapping}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMapping}
              onCheckedChange={(checked) => setRememberMapping(checked as boolean)}
            />
            <label htmlFor="remember" className="text-sm cursor-pointer">
              Remember this mapping for future uploads
            </label>
          </div>
        </Card>
      )}

      {/* Saved Templates */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Saved Templates</h4>
        
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved templates yet. Upload a CSV and save the mapping to create one.
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{template.broker_name}</span>
                        {template.is_global && (
                          <Badge variant="secondary" className="text-xs">Global</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(template.last_used_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {template.usage_count} uses
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadTemplate(
                          template.id,
                          template.broker_name,
                          template.column_mappings
                        )}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      {!template.is_global && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};
