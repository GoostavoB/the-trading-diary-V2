import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { useThemeMode } from '@/hooks/useThemeMode';
import { TokenIcon } from '@/components/TokenIcon';

interface TokenListProps {
  tokens: Array<{
    symbol: string;
    name: string;
    value: number;
    percentage: number;
    quantity: number;
    icon?: string;
    priceChange24h?: number;
    priceChange7d?: number;
    priceChange30d?: number;
  }>;
  onDelete?: (symbol: string) => void;
  onEdit?: (symbol: string) => void;
}

type SortField = 'symbol' | 'value' | 'percentage' | 'priceChange24h';
type SortDirection = 'asc' | 'desc';

export const TokenList = ({ tokens, onDelete, onEdit }: TokenListProps) => {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { colors } = useThemeMode();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = a[sortField] || 0;
    const bValue = b[sortField] || 0;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  if (!tokens.length) {
    return (
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Token Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No tokens added yet</p>
            <p className="text-sm mt-2">Click "+ Add Token" to start tracking your holdings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Token Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50 glass-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Token</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('value')}
                >
                  Value {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('percentage')}
                >
                  % of Total {sortField === 'percentage' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('priceChange24h')}
                >
                  24h {sortField === 'priceChange24h' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>7D</TableHead>
                <TableHead>30D</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTokens.map((token) => (
                <TableRow key={token.symbol} className="hover:bg-accent/5 border-border/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TokenIcon symbol={token.symbol} className="w-8 h-8" />
                      <div>
                        <div className="font-semibold">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(token.value)}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono">{token.percentage.toFixed(2)}%</div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {token.quantity.toFixed(6)}
                  </TableCell>
                  <TableCell>
                    {token.priceChange24h !== undefined && (
                      <span style={{ color: token.priceChange24h >= 0 ? colors.positive : colors.negative }}>
                        {formatPercent(token.priceChange24h)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {token.priceChange7d !== undefined && (
                      <span style={{ color: token.priceChange7d >= 0 ? colors.positive : colors.negative }}>
                        {formatPercent(token.priceChange7d)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {token.priceChange30d !== undefined && (
                      <span style={{ color: token.priceChange30d >= 0 ? colors.positive : colors.negative }}>
                        {formatPercent(token.priceChange30d)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(token.symbol)}
                          className="hover:bg-accent/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(token.symbol)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
