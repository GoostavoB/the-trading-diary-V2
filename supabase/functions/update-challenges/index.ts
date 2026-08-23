import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAuthorizedCronRequest, forbiddenResponse } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHALLENGE_TEMPLATES = [
  {
    challenge_type: 'trade_count',
    title: 'Log 3 Trades',
    description: 'Execute at least 3 trades today',
    target_value: 3,
    xp_reward: 15
  },
  {
    challenge_type: 'winning_trade',
    title: 'Get a Win',
    description: 'Achieve at least 1 winning trade',
    target_value: 1,
    xp_reward: 20
  },
  {
    challenge_type: 'customize_dashboard',
    title: 'Customize Dashboard',
    description: 'Make changes to your dashboard layout',
    target_value: 1,
    xp_reward: 10
  },
  {
    challenge_type: 'check_analytics',
    title: 'Check Analytics',
    description: 'Visit your analytics page',
    target_value: 1,
    xp_reward: 5
  },
  {
    challenge_type: 'export_history',
    title: 'Export Trades',
    description: 'Export your trade history',
    target_value: 1,
    xp_reward: 15
  }
];

const WEEKLY_CHALLENGE_TEMPLATES = [
  {
    challenge_type: 'weekly_trade_count',
    title: 'Active Trader',
    description: 'Execute 20 trades this week',
    target_value: 20,
    xp_reward: 100
  },
  {
    challenge_type: 'weekly_profit',
    title: 'Profit Master',
    description: 'Earn $500 profit this week',
    target_value: 500,
    xp_reward: 150
  },
  {
    challenge_type: 'weekly_win_rate',
    title: 'Consistency King',
    description: 'Maintain 70% win rate this week',
    target_value: 70,
    xp_reward: 120
  },
];

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

    const today = new Date().toISOString().split('T')[0];

    // Get all active users
    const { data: users } = await supabase
      .from("profiles")
      .select("id");

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let createdCount = 0;
    let weeklyCreatedCount = 0;

    // Calculate week start (Monday)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    for (const user of users) {
      // Check if user already has challenges for today
      const { data: existing } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_date", today);

      if (existing && existing.length > 0) continue;

      // Create daily challenges for this user
      const challenges = CHALLENGE_TEMPLATES.map(template => ({
        user_id: user.id,
        challenge_date: today,
        ...template,
        current_progress: 0,
        is_completed: false,
        mystery_unlocked: false
      }));

      // Add "Mystery Challenge" with 1 in 7 chance (enhanced)
      if (Math.random() < 1/7) {
        challenges.push({
          user_id: user.id,
          challenge_date: today,
          challenge_type: 'mystery_challenge',
          title: '🎁 Mystery Challenge',
          description: 'Complete any challenge to unlock this bonus!',
          target_value: 1,
          xp_reward: 30,
          current_progress: 0,
          is_completed: false,
          mystery_unlocked: false
        });
      }

      const { error } = await supabase
        .from("daily_challenges")
        .insert(challenges);

      if (!error) createdCount++;

      // Create weekly challenges (only on Monday)
      if (weekStart.getDay() === 1) {
        const { data: weeklyExisting } = await supabase
          .from("weekly_challenges")
          .select("*")
          .eq("user_id", user.id)
          .eq("week_start_date", weekStartStr);

        if (!weeklyExisting || weeklyExisting.length === 0) {
          const weeklyChallenges = WEEKLY_CHALLENGE_TEMPLATES.map(template => ({
            user_id: user.id,
            week_start_date: weekStartStr,
            ...template,
            current_progress: 0,
            is_completed: false
          }));

          const { error: weeklyError } = await supabase
            .from("weekly_challenges")
            .insert(weeklyChallenges);

          if (!weeklyError) weeklyCreatedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Daily challenges created for ${createdCount} users, Weekly challenges: ${weeklyCreatedCount}`,
        date: today 
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
