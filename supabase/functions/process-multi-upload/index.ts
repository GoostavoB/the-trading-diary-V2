import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normalizes a symbol for consistent hashing
 */
function normalizeSymbol(symbol?: string): string {
  if (!symbol) return 'UNKNOWN';
  
  const mappings: Record<string, string> = {
    'DAX INDEX': 'DAXINDEX',
    'DAX 40': 'DAX40',
    'NQ': 'NQ100',
    'ES': 'ES500',
    'YM': 'YM30',
  };
  
  let normalized = symbol.toUpperCase().trim();
  
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  return normalized
    .replace(/[\s\-_\/\\]/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Computes a trade hash for duplicate detection using Web Crypto API
 */
async function computeTradeHash(trade: any): Promise<string> {
  const symbol = normalizeSymbol(trade.symbol ?? trade.symbol_temp ?? trade.ticker);
  const side = (trade.side || 'unknown').toLowerCase();
  
  // Get timestamp - prefer opened_at, fallback to trade_date or created_at
  let timestamp = trade.opened_at || trade.trade_date || trade.created_at;
  if (timestamp) {
    // Truncate to minute precision
    const date = new Date(timestamp);
    timestamp = date.toISOString().substring(0, 16); // YYYY-MM-DDTHH:MM
  } else {
    timestamp = 'no-date';
  }
  
  // Round numeric values to 2 decimals for consistent hashing
  const entryPrice = trade.entry_price ? Math.round(trade.entry_price * 100) / 100 : 0;
  const exitPrice = trade.exit_price ? Math.round(trade.exit_price * 100) / 100 : 0;
  const positionSize = trade.position_size ? Math.round(trade.position_size * 100) / 100 : 0;
  
  // Create hash input string
  const hashInput = `${symbol}|${side}|${timestamp}|${entryPrice}|${exitPrice}|${positionSize}`;
  
  // Use Web Crypto API to compute SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { trades, creditsToDeduct, sub_account_id } = await req.json();

    if (!Array.isArray(trades) || trades.length === 0) {
      throw new Error('No trades provided');
    }

    // Maximum 100 trades per batch for safety
    if (trades.length > 100) {
      return new Response(
        JSON.stringify({ 
          error: `Cannot save ${trades.length} trades in one batch. Maximum allowed: 100 trades per upload.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${trades.length} trades for user ${user.id}`);

    // Prepare trades with trade_hash
    // Helper to convert empty strings to null for timestamp fields
    const sanitizeTimestamp = (val: any): string | null => {
      if (val === '' || val === null || val === undefined) return null;
      return val;
    };

    const tradesWithHash = await Promise.all(
      trades.map(async (t: any) => {
        const symbolCandidate = t.symbol ?? t.symbol_temp ?? t.ticker ?? t.symbolPair ?? t.pair ?? t.market ?? t.symbol_name ?? t.asset ?? null;
        const tradeHash = await computeTradeHash(t);
        
        return {
          ...t,
          user_id: user.id,
          sub_account_id: sub_account_id || null,
          symbol_temp: symbolCandidate ?? 'UNKNOWN',
          trade_hash: tradeHash,
          // Sanitize timestamp fields - convert empty strings to null
          opened_at: sanitizeTimestamp(t.opened_at),
          closed_at: sanitizeTimestamp(t.closed_at),
          trade_date: sanitizeTimestamp(t.trade_date),
          created_at: sanitizeTimestamp(t.created_at),
        };
      })
    );

    // First, check for soft-deleted trades with matching hashes and restore them
    const tradeHashes = tradesWithHash.map((t: any) => t.trade_hash);
    
    const { data: existingDeletedTrades } = await supabaseClient
      .from('trades')
      .select('id, trade_hash')
      .eq('user_id', user.id)
      .in('trade_hash', tradeHashes)
      .not('deleted_at', 'is', null);
    
    const deletedHashSet = new Set((existingDeletedTrades || []).map((t: any) => t.trade_hash));
    
    // Restore soft-deleted trades
    let restoredCount = 0;
    if (existingDeletedTrades && existingDeletedTrades.length > 0) {
      const { error: restoreError } = await supabaseClient
        .from('trades')
        .update({ deleted_at: null })
        .eq('user_id', user.id)
        .in('trade_hash', Array.from(deletedHashSet));
      
      if (restoreError) {
        console.error('Restore error:', restoreError);
      } else {
        restoredCount = existingDeletedTrades.length;
        console.log(`Restored ${restoredCount} previously deleted trades`);
      }
    }
    
    // Filter out trades that were just restored (they already exist)
    const tradesToInsert = tradesWithHash.filter((t: any) => !deletedHashSet.has(t.trade_hash));
    
    let insertedCount = 0;
    let insertedTrades: any[] = [];
    
    if (tradesToInsert.length > 0) {
      // Use upsert with onConflict to skip duplicates for remaining trades
      const { data, error } = await supabaseClient
        .from('trades')
        .upsert(tradesToInsert, {
          onConflict: 'user_id,trade_hash',
          ignoreDuplicates: true
        })
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      insertedTrades = data || [];
      insertedCount = insertedTrades.length;
    }

    const skippedCount = trades.length - insertedCount - restoredCount;

    console.log(`Successfully inserted ${insertedCount} trades, restored ${restoredCount}, skipped ${skippedCount} duplicates`);

    return new Response(
      JSON.stringify({ 
        success: true,
        trades: insertedTrades,
        tradesInserted: insertedCount,
        tradesRestored: restoredCount,
        tradesSkipped: skippedCount,
        tradesSubmitted: trades.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Multi-upload processing error:', error);
    const e = error as any;
    const message = e?.message || e?.error?.message || e?.details || e?.hint || JSON.stringify(e);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
