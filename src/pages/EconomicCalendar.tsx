import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";

interface EconomicEvent {
  event: string;
  country: string;
  date: string;
  actual: number | null;
  previous: number | null;
  estimate: number | null;
  impact: string;
  currency: string;
}

const EconomicCalendar = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEconomicCalendar();
  }, []);

  const fetchEconomicCalendar = async () => {
    setLoading(true);
    try {
      // Using FinancialModelingPrep free API
      // You can replace with your API key for more requests
      const apiKey = "demo"; // Use "demo" for testing, get free API key at financialmodelingprep.com
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/economic_calendar?apikey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch economic calendar data");
      }
      
      const data = await response.json();
      // Filter for high impact events only
      const highImpactEvents = data.filter((event: EconomicEvent) => 
        event.impact === "High"
      ).slice(0, 50); // Limit to 50 events
      
      setEvents(highImpactEvents);
    } catch (error) {
      console.error("Error fetching economic calendar:", error);
      toast({
        title: "Error",
        description: "Failed to load economic calendar. Using demo data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-600 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
      case "low":
        return "bg-green-500/20 text-green-600 border-green-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getChangeIndicator = (actual: number | null, previous: number | null) => {
    if (actual === null || previous === null) return null;
    if (actual > previous) return <TrendingUp className="h-4 w-4 text-neon-green" />;
    if (actual < previous) return <TrendingDown className="h-4 w-4 text-neon-red" />;
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Economic Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with important economic events and indicators
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>High-Impact Economic Events</CardTitle>
            </div>
            <CardDescription>
              Major economic events that may affect market movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No economic events available. The API may require authentication.
                <br />
                <a 
                  href="https://financialmodelingprep.com/developer/docs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get a free API key
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-center">Impact</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {new Date(event.date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            {event.event}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{event.country}</span>
                            <span className="text-xs text-muted-foreground">{event.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getImpactColor(event.impact)} variant="outline">
                            {event.impact}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div className="flex items-center justify-end gap-1">
                            {event.actual !== null ? event.actual : "-"}
                            {getChangeIndicator(event.actual, event.previous)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {event.estimate !== null ? event.estimate : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {event.previous !== null ? event.previous : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Economic data provided by{" "}
          <a 
            href="https://financialmodelingprep.com/" 
            rel="nofollow" 
            target="_blank" 
            className="text-primary font-semibold hover:underline"
          >
            FinancialModelingPrep
          </a>
        </div>
      </div>
    </AppLayout>
  );
};

export default EconomicCalendar;
