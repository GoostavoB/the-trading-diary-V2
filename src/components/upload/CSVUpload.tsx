import { useState } from 'react';
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSVFile, detectBrokerFormat, mapBrokerCSVToTrades, validateTradeData, BrokerFormat } from '@/utils/csvParser';
import { ExtractedTrade } from '@/types/trade';
import { CSVPreviewTable } from './CSVPreviewTable';

interface CSVUploadProps {
  onTradesExtracted: (trades: ExtractedTrade[]) => void;
}

export const CSVUpload = ({ onTradesExtracted }: CSVUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedTrades, setParsedTrades] = useState<ExtractedTrade[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<BrokerFormat | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const formatLabels: Record<BrokerFormat, string> = {
    'binance-futures': 'Binance Futures',
    'bybit': 'Bybit',
    'okx': 'OKX',
    'app-export': 'TradeJournal Export',
    'generic': 'Unknown Format',
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setValidationErrors(['Please upload a valid CSV file']);
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setValidationErrors([]);

    try {
      // Parse CSV
      const result = await parseCSVFile(file);
      
      if (result.errors.length > 0) {
        setValidationErrors(result.errors.map(e => e.message));
        setIsProcessing(false);
        return;
      }

      // Detect broker format
      const format = detectBrokerFormat(result.headers);
      setDetectedFormat(format);

      if (format === 'generic') {
        setValidationErrors(['Unable to detect broker format. Please ensure your CSV matches a supported format (Binance, Bybit, OKX).']);
        setIsProcessing(false);
        return;
      }

      // Map to trades
      const trades = mapBrokerCSVToTrades(result.data, format);
      
      if (trades.length === 0) {
        setValidationErrors(['No valid trades found in CSV. Please check the file format.']);
        setIsProcessing(false);
        return;
      }

      // Validate trades
      const validation = validateTradeData(trades);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(
          e => `Row ${e.row}: ${e.message}`
        );
        setValidationErrors(errorMessages.slice(0, 5)); // Show first 5 errors
      }

      setParsedTrades(trades);
    } catch (error) {
      console.error('CSV parsing error:', error);
      setValidationErrors(['Failed to parse CSV file. Please check the file format.']);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImportAll = () => {
    onTradesExtracted(parsedTrades);
    // Reset state
    setParsedTrades([]);
    setDetectedFormat(null);
    setFileName('');
    setValidationErrors([]);
  };

  const handleReset = () => {
    setParsedTrades([]);
    setDetectedFormat(null);
    setFileName('');
    setValidationErrors([]);
  };

  return (
    <div className="space-y-4">
      {parsedTrades.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-4 bg-primary/10 rounded-full">
              {isProcessing ? (
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isProcessing ? 'Processing CSV...' : 'Upload CSV File'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supported: Binance Futures, Bybit, OKX exports (Max 5MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header with file info */}
          <Card className="p-4 glass">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-neon-green" />
                <div>
                  <p className="font-medium">{fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Found {parsedTrades.length} trade{parsedTrades.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {detectedFormat && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {formatLabels[detectedFormat]}
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">Validation Issues:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
                {validationErrors.length >= 5 && (
                  <p className="text-xs mt-2">Showing first 5 errors...</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview table */}
          <CSVPreviewTable trades={parsedTrades.slice(0, 10)} />

          {parsedTrades.length > 10 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing first 10 trades. {parsedTrades.length - 10} more will be imported.
            </p>
          )}

          {/* Import button */}
          <div className="flex gap-2">
            <Button onClick={handleImportAll} className="flex-1" size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Import All {parsedTrades.length} Trades
            </Button>
          </div>
        </div>
      )}

      {/* Help section */}
      <Card className="p-4 glass">
        <details className="space-y-2">
          <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
            📖 How to export from your broker
          </summary>
          <div className="text-sm text-muted-foreground space-y-3 mt-3 pl-6">
            <div>
              <p className="font-medium text-foreground">Binance:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Go to Orders → Order History</li>
                <li>Select date range</li>
                <li>Click "Export Complete Order History"</li>
                <li>Download CSV</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-foreground">Bybit:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Go to Orders → Order History</li>
                <li>Filter by "Closed"</li>
                <li>Click "Export" button</li>
                <li>Save CSV file</li>
              </ol>
            </div>
            <div>
              <p className="font-medium text-foreground">OKX:</p>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Go to Trade → Trade History</li>
                <li>Select "Futures" or "Spot"</li>
                <li>Click "Export" icon</li>
                <li>Download CSV</li>
              </ol>
            </div>
          </div>
        </details>
      </Card>
    </div>
  );
};
