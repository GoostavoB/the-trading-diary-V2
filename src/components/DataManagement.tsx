import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Download, Trash2, AlertTriangle, Database } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

export const DataManagement = () => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportAllData = async () => {
    if (!user) return;

    setExporting(true);
    try {
      // Fetch all user data
      const { data: trades } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const exportData = {
        exportDate: new Date().toISOString(),
        userData: {
          email: user.email,
          profile,
          settings,
        },
        trades: trades || [],
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tradetrackr-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('All data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllTrades = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('All trades deleted successfully');
      window.location.reload(); // Refresh to update UI
    } catch (error) {
      console.error('Error deleting trades:', error);
      toast.error('Failed to delete trades');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">Data Management</h3>
          <p className="text-sm text-muted-foreground">
            Export or delete your trading data
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Export Data */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-neon-green mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Export All Data</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Download a complete backup of all your trades, settings, and profile data in JSON format.
              </p>
              <Button
                onClick={handleExportAllData}
                disabled={exporting}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Delete All Trades */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1 text-yellow-500">Danger Zone</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete all your trades. This action cannot be undone.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete All Trades
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your trades. This action cannot be undone.
                      Your settings and profile will remain intact.
                      <br /><br />
                      <strong>Consider exporting your data first as a backup.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllTrades}
                      disabled={deleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
