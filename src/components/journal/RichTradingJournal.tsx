import { useState, useEffect } from 'react';
import { Save, FileText, Calendar, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Trade } from '@/types/trade';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedTagSelector } from './UnifiedTagSelector';
import { useXPSystem } from '@/hooks/useXPSystem';
import { trackEvent } from '@/utils/analyticsEvents';

interface JournalEntry {
  id?: string;
  trade_id?: string;
  title: string;
  content: string;
  mood: 'confident' | 'anxious' | 'neutral' | 'excited' | 'frustrated';
  tags: string[];
  lessons_learned: string;
  what_went_well: string;
  what_to_improve: string;
  rating: number;
  created_at?: string;
  updated_at?: string;
}

interface RichTradingJournalProps {
  trade?: Trade;
  existingEntry?: JournalEntry;
  onSave?: (entry: JournalEntry) => void;
}

export const RichTradingJournal = ({ trade, existingEntry, onSave }: RichTradingJournalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXP } = useXPSystem();
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<JournalEntry>({
    title: existingEntry?.title || `Journal Entry - ${new Date().toLocaleDateString()}`,
    content: existingEntry?.content || '',
    mood: existingEntry?.mood || 'neutral',
    tags: existingEntry?.tags || [],
    lessons_learned: existingEntry?.lessons_learned || '',
    what_went_well: existingEntry?.what_went_well || '',
    what_to_improve: existingEntry?.what_to_improve || '',
    rating: existingEntry?.rating || 3,
    trade_id: trade?.id,
  });

  const moods = [
    { value: 'confident', label: 'Confident', emoji: '💪' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'excited', label: 'Excited', emoji: '🎉' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
  ];

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const journalData = {
        ...entry,
        user_id: user.id,
        trade_id: trade?.id || null,
      };

      let savedEntryId = existingEntry?.id;
      const isNewEntry = !existingEntry?.id;

      if (existingEntry?.id) {
        // Update existing entry
        const { error } = await supabase
          .from('trading_journal')
          .update(journalData)
          .eq('id', existingEntry.id);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('trading_journal')
          .insert(journalData)
          .select('id')
          .single();

        if (error) throw error;
        savedEntryId = data?.id;
      }

      // Award XP for new entries only
      if (isNewEntry && savedEntryId) {
        try {
          // Check daily cap (2 entries per day)
          const { data: tierData } = await supabase
            .from('user_xp_tiers')
            .select('journal_entries_today')
            .eq('user_id', user.id)
            .single();

          const entriesLogged = tierData?.journal_entries_today || 0;

          if (entriesLogged < 2) {
            // Calculate XP
            let xpAmount = 20; // Base XP
            const bonusReasons: string[] = [];

            // +10 XP for content ≥ 50 characters
            if (entry.content.length >= 50) {
              xpAmount += 10;
              bonusReasons.push('detailed entry');
            }

            // +5 XP for each reflection field ≥ 30 characters
            if (entry.what_went_well.length >= 30) {
              xpAmount += 5;
              bonusReasons.push('what went well');
            }
            if (entry.what_to_improve.length >= 30) {
              xpAmount += 5;
              bonusReasons.push('improvements noted');
            }
            if (entry.lessons_learned.length >= 30) {
              xpAmount += 5;
              bonusReasons.push('lessons learned');
            }

            // +5 XP for ≥3 tags
            if (entry.tags.length >= 3) {
              xpAmount += 5;
              bonusReasons.push('tags added');
            }

            // +5 XP for linking to a trade
            if (trade?.id) {
              xpAmount += 5;
              bonusReasons.push('trade linked');
              trackEvent('journal_entry_linked_to_trade', {
                trade_id: trade.id,
              });
            }

            // Award XP
            const bonusText = bonusReasons.length > 0 ? ` (${bonusReasons.join(', ')})` : '';
            await addXP(
              xpAmount,
              'journal_entry',
              `Journal entry created${bonusText}`,
              true // Skip multiplier
            );

            // Mark entry as rewarded
            await supabase
              .from('trading_journal')
              .update({ xp_awarded: true })
              .eq('id', savedEntryId);

            // Increment daily counter
            await supabase.rpc('increment_journal_entries_counter', {
              p_user_id: user.id,
            });

            // Track analytics
            trackEvent('journal_entry_created', {
              xp_awarded: xpAmount,
              has_trade: !!trade?.id,
              tags_count: entry.tags.length,
              mood: entry.mood,
              is_detailed: entry.content.length >= 50,
            });

            if (bonusReasons.length > 0) {
              trackEvent('journal_entry_detailed', {
                bonus_reasons: bonusReasons,
              });
            }
          } else {
            // Daily cap reached
            trackEvent('journal_entry_daily_cap_reached', {
              entries_today: entriesLogged,
              cap_limit: 2,
            });
          }
        } catch (xpError) {
          console.error('[JournalXP] Error awarding XP:', xpError);
          // Don't fail the save if XP fails
        }
      }

      toast({
        title: 'Journal saved!',
        description: 'Your journal entry has been saved successfully.',
      });

      if (onSave) onSave(entry);
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save your journal entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Trading Journal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={entry.title}
              onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your entry a title..."
            />
          </div>

          {/* Mood & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mood">How did you feel?</Label>
              <Select
                value={entry.mood}
                onValueChange={(value: any) => setEntry(prev => ({ ...prev, mood: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Overall Rating</Label>
              <div className="flex items-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEntry(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= entry.rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Journal Entry</Label>
            <Textarea
              id="content"
              value={entry.content}
              onChange={(e) => setEntry(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write about your trading session, thoughts, emotions, market conditions..."
              rows={8}
            />
          </div>

          {/* Reflection Sections */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="went-well">What Went Well? ✅</Label>
              <Textarea
                id="went-well"
                value={entry.what_went_well}
                onChange={(e) => setEntry(prev => ({ ...prev, what_went_well: e.target.value }))}
                placeholder="What did you do right? What worked in your favor?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-improve">What To Improve? 🎯</Label>
              <Textarea
                id="to-improve"
                value={entry.what_to_improve}
                onChange={(e) => setEntry(prev => ({ ...prev, what_to_improve: e.target.value }))}
                placeholder="What could you have done better? What will you change?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessons">Lessons Learned 📚</Label>
              <Textarea
                id="lessons"
                value={entry.lessons_learned}
                onChange={(e) => setEntry(prev => ({ ...prev, lessons_learned: e.target.value }))}
                placeholder="What did you learn from this trading session?"
                rows={3}
              />
            </div>
          </div>

          {/* Tags - Unified System */}
          <UnifiedTagSelector
            selectedTags={entry.tags}
            onTagsChange={(tags) => setEntry(prev => ({ ...prev, tags }))}
          />

          {/* Trade Reference */}
          {trade && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Linked to trade:</span>
                  <Badge variant="outline">
                    {trade.symbol} - {trade.side} - ${trade.pnl?.toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Journal
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
