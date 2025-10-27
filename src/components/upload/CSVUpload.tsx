import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { ExtractedTrade } from "@/types/trade";
import { CSVColumnMapper } from "./CSVColumnMapper";
import { BrokerTemplateManager } from "./BrokerTemplateManager";
import { CSVPreviewWithEdit } from "./CSVPreviewWithEdit";
import { CSVPreviewSummary } from "./CSVPreviewSummary";
import { BrokerSelect } from "./BrokerSelect";
import { EnhancedFileUpload } from "./EnhancedFileUpload";
import { toast } from "sonner";
import { useBrokerTemplates } from "@/hooks/useBrokerTemplates";
import { findBestTemplateMatch } from "@/utils/csvAutoMapper";
import { detectFileType, parseSpreadsheet, parseFlexibleNumber } from "@/utils/parseSpreadsheet";

interface CSVUploadProps {
  onTradesExtracted: (trades: ExtractedTrade[]) => void;
}

type UploadStep = 'upload' | 'mapping' | 'preview';

export const CSVUpload = ({ onTradesExtracted }: CSVUploadProps) => {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [mappedTrades, setMappedTrades] = useState<ExtractedTrade[]>([]);
  const [detectedTemplate, setDetectedTemplate] = useState<{ id: string; name: string } | null>(null);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  
  const { templates, incrementUsage, saveTemplate } = useBrokerTemplates();

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    
    // Robust file type detection
    const fileType = await detectFileType(file);
    
    if (fileType === 'excel') {
      // Show helpful message if file is mislabeled
      if (file.name.toLowerCase().endsWith('.csv')) {
        toast.info("Detected Excel content in CSV file - parsing as spreadsheet...");
      } else {
        toast.info("Parsing Excel file...");
      }
      
      try {
        const result = await parseSpreadsheet(file);
        const { headers, rows } = result;

        setCsvHeaders(headers);
        setCsvData(rows);

        // Try to find matching template
        const match = findBestTemplateMatch(headers, templates);
        
        if (match && match.similarity >= 80) {
          setDetectedTemplate({ id: match.templateId, name: match.brokerName });
          const template = templates.find(t => t.id === match.templateId);
          
          if (template) {
            toast.success(`Recognized as ${match.brokerName}! Auto-loading mapping...`);
            setColumnMappings(template.column_mappings);
            setSelectedBroker(match.brokerName);
            incrementUsage(match.templateId);
            
            // Skip to preview
            const trades = applyMappingToData(rows, template.column_mappings);
            setMappedTrades(trades);
            setSelectedTrades(new Set(trades.map((_, idx) => idx)));
            setCurrentStep('preview');
          }
        } else {
          toast.info("New Excel format detected - let's map the columns");
          setCurrentStep('mapping');
        }
      } catch (error) {
        toast.error("Failed to parse Excel file: " + (error instanceof Error ? error.message : 'Unknown error'));
        console.error(error);
      }
    } else {
      // CSV file
      toast.info("Parsing CSV file...");

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            // Check if this might actually be an Excel file with .csv extension
            const hasNonTextError = results.errors.some(e => 
              e.message.includes('invalid') || e.message.includes('byte')
            );
            
            if (hasNonTextError) {
              toast.info("CSV parser failed - trying Excel parser...");
              // Retry as Excel
              parseSpreadsheet(file)
                .then(result => {
                  const { headers, rows } = result;
                  setCsvHeaders(headers);
                  setCsvData(rows);
                  
                  const match = findBestTemplateMatch(headers, templates);
                  if (match && match.similarity >= 80) {
                    setDetectedTemplate({ id: match.templateId, name: match.brokerName });
                    const template = templates.find(t => t.id === match.templateId);
                    if (template) {
                      toast.success(`Recognized as ${match.brokerName}! Auto-loading mapping...`);
                      setColumnMappings(template.column_mappings);
                      setSelectedBroker(match.brokerName);
                      incrementUsage(match.templateId);
                      const trades = applyMappingToData(rows, template.column_mappings);
                      setMappedTrades(trades);
                      setSelectedTrades(new Set(trades.map((_, idx) => idx)));
                      setCurrentStep('preview');
                    }
                  } else {
                    toast.info("File parsed successfully - let's map the columns");
                    setCurrentStep('mapping');
                  }
                })
                .catch(excelError => {
                  toast.error("Failed to parse file with both CSV and Excel parsers");
                  console.error('CSV errors:', results.errors);
                  console.error('Excel error:', excelError);
                });
              return;
            }
            
            toast.error("Failed to parse CSV file");
            console.error(results.errors);
            return;
          }

          const headers = results.meta.fields || [];
          const data = results.data as Record<string, any>[];

          setCsvHeaders(headers);
          setCsvData(data);

          // Try to find matching template
          const match = findBestTemplateMatch(headers, templates);
          
          if (match && match.similarity >= 80) {
            setDetectedTemplate({ id: match.templateId, name: match.brokerName });
            const template = templates.find(t => t.id === match.templateId);
            
            if (template) {
              toast.success(`Recognized as ${match.brokerName}! Auto-loading mapping...`);
              setColumnMappings(template.column_mappings);
              setSelectedBroker(match.brokerName);
              incrementUsage(match.templateId);
              
              // Skip to preview
              const trades = applyMappingToData(data, template.column_mappings);
              setMappedTrades(trades);
              setSelectedTrades(new Set(trades.map((_, idx) => idx)));
              setCurrentStep('preview');
            }
          } else {
            toast.info("New CSV format detected - let's map the columns");
            setCurrentStep('mapping');
          }
        },
        error: () => {
          toast.error("Failed to read file");
        }
      });
    }
  }, [templates, incrementUsage]);

  const applyMappingToData = (data: Record<string, any>[], mappings: Record<string, string>): ExtractedTrade[] => {
    return data.map(row => {
      const trade: Partial<ExtractedTrade> = {};
      
      Object.entries(mappings).forEach(([tradeField, csvColumn]) => {
        const value = row[csvColumn];
        
        // Type conversions with robust parsing
        if (['entry_price', 'exit_price', 'position_size', 'leverage', 'funding_fee', 'trading_fee', 'margin', 'profit_loss', 'roi'].includes(tradeField)) {
          (trade as any)[tradeField] = parseFlexibleNumber(value);
        } else if (['duration_days', 'duration_hours', 'duration_minutes'].includes(tradeField)) {
          (trade as any)[tradeField] = parseInt(String(value)) || 0;
        } else if (tradeField === 'side') {
          const normalized = String(value || '').toLowerCase();
          trade.side = (normalized === 'buy' || normalized === 'long') ? 'long' : 'short';
        } else if (['opened_at', 'closed_at'].includes(tradeField)) {
          // Handle dates - already processed by parseSpreadsheet for Excel
          (trade as any)[tradeField] = value || new Date().toISOString();
        } else {
          (trade as any)[tradeField] = value;
        }
      });

      // Calculate derived fields
      if (trade.entry_price && trade.exit_price && trade.position_size) {
        const pnl = trade.side === 'long'
          ? (trade.exit_price - trade.entry_price) * trade.position_size
          : (trade.entry_price - trade.exit_price) * trade.position_size;
        
        trade.profit_loss = pnl - (trade.funding_fee || 0) - (trade.trading_fee || 0);
        trade.margin = trade.entry_price * trade.position_size / (trade.leverage || 1);
        trade.roi = trade.margin > 0 ? (trade.profit_loss / trade.margin) * 100 : 0;
      }

      // Calculate duration (if dates available)
      if (trade.opened_at && trade.closed_at) {
        const openTime = new Date(trade.opened_at).getTime();
        const closeTime = new Date(trade.closed_at).getTime();
        
        if (!isNaN(openTime) && !isNaN(closeTime) && closeTime >= openTime) {
          const diffMs = closeTime - openTime;
          
          trade.duration_days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          trade.duration_hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          trade.duration_minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        }
      }

      // Set period of day (if opened_at available)
      if (trade.opened_at) {
        const openDate = new Date(trade.opened_at);
        if (!isNaN(openDate.getTime())) {
          const hour = openDate.getHours();
          if (hour < 12) trade.period_of_day = 'morning';
          else if (hour < 18) trade.period_of_day = 'afternoon';
          else trade.period_of_day = 'night';
        }
      }

      return trade as ExtractedTrade;
    });
  };

  const handleMappingComplete = async (mappings: Record<string, string>) => {
    setColumnMappings(mappings);
    
    // Apply mappings and generate trades
    const trades = applyMappingToData(csvData, mappings);
    setMappedTrades(trades);
    setSelectedTrades(new Set(trades.map((_, idx) => idx)));

    // Save template if broker is selected
    if (selectedBroker) {
      try {
        await saveTemplate({
          brokerName: selectedBroker,
          columnMappings: mappings,
          sampleHeaders: csvHeaders
        });
      } catch (error) {
        console.error("Failed to save template:", error);
      }
    }

    setCurrentStep('preview');
  };

  const handleImportTrades = () => {
    // Get only selected trades and ensure broker is set
    const tradesToImport = mappedTrades
      .filter((_, idx) => selectedTrades.has(idx))
      .map(trade => ({
        ...trade,
        broker: trade.broker || selectedBroker,
      }));

    if (tradesToImport.length === 0) {
      toast.error('Please select at least one trade to import');
      return;
    }

    onTradesExtracted(tradesToImport);
    toast.success(`${tradesToImport.length} trade${tradesToImport.length !== 1 ? 's' : ''} imported from ${fileName}`);
    handleReset();
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setCsvHeaders([]);
    setCsvData([]);
    setFileName("");
    setColumnMappings({});
    setSelectedBroker("");
    setMappedTrades([]);
    setDetectedTemplate(null);
    setSelectedTrades(new Set());
  };

  const handleLoadTemplate = (templateId: string, brokerName: string, mappings: Record<string, string>) => {
    setColumnMappings(mappings);
    setSelectedBroker(brokerName);
    setDetectedTemplate({ id: templateId, name: brokerName });
    incrementUsage(templateId);
    
    if (csvData.length > 0) {
    const trades = applyMappingToData(csvData, mappings);
    setMappedTrades(trades);
    setSelectedTrades(new Set(trades.map((_, idx) => idx))); // Select all by default
    setCurrentStep('preview');
    } else {
      setCurrentStep('mapping');
    }
  };

  // Render current step
  if (currentStep === 'upload') {
    return (
      <Card className="p-8">
        <EnhancedFileUpload
          onFileSelected={handleFileSelect}
          acceptedTypes={['.csv', '.xlsx', '.xls']}
          maxSize={20 * 1024 * 1024}
        />
        
        <div className="mt-6">
          <BrokerTemplateManager onLoadTemplate={handleLoadTemplate} />
        </div>
      </Card>
    );
  }

  if (currentStep === 'mapping') {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-medium">{fileName}</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Broker (Optional)
          </label>
          <BrokerSelect
            value={selectedBroker}
            onChange={setSelectedBroker}
            required={false}
          />
        </div>

        <CSVColumnMapper
          csvHeaders={csvHeaders}
          sampleData={csvData.slice(0, 5)}
          onMappingComplete={handleMappingComplete}
          initialMappings={detectedTemplate ? columnMappings : undefined}
        />
      </Card>
    );
  }

  if (currentStep === 'preview') {
    return (
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentStep('mapping')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="text-lg font-semibold">Review Detected Trades</h3>
              <p className="text-sm text-muted-foreground">
                {fileName} {selectedBroker && `• ${selectedBroker}`}
              </p>
            </div>
          </div>
        </div>

        <CSVPreviewSummary
          trades={mappedTrades}
          selectedTrades={selectedTrades}
          onSelectionChange={setSelectedTrades}
          broker={selectedBroker}
        />
        
        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={handleReset} variant="outline">
            Start Over
          </Button>
          <Button 
            onClick={handleImportTrades}
            disabled={selectedTrades.size === 0}
            size="lg"
          >
            Import {selectedTrades.size} Selected Trade{selectedTrades.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
};
