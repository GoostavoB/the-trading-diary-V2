// ────────────────────────────────────────────────────────────────────────────
// SnapTradeService — frontend wrapper around the snaptrade-* edge functions.
//
// All requests go through Supabase edge functions (which hold the SnapTrade
// consumer key + sign requests with HMAC). The frontend never sees credentials.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/integrations/supabase/client';
import type {
  AggregatorConnection,
  SnapTradeLoginLinkResponse,
  SyncResult,
} from '@/types/aggregator';

class SnapTradeServiceImpl {
  /** Idempotently register the current user with SnapTrade. */
  async registerUser(): Promise<{ userId: string; registered: boolean }> {
    const { data, error } = await supabase.functions.invoke('snaptrade-register-user');
    if (error) throw new Error(error.message || 'Failed to register with SnapTrade');
    return data;
  }

  /**
   * Generate a SnapTrade Connection Portal URL. Open this in a popup/iframe.
   * After the user finishes, SnapTrade redirects to `redirect` (or closes the
   * popup if not provided).
   */
  async getConnectPortalUrl(args: {
    broker?: string;
    redirect?: string;
  } = {}): Promise<SnapTradeLoginLinkResponse> {
    const { data, error } = await supabase.functions.invoke('snaptrade-login-link', {
      body: args,
    });
    if (error) throw new Error(error.message || 'Failed to generate connect link');
    return data;
  }

  /** List all SnapTrade connections (broker authorizations) for the user. */
  async listConnections(): Promise<AggregatorConnection[]> {
    const { data, error } = await supabase.functions.invoke('snaptrade-list-connections');
    if (error) throw new Error(error.message || 'Failed to list connections');
    return data || [];
  }

  /** Pull trades from one connection (or all) into the local trades table. */
  async syncTrades(args: { connectionId?: string; startDate?: string } = {}): Promise<SyncResult> {
    const { data, error } = await supabase.functions.invoke('snaptrade-sync-trades', {
      body: args,
    });
    if (error) throw new Error(error.message || 'Failed to sync trades');
    return data;
  }

  /** Remove a SnapTrade connection. Trade history is preserved locally. */
  async disconnect(connectionId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('snaptrade-disconnect', {
      body: { connectionId },
    });
    if (error) throw new Error(error.message || 'Failed to disconnect');
  }
}

export const SnapTradeService = new SnapTradeServiceImpl();
