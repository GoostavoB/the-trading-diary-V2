import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { DevelopmentBadge } from "@/components/DevelopmentBadge";
import { Calendar, TrendingUp, TrendingDown, Clock, Bell, BellOff } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";

interface EconomicEvent {
  CalendarId: string;
  Date: string;
  Country: string;
  Category: string;
  Event: string;
  Reference: string;
  Actual: string | null;
  Previous: string | null;
  Forecast: string | null;
  TEForecast: string | null;
  Importance: number;
  LastUpdate: string;
  Currency: string;
  Unit: string;
  Source: string;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (GMT-5/-4)" },
  { value: "America/Chicago", label: "Central Time (GMT-6/-5)" },
  { value: "America/Denver", label: "Mountain Time (GMT-7/-6)" },
  { value: "America/Los_Angeles", label: "Pacific Time (GMT-8/-7)" },
  { value: "America/Sao_Paulo", label: "Brasil (GMT-3)" },
  { value: "Europe/London", label: "London (GMT+0/+1)" },
  { value: "Europe/Paris", label: "Paris (GMT+1/+2)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (GMT+8)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (GMT+8)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
  { value: "Australia/Sydney", label: "Sydney (GMT+10/+11)" },
  { value: "UTC", label: "UTC (GMT+0)" },
];

const EconomicCalendar = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const { toast } = useToast();
  const { permission, requestPermission, addReminder, removeReminder, hasReminder } = useNotifications();

  useEffect(() => {
    fetchEconomicCalendar();
  }, []);

  const fetchEconomicCalendar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('economic-calendar-proxy');

      if (error) throw error;
      
      if (data?.success && data?.data) {
        setEvents(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching economic calendar:', err);
      toast({
        title: "Error",
        description: "Unable to fetch economic calendar data. Please try again later.",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (importance: number) => {
    switch (importance) {
      case 3:
        return "bg-red-500/20 text-red-600 border-red-500/50";
      case 2:
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
      case 1:
        return "bg-green-500/20 text-green-600 border-green-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getImportanceLabel = (importance: number) => {
    switch (importance) {
      case 3: return "High";
      case 2: return "Medium";
      case 1: return "Low";
      default: return "Unknown";
    }
  };

  const parseValue = (value: string | null) => {
    if (!value) return null;
    // Remove currency symbols and units, parse the number
    const cleaned = value.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned);
  };

  const getChangeIndicator = (actual: string | null, previous: string | null) => {
    const actualNum = parseValue(actual);
    const previousNum = parseValue(previous);
    if (actualNum === null || previousNum === null) return null;
    if (actualNum > previousNum) return <TrendingUp className="h-4 w-4 text-neon-green" />;
    if (actualNum < previousNum) return <TrendingDown className="h-4 w-4 text-neon-red" />;
    return null;
  };

  const handleReminderToggle = async (event: EconomicEvent) => {
    const eventDate = new Date(event.Date);
    const hasReminderSet = hasReminder(event.Event, eventDate);

    if (hasReminderSet) {
      await removeReminder(event.Event, eventDate);
    } else {
      await addReminder(
        event.Event,
        eventDate,
        event.Category,
        getImportanceLabel(event.Importance)
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Economic Calendar</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with important economic events and indicators
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {permission !== 'granted' && (
              <Button
                onClick={requestPermission}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Bell className="h-4 w-4" />
                Ativar Notificações
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>United States Economic Events</CardTitle>
              <DevelopmentBadge />
            </div>
            <CardDescription>
              High-impact economic events from the United States
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
                No economic events available. Please verify your API key.
                <br />
                <a 
                  href="https://tradingeconomics.com/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get a free API key at Trading Economics
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Impact</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Forecast</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                      <TableHead className="text-center">Reminder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.CalendarId} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {formatInTimeZone(new Date(event.Date), timezone, 'MMM dd, yyyy h:mm a')}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-medium">{event.Event}</span>
                            <span className="text-xs text-muted-foreground">{event.Reference}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{event.Category}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getImpactColor(event.Importance)} variant="outline">
                            {getImportanceLabel(event.Importance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          <div className="flex items-center justify-end gap-1">
                            {event.Actual || "-"}
                            {getChangeIndicator(event.Actual, event.Previous)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {event.Forecast || event.TEForecast || "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {event.Previous || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReminderToggle(event)}
                            className="h-8 w-8 p-0"
                          >
                            {hasReminder(event.Event, new Date(event.Date)) ? (
                              <BellOff className="h-4 w-4 text-primary" />
                            ) : (
                              <Bell className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
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
            href="https://tradingeconomics.com/" 
            rel="nofollow" 
            target="_blank" 
            className="text-primary font-semibold hover:underline"
          >
            Trading Economics
          </a>
        </div>
      </div>
    </AppLayout>
  );
};

export default EconomicCalendar;
