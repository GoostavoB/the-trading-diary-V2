import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { RichTradingJournal } from "@/components/journal/RichTradingJournal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calendar, Tag, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { SkipToContent } from "@/components/SkipToContent";

export default function Journal() {
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);

  const { data: journalEntries, refetch } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_journal')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getMoodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      confident: "😊",
      nervous: "😰",
      excited: "🤩",
      frustrated: "😤",
      calm: "😌",
      anxious: "😟",
    };
    return moods[mood] || "😐";
  };

  return (
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className="container mx-auto p-6 max-w-7xl">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" id="journal-heading">
              <BookOpen className="h-8 w-8" aria-hidden="true" />
              Trading Journal
            </h1>
            <p className="text-muted-foreground mt-1">
              Document your trades, emotions, and lessons learned
            </p>
          </div>
          <Button 
            onClick={() => {
              setShowNewEntry(true);
              setSelectedEntry(null);
            }}
            aria-label="Create new journal entry"
          >
            New Entry
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Journal Entries List */}
          <section className="lg:col-span-1" aria-labelledby="recent-entries-heading">
            <Card className="p-4">
              <h2 id="recent-entries-heading" className="font-semibold mb-4">Recent Entries</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto" role="list">
                {journalEntries?.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedEntry?.id === entry.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => {
                      setSelectedEntry(entry);
                      setShowNewEntry(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm line-clamp-1">{entry.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {entry.content}
                        </p>
                        {entry.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className={i < entry.rating ? "text-yellow-500" : "text-gray-300"}>
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{entry.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
                {!journalEntries || journalEntries.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" aria-hidden="true" />
                    <p className="text-sm">No journal entries yet</p>
                    <p className="text-xs mt-1">Start documenting your trading journey</p>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Journal Entry Editor/Viewer */}
          <section className="lg:col-span-2" aria-labelledby="journal-entry-heading">
            {showNewEntry || !selectedEntry ? (
              <RichTradingJournal
                existingEntry={selectedEntry}
                onSave={() => {
                  refetch();
                  setShowNewEntry(false);
                }}
              />
            ) : (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl" role="img" aria-label={`Mood: ${selectedEntry.mood}`}>{getMoodEmoji(selectedEntry.mood)}</span>
                      <div>
                        <h2 id="journal-entry-heading" className="text-2xl font-bold">{selectedEntry.title}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" aria-hidden="true" />
                          <time dateTime={selectedEntry.created_at}>
                            {format(new Date(selectedEntry.created_at), 'MMMM dd, yyyy')}
                          </time>
                        </div>
                      </div>
                    </div>
                    {selectedEntry.rating && (
                      <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${selectedEntry.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < selectedEntry.rating ? "text-yellow-500 text-xl" : "text-gray-300 text-xl"} aria-hidden="true">
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewEntry(true);
                    }}
                    aria-label="Edit journal entry"
                  >
                    Edit
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Content</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>

                  {selectedEntry.what_went_well && (
                    <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      What Went Well
                    </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedEntry.what_went_well}</p>
                    </div>
                  )}

                  {selectedEntry.what_to_improve && (
                    <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-600">
                      <TrendingUp className="h-4 w-4 rotate-180" aria-hidden="true" />
                      What To Improve
                    </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedEntry.what_to_improve}</p>
                    </div>
                  )}

                  {selectedEntry.lessons_learned && (
                    <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      Lessons Learned
                    </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedEntry.lessons_learned}</p>
                    </div>
                  )}

                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                    <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4" aria-hidden="true" />
                      Tags
                    </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEntry.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
