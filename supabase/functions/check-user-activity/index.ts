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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all users
    const { data: users } = await supabase
      .from("profiles")
      .select("id, email");

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notifications = [];
    let luckyTrader: any = null;

    // Weekly Lucky Trader Pick (every Monday)
    if (now.getDay() === 1) {
      const activeUsers = users.filter(u => {
        // Filter for users active in the last 7 days
        return Math.random() < 0.1; // Simplified: 10% chance per user
      });

      if (activeUsers.length > 0) {
        luckyTrader = activeUsers[Math.floor(Math.random() * activeUsers.length)];
        
        // Award lucky trader
        const { data: currentXP } = await supabase
          .from("user_xp_levels")
          .select("total_xp_earned")
          .eq("user_id", luckyTrader.id)
          .single();

        await supabase.from("xp_activity_log").insert({
          user_id: luckyTrader.id,
          activity_type: "lucky_trader_bonus",
          xp_earned: 200,
          description: "You're this week's Lucky Trader! 🎉"
        });

        if (currentXP) {
          await supabase.from("user_xp_levels")
            .update({ 
              total_xp_earned: currentXP.total_xp_earned + 200
            })
            .eq("user_id", luckyTrader.id);
        }
      }
    }

    for (const user of users) {
      // Check last activity
      const { data: progression } = await supabase
        .from("user_progression")
        .select("last_active_date, daily_streak, rank_expires_at")
        .eq("user_id", user.id)
        .single();

      if (!progression) continue;

      const lastActive = new Date(progression.last_active_date);
      const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      // Streak warning (1 day away from losing streak)
      if (progression.daily_streak > 0 && daysSinceActive === 1) {
        notifications.push({
          user_id: user.id,
          type: 'streak_warning',
          message: `You're 1 day away from losing your ${progression.daily_streak}-day streak!`,
          priority: 'high'
        });
      }

      // Comeback bonus (inactive for 7+ days)
      if (daysSinceActive >= 7 && daysSinceActive < 30) {
        notifications.push({
          user_id: user.id,
          type: 'comeback_bonus',
          message: 'Welcome back! Here\'s 50 XP to get started again.',
          priority: 'medium'
        });

        // Award comeback bonus
        await supabase.from("xp_activity_log").insert({
          user_id: user.id,
          activity_type: "comeback_bonus",
          xp_earned: 50,
          description: "Welcome back bonus"
        });
      }

      // Badge graying (inactive 30+ days) - update unlocked_badges
      if (daysSinceActive >= 30) {
        // Badges will gray out automatically in UI based on last_active_date
        notifications.push({
          user_id: user.id,
          type: 'badge_grayed',
          message: 'Your badges have grayed out due to inactivity.',
          priority: 'low'
        });
      }

      // Badge graying warning (inactive for 25+ days)
      if (daysSinceActive >= 25 && daysSinceActive < 30) {
        notifications.push({
          user_id: user.id,
          type: 'badge_warning',
          message: `Your badges will gray out in ${30 - daysSinceActive} days. Stay active!`,
          priority: 'low'
        });
      }

      // Rank expiration warning
      if (progression.rank_expires_at) {
        const expiresAt = new Date(progression.rank_expires_at);
        const daysUntilExpire = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpire <= 5 && daysUntilExpire > 0) {
          notifications.push({
            user_id: user.id,
            type: 'rank_expiring',
            message: `Your Elite Trader rank expires in ${daysUntilExpire} days!`,
            priority: 'high'
          });
        }

        // Downgrade expired ranks
        if (daysUntilExpire <= 0) {
          await supabase
            .from("user_progression")
            .update({ rank_expires_at: null })
            .eq("user_id", user.id);
        }
      }

      // Award freeze tokens (weekly streak milestone)
      if (progression.daily_streak > 0 && progression.daily_streak % 7 === 0) {
        const { data: inventory } = await supabase
          .from("streak_freeze_inventory")
          .select("freeze_tokens, earned_from_streak")
          .eq("user_id", user.id)
          .single();

        if (inventory) {
          await supabase
            .from("streak_freeze_inventory")
            .update({
              freeze_tokens: inventory.freeze_tokens + 1,
              earned_from_streak: inventory.earned_from_streak + 1
            })
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("streak_freeze_inventory")
            .insert({
              user_id: user.id,
              freeze_tokens: 1,
              earned_from_streak: 1,
              earned_from_level: 0
            });
        }

        notifications.push({
          user_id: user.id,
          type: 'freeze_token_earned',
          message: 'You earned a Streak Freeze token! 🧊',
          priority: 'medium'
        });
      }
    }

    // Store notifications (you would implement a notifications table)
    console.log(`Generated ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        message: `Checked activity for ${users.length} users`,
        notifications: notifications.length,
        lucky_trader_selected: Boolean(luckyTrader)
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
