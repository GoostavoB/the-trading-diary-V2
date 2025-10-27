import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, AlertCircle, Wand2, RotateCcw } from "lucide-react";
import { ExtractedTrade } from "@/types/trade";
import { autoMapColumns, ColumnMapping, validateMappings } from "@/utils/csvAutoMapper";

interface CSVColumnMapperProps {
  csvHeaders: string[];
  sampleData: Record<string, any>[];
  onMappingComplete: (mappings: Record<string, string>) => void;
  initialMappings?: Record<string, string>;
}

export const CSVColumnMapper = ({
  csvHeaders,
  sampleData,
  onMappingComplete,
  initialMappings
}: CSVColumnMapperProps) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [hasAutoMapped, setHasAutoMapped] = useState(false);

  useEffect(() => {
    if (initialMappings) {
      // Load from existing template
      const result = autoMapColumns(csvHeaders);
      const updatedMappings = result.mappings.map(m => ({
        ...m,
        csvColumn: initialMappings[m.tradeField] || m.csvColumn,
        confidence: initialMappings[m.tradeField] ? 100 : m.confidence
      }));
      setMappings(updatedMappings);
      setHasAutoMapped(true);
    } else {
      // Fresh auto-map
      handleAutoMap();
    }
  }, []);

  const handleAutoMap = () => {
    const result = autoMapColumns(csvHeaders);
    setMappings(result.mappings);
    setHasAutoMapped(true);
  };

  const handleReset = () => {
    const emptyMappings = mappings.map(m => ({
      ...m,
      csvColumn: null,
      confidence: 0
    }));
    setMappings(emptyMappings);
  };

  const handleMappingChange = (tradeField: keyof ExtractedTrade, csvColumn: string | null) => {
    setMappings(prev => prev.map(m => 
      m.tradeField === tradeField 
        ? { ...m, csvColumn, confidence: csvColumn ? 100 : 0 }
        : m
    ));
  };

  const handleContinue = () => {
    const mappingObj: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.csvColumn) {
        mappingObj[m.tradeField] = m.csvColumn;
      }
    });
    onMappingComplete(mappingObj);
  };

  const validation = validateMappings(mappings);
  const getMappedValue = (tradeField: string, rowIndex: number): any => {
    const mapping = mappings.find(m => m.tradeField === tradeField);
    if (!mapping?.csvColumn || !sampleData[rowIndex]) return '-';
    return sampleData[rowIndex][mapping.csvColumn] || '-';
  };

  const getConfidenceBadge = (confidence: number, isRequired: boolean) => {
    if (confidence === 0) {
      return isRequired ? (
        <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" /> Required
        </Badge>
      ) : (
        <Badge variant="outline">Not Mapped</Badge>
      );
    }
    if (confidence === 100) {
      return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Mapped</Badge>;
    }
    if (confidence >= 80) {
      return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> High</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Map Your CSV Columns</h3>
          <p className="text-sm text-muted-foreground">
            Match your CSV columns to the required trade fields
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          {!hasAutoMapped && (
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="h-4 w-4 mr-2" />
              Auto-Map
            </Button>
          )}
        </div>
      </div>

      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Missing required fields: {validation.missingFields.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="space-y-3">
          {mappings.map((mapping) => (
            <div key={mapping.tradeField} className="flex items-center gap-4 pb-3 border-b last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium capitalize">
                    {mapping.tradeField.replace(/_/g, ' ')}
                  </span>
                  {mapping.isRequired && <span className="text-destructive text-xs">*</span>}
                </div>
              </div>
              
              <div className="flex-1">
                <Select
                  value={mapping.csvColumn || "__none__"}
                  onValueChange={(value) => handleMappingChange(mapping.tradeField, value === "__none__" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-- None --</SelectItem>
                    {csvHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                {getConfidenceBadge(mapping.confidence, mapping.isRequired)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h4 className="text-sm font-semibold mb-3">Preview (First 3 Rows)</h4>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {mappings.filter(m => m.csvColumn).slice(0, 5).map((m) => (
                  <TableHead key={m.tradeField} className="capitalize">
                    {m.tradeField.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.slice(0, 3).map((_, idx) => (
                <TableRow key={idx}>
                  {mappings.filter(m => m.csvColumn).slice(0, 5).map((m) => (
                    <TableCell key={m.tradeField} className="font-mono text-xs">
                      {getMappedValue(m.tradeField, idx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleContinue}
          disabled={!validation.isValid}
          size="lg"
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  );
};
