import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { PremiumFeatureLock } from '@/components/PremiumFeatureLock';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { SkipToContent } from '@/components/SkipToContent';

interface LeaderboardEntry {
  user_id: string;
  rank: number;
  performance_score: number;
  roi: number;
  win_rate: number;
  consistency_index: number;
  profile?: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

const Leaderboard = () => {
  const { user } = useAuth();
  const { isFeatureLocked } = useSubscription();
  const isPremiumLocked = isFeatureLocked('pro');
  const [currentSeason, setCurrentSeason] = useState<any>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchLeaderboard();
  }, [user, activeTab]);

  const fetchLeaderboard = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch active season
      const { data: season } = await supabase
        .from('seasonal_competitions')
        .select('*')
        .eq('is_active', true)
        .single();
      
      setCurrentSeason(season);

      // Fetch leaderboard entries
      const query = supabase
        .from('leaderboard_entries')
        .select('*')
        .order('rank', { ascending: true })
        .limit(50);

      if (season) {
        query.eq('season_id', season.id);
      }

      const { data } = await query;
      
      if (data) {
        // Fetch profiles separately
        const entriesWithProfiles = await Promise.all(
          data.map(async (entry: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url, username')
              .eq('id', entry.user_id)
              .single();
            
            return { ...entry, profile };
          })
        );
        
        setEntries(entriesWithProfiles as LeaderboardEntry[]);
        
        // Find user's rank
        const myRank = entriesWithProfiles.find((e: any) => e.user_id === user.id);
        setUserRank(myRank || null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPodiumColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-amber-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return 'from-muted to-muted';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />;
    return <Trophy className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <AppLayout>
      <SkipToContent />
      <PremiumFeatureLock requiredPlan="pro" isLocked={isPremiumLocked}>
        <main id="main-content" className="container mx-auto p-6 max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" id="leaderboard-heading">
              <Trophy className="w-8 h-8 text-primary" aria-hidden="true" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {currentSeason ? `${currentSeason.season_name} Season` : 'All-Time Rankings'}
            </p>
          </div>
          {userRank && (
            <Badge variant="outline" className="text-lg px-4 py-2" aria-label={`Your rank: ${userRank.rank}`}>
              Your Rank: #{userRank.rank}
            </Badge>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Current Season
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              All-Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6" role="region" aria-labelledby="leaderboard-rankings-heading">
            <h2 id="leaderboard-rankings-heading" className="sr-only">Leaderboard Rankings</h2>
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <section className="grid grid-cols-3 gap-4 mb-8" aria-labelledby="top-three-heading">
                <h3 id="top-three-heading" className="sr-only">Top 3 Traders</h3>
                {[1, 0, 2].map((idx) => {
                  const entry = entries[idx];
                  if (!entry) return null;
                  
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${idx === 0 ? 'col-start-2' : ''}`}
                    >
                      <Card className={`
                        relative p-6 text-center
                        bg-gradient-to-br ${getPodiumColor(entry.rank)}
                        text-primary-foreground border-0 overflow-hidden
                      `} role="article" aria-label={`Rank ${entry.rank}: ${entry.profile?.username || entry.profile?.full_name || 'Anonymous'} with score ${entry.performance_score}`}>
                        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
                        <div className="relative z-10">
                          <div className="mb-4 flex justify-center" role="img" aria-label={`Rank ${entry.rank} medal`}>
                            {getRankIcon(entry.rank)}
                          </div>
                          <Avatar className="w-20 h-20 mx-auto mb-3 border-4 border-white/30">
                            <AvatarImage src={entry.profile?.avatar_url} alt={`${entry.profile?.username || entry.profile?.full_name || 'Anonymous'} avatar`} />
                            <AvatarFallback>
                              {entry.profile?.username?.[0] || entry.profile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-bold text-lg">
                            {entry.profile?.username || entry.profile?.full_name || 'Anonymous'}
                          </h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="opacity-90">Score:</span>
                              <span className="font-bold">{entry.performance_score.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="opacity-90">ROI:</span>
                              <span className="font-bold">{entry.roi.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="opacity-90">Win Rate:</span>
                              <span className="font-bold">{entry.win_rate.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </section>
            )}

            {/* Remaining Rankings */}
            <div className="space-y-2">
              {entries.slice(3).map((entry, idx) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`
                    p-4 hover:scale-[1.01] transition-all
                    ${entry.user_id === user?.id ? 'ring-2 ring-primary' : ''}
                  `}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 min-w-[100px]">
                        <div className="text-2xl font-bold text-muted-foreground w-12 text-center">
                          #{entry.rank}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={entry.profile?.avatar_url} />
                          <AvatarFallback>
                            {entry.profile?.username?.[0] || entry.profile?.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {entry.profile?.username || entry.profile?.full_name || 'Anonymous'}
                          {entry.user_id === user?.id && (
                            <Badge variant="secondary" className="ml-2">You</Badge>
                          )}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Score: {entry.performance_score.toFixed(1)}
                          </span>
                          <span>ROI: {entry.roi.toFixed(1)}%</span>
                          <span>Win: {entry.win_rate.toFixed(1)}%</span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-primary">
                        {entry.consistency_index.toFixed(0)}% Consistent
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {loading && (
              <div className="text-center py-12 text-muted-foreground">
                Loading rankings...
              </div>
            )}

            {!loading && entries.length === 0 && (
              <Card className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No Rankings Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to climb the leaderboard! Start trading to earn your rank.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      </PremiumFeatureLock>
    </AppLayout>
  );
};

export default Leaderboard;
