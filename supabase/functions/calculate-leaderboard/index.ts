import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAuthorizedCronRequest, forbiddenResponse } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isAuthorizedCronRequest(req)) {
    return forbiddenResponse(corsHeaders);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get active season
    const { data: season } = await supabase
      .from("seasonal_competitions")
      .select("*")
      .eq("is_active", true)
      .single();

    if (!season) {
      return new Response(
        JSON.stringify({ message: "No active season found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get all users with trades
    const { data: users } = await supabase
      .from("profiles")
      .select("id");

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const leaderboardEntries = [];

    for (const user of users) {
      // Calculate user stats
      const { data: trades } = await supabase
        .from("trades")
        .select("pnl, roi, position_size")
        .eq("user_id", user.id)
        .gte("trade_date", season.start_date);

      if (!trades || trades.length === 0) continue;

      const winningTrades = trades.filter((t: any) => t.pnl > 0).length;
      const totalTrades = trades.length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      
      const totalROI = trades.reduce((sum: number, t: any) => sum + (t.roi || 0), 0);
      const avgROI = totalTrades > 0 ? totalROI / totalTrades : 0;

      // Calculate consistency (simplified version)
      const recentTrades = trades.slice(-10);
      const profitableDays = recentTrades.filter((t: any) => t.pnl > 0).length;
      const consistencyIndex = (profitableDays / Math.min(recentTrades.length, 10)) * 100;

      // Performance score formula: (ROI * 0.5) + (winRate * 0.3) + (consistency * 0.2)
      const performanceScore = (avgROI * 0.5) + (winRate * 0.3) + (consistencyIndex * 0.2);

      leaderboardEntries.push({
        user_id: user.id,
        season_id: season.id,
        performance_score: performanceScore,
        roi: avgROI,
        win_rate: winRate,
        consistency_index: consistencyIndex,
      });
    }

    // Sort by performance score and assign ranks
    leaderboardEntries.sort((a, b) => b.performance_score - a.performance_score);
    const rankedEntries = leaderboardEntries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    // Clear existing entries for this season and insert new ones
    await supabase
      .from("leaderboard_entries")
      .delete()
      .eq("season_id", season.id);

    const { error: insertError } = await supabase
      .from("leaderboard_entries")
      .insert(rankedEntries);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        message: "Leaderboard calculated successfully",
        entries: rankedEntries.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
