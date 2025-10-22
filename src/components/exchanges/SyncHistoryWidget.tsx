import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface SyncHistory {
  id: string;
  exchange_name: string;
  sync_type: string;
  trades_fetched: number;
  trades_imported: number;
  trades_skipped: number;
  status: string;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export function SyncHistoryWidget() {
  const { t } = useTranslation();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['sync-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_sync_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SyncHistory[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('exchanges.history.title')}</CardTitle>
        <CardDescription>{t('exchanges.history.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('exchanges.history.noHistory')}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('exchanges.history.exchange')}</TableHead>
                <TableHead>{t('exchanges.history.date')}</TableHead>
                <TableHead className="text-right">{t('exchanges.history.fetched')}</TableHead>
                <TableHead className="text-right">{t('exchanges.history.imported')}</TableHead>
                <TableHead className="text-right">{t('exchanges.history.skipped')}</TableHead>
                <TableHead>{t('exchanges.history.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium capitalize">
                    {record.exchange_name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(record.started_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">{record.trades_fetched}</TableCell>
                  <TableCell className="text-right">{record.trades_imported}</TableCell>
                  <TableCell className="text-right">{record.trades_skipped}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === 'success'
                          ? 'default'
                          : record.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
