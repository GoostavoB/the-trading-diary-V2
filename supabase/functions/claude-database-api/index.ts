import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-claude-api-key',
};

// Configuration
const ALLOWED_TABLES = [
  'trades',
  'profiles',
  'subscriptions',
  'transactions',
  'user_xp_levels',
  'user_daily_activity',
  'daily_challenges',
  'achievement_showcase',
  'social_posts',
  'leaderboard_entries'
];

const ALLOWED_RPC_FUNCTIONS = [
  'get_user_dashboard_stats',
  'get_subscription_metrics',
  'get_trading_analytics'
];

const MAX_ROWS = 1000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB
const QUERY_TIMEOUT_MS = 10000; // 10 seconds

interface ApiRequest {
  operation: 'read' | 'write' | 'rpc' | 'migrate';
  table?: string;
  select?: string;
  filters?: Record<string, string>;
  limit?: number;
  order?: { column: string; ascending?: boolean };
  rpc_function?: string;
  rpc_params?: Record<string, any>;
  // Write operations
  action?: 'insert' | 'update' | 'delete';
  data?: Record<string, any> | Record<string, any>[];
  // Migration operations
  sql?: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  metadata?: {
    count?: number;
    operation: string;
    timestamp: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

async function logUsage(
  supabaseAdmin: any,
  operation: string,
  tableName: string | null,
  queryParams: any,
  responseTime: number,
  success: boolean,
  errorCode: string | null = null,
  errorMessage: string | null = null,
  rowCount: number | null = null,
  responseSizeBytes: number | null = null
) {
  try {
    await supabaseAdmin
      .from('claude_api_usage')
      .insert({
        operation,
        table_name: tableName,
        query_params: queryParams,
        response_time_ms: responseTime,
        response_size_bytes: responseSizeBytes,
        row_count: rowCount,
        success,
        error_code: errorCode,
        error_message: errorMessage,
      });
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let operation = '';
  let tableName: string | null = null;
  let queryParams: any = null;

  try {
    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate with API key
    const apiKey = req.headers.get('X-Claude-API-Key');
    const expectedApiKey = Deno.env.get('CLAUDE_ACCESS_KEY');

    if (!apiKey || apiKey !== expectedApiKey) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing API key. Include X-Claude-API-Key header with your API key.'
        }
      };
      await logUsage(supabaseAdmin, 'auth_failure', null, null, Date.now() - startTime, false, 'UNAUTHORIZED', 'Invalid API key');
      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body: ApiRequest = await req.json();
    operation = body.operation;
    queryParams = body;

    // Validate operation
    if (!['read', 'write', 'rpc', 'migrate'].includes(operation)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: `Operation '${operation}' is not allowed. Supported operations: read, write, rpc, migrate.`,
          details: { allowed_operations: ['read', 'write', 'rpc', 'migrate'] }
        }
      };
      await logUsage(supabaseAdmin, operation, null, queryParams, Date.now() - startTime, false, 'INVALID_OPERATION', response.error?.message || 'Invalid operation');
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle RPC operations
    if (operation === 'rpc') {
      const { rpc_function, rpc_params } = body;

      if (!rpc_function) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_RPC_FUNCTION',
            message: 'rpc_function is required for RPC operations'
          }
        };
        await logUsage(supabaseAdmin, operation, null, queryParams, Date.now() - startTime, false, 'MISSING_RPC_FUNCTION', response.error?.message || 'Missing RPC function');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!ALLOWED_RPC_FUNCTIONS.includes(rpc_function)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'RPC_NOT_ALLOWED',
            message: `RPC function '${rpc_function}' is not whitelisted`,
            details: { allowed_functions: ALLOWED_RPC_FUNCTIONS }
          }
        };
        await logUsage(supabaseAdmin, operation, rpc_function, queryParams, Date.now() - startTime, false, 'RPC_NOT_ALLOWED', response.error?.message || 'RPC not allowed');
        return new Response(JSON.stringify(response), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Execute RPC with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout exceeded')), QUERY_TIMEOUT_MS)
      );

      const { data, error } = await Promise.race([
        supabaseAdmin.rpc(rpc_function, rpc_params || {}),
        timeoutPromise
      ]) as any;

      if (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'RPC_ERROR',
            message: error.message,
            details: error
          }
        };
        await logUsage(supabaseAdmin, operation, rpc_function, queryParams, Date.now() - startTime, false, 'RPC_ERROR', error.message);
        return new Response(JSON.stringify(response), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responseData: ApiResponse = {
        success: true,
        data,
        metadata: {
          operation: 'rpc',
          timestamp: new Date().toISOString()
        }
      };

      const responseSize = JSON.stringify(responseData).length;
      await logUsage(supabaseAdmin, operation, rpc_function, queryParams, Date.now() - startTime, true, null, null, null, responseSize);

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle READ operations
    if (operation === 'read') {
      const { table, select = '*', filters = {}, limit = 100, order } = body;
      tableName = table || null;

      if (!table) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_TABLE',
            message: 'table is required for read operations'
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'MISSING_TABLE', response.error?.message || 'Missing table');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate table whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TABLE_NOT_ALLOWED',
            message: `Table '${table}' is not accessible via this API`,
            details: { allowed_tables: ALLOWED_TABLES }
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'TABLE_NOT_ALLOWED', response.error?.message || 'Table not allowed');
        return new Response(JSON.stringify(response), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Enforce row limit
      const effectiveLimit = Math.min(limit, MAX_ROWS);

      // Build query
      let query = supabaseAdmin.from(table).select(select);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        const [column, operator] = key.split('.');
        if (operator) {
          // Handle PostgREST operators (eq, neq, gt, gte, lt, lte, like, ilike, in)
          query = query.filter(column, operator, value);
        } else {
          // Default to equality
          query = query.eq(key, value);
        }
      });

      // Apply limit
      query = query.limit(effectiveLimit);

      // Apply ordering
      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout exceeded')), QUERY_TIMEOUT_MS)
      );

      const { data, error, count } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;

      if (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: error.message,
            details: error
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'QUERY_ERROR', error.message);
        return new Response(JSON.stringify(response), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responseData: ApiResponse = {
        success: true,
        data,
        metadata: {
          count: data?.length || 0,
          operation: 'read',
          timestamp: new Date().toISOString()
        }
      };

      // Check response size
      const responseJson = JSON.stringify(responseData);
      const responseSize = responseJson.length;

      if (responseSize > MAX_RESPONSE_SIZE) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'RESPONSE_TOO_LARGE',
            message: `Response size (${(responseSize / 1024 / 1024).toFixed(2)}MB) exceeds limit (${MAX_RESPONSE_SIZE / 1024 / 1024}MB). Use filters or reduce limit.`,
            details: {
              response_size_bytes: responseSize,
              max_size_bytes: MAX_RESPONSE_SIZE,
              row_count: data?.length || 0,
              suggestion: 'Add filters or reduce limit parameter'
            }
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'RESPONSE_TOO_LARGE', response.error?.message || 'Response too large', data?.length || 0, responseSize);
        return new Response(JSON.stringify(response), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, true, null, null, data?.length || 0, responseSize);

      return new Response(responseJson, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle WRITE operations
    if (operation === 'write') {
      const { table, action, data, filters = {} } = body;
      tableName = table || null;

      if (!table) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_TABLE',
            message: 'table is required for write operations'
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'MISSING_TABLE', response.error?.message || 'Missing table');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!action) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_ACTION',
            message: 'action is required for write operations (insert, update, delete)'
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'MISSING_ACTION', response.error?.message || 'Missing action');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate table whitelist
      if (!ALLOWED_TABLES.includes(table)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'TABLE_NOT_ALLOWED',
            message: `Table '${table}' is not accessible via this API`,
            details: { allowed_tables: ALLOWED_TABLES }
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'TABLE_NOT_ALLOWED', response.error?.message || 'Table not allowed');
        return new Response(JSON.stringify(response), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let query: any;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout exceeded')), QUERY_TIMEOUT_MS)
      );

      if (action === 'insert') {
        if (!data) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'MISSING_DATA',
              message: 'data is required for insert operations'
            }
          };
          await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'MISSING_DATA', response.error?.message || 'Missing data');
          return new Response(JSON.stringify(response), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        query = supabaseAdmin.from(table).insert(data).select();
      } else if (action === 'update') {
        if (!data) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'MISSING_DATA',
              message: 'data is required for update operations'
            }
          };
          await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'MISSING_DATA', response.error?.message || 'Missing data');
          return new Response(JSON.stringify(response), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        query = supabaseAdmin.from(table).update(data);
        
        // Apply filters for update
        Object.entries(filters).forEach(([key, value]) => {
          const [column, operator] = key.split('.');
          if (operator) {
            query = query.filter(column, operator, value);
          } else {
            query = query.eq(key, value);
          }
        });

        query = query.select();
      } else if (action === 'delete') {
        query = supabaseAdmin.from(table).delete();
        
        // Apply filters for delete
        Object.entries(filters).forEach(([key, value]) => {
          const [column, operator] = key.split('.');
          if (operator) {
            query = query.filter(column, operator, value);
          } else {
            query = query.eq(key, value);
          }
        });

        query = query.select();
      } else {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Invalid action '${action}'. Must be: insert, update, or delete`
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'INVALID_ACTION', response.error?.message || 'Invalid action');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: resultData, error } = await Promise.race([
        query,
        timeoutPromise
      ]) as any;

      if (error) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'WRITE_ERROR',
            message: error.message,
            details: error
          }
        };
        await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, false, 'WRITE_ERROR', error.message);
        return new Response(JSON.stringify(response), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responseData: ApiResponse = {
        success: true,
        data: resultData,
        metadata: {
          count: resultData?.length || 0,
          operation: `write_${action}`,
          timestamp: new Date().toISOString()
        }
      };

      const responseSize = JSON.stringify(responseData).length;
      await logUsage(supabaseAdmin, operation, tableName, queryParams, Date.now() - startTime, true, null, null, resultData?.length || 0, responseSize);

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle MIGRATE operations
    if (operation === 'migrate') {
      const { sql } = body;

      if (!sql) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MISSING_SQL',
            message: 'sql is required for migration operations'
          }
        };
        await logUsage(supabaseAdmin, operation, null, queryParams, Date.now() - startTime, false, 'MISSING_SQL', response.error?.message || 'Missing SQL');
        return new Response(JSON.stringify(response), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout exceeded')), QUERY_TIMEOUT_MS)
      );

      try {
        const { data, error } = await Promise.race([
          supabaseAdmin.rpc('exec_sql', { sql_query: sql }),
          timeoutPromise
        ]) as any;

        if (error) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'MIGRATION_ERROR',
              message: error.message,
              details: error
            }
          };
          await logUsage(supabaseAdmin, operation, 'migration', queryParams, Date.now() - startTime, false, 'MIGRATION_ERROR', error.message);
          return new Response(JSON.stringify(response), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const responseData: ApiResponse = {
          success: true,
          data,
          metadata: {
            operation: 'migrate',
            timestamp: new Date().toISOString()
          }
        };

        const responseSize = JSON.stringify(responseData).length;
        await logUsage(supabaseAdmin, operation, 'migration', queryParams, Date.now() - startTime, true, null, null, null, responseSize);

        return new Response(JSON.stringify(responseData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown migration error';
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'MIGRATION_EXEC_ERROR',
            message: errorMessage
          }
        };
        await logUsage(supabaseAdmin, operation, 'migration', queryParams, Date.now() - startTime, false, 'MIGRATION_EXEC_ERROR', errorMessage);
        return new Response(JSON.stringify(response), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Should never reach here
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred'
      }
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: errorMessage
      }
    };

    // Try to log the error
    try {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await logUsage(supabaseAdmin, operation || 'unknown', tableName, queryParams, Date.now() - startTime, false, 'INTERNAL_ERROR', errorMessage);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
