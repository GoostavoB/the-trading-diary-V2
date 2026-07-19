// Sincroniza o calendário econômico (investing.com via Apify). Esta função
// DISPARA o actor na hora (run-sync, ~7s) — não precisa de schedule no
// console do Apify. Puxa só eventos de ALTA importância dos EUA, hoje→+7d,
// horários em UTC (timeZone omitido de propósito: o actor rejeita "GMT +0:00").
// Secret: APIFY_TOKEN. Actor configurável via APIFY_ACTOR_ID.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const DEFAULT_ACTOR = 'pintostudio~economic-calendar-data-investing-com';

interface ApifyEvent {
  id: string;
  date: string;        // "DD/MM/YYYY"
  time: string;        // "HH:mm" em UTC, ou "All Day"
  zone: string | null;
  currency: string | null;
  importance: string | null;
  event: string;
}

Deno.serve(async (_req) => {
  const token = Deno.env.get('APIFY_TOKEN');
  if (!token) {
    console.error('APIFY_TOKEN não configurado');
    return json({ ok: false, error: 'missing APIFY_TOKEN' });
  }
  const actorId = Deno.env.get('APIFY_ACTOR_ID') ?? DEFAULT_ACTOR;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const day = (offsetDays: number) =>
      new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items` +
      `?token=${encodeURIComponent(token)}&timeout=120&maxTotalChargeUsd=0.50&clean=true`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeFilter: 'time_only',
          importances: 'high',
          country: 'united states',
          fromDate: day(0),
          toDate: day(7),
        }),
        signal: AbortSignal.timeout(140_000),
      },
    );
    if (!res.ok) {
      console.error('Apify fetch failed', res.status, await res.text().catch(() => ''));
      return json({ ok: false, error: `apify ${res.status}` });
    }
    const items: ApifyEvent[] = await res.json();

    let upserted = 0;
    for (const item of items) {
      if (!item?.id || !item?.date || !item?.event) continue;
      const [d, m, y] = item.date.split('/').map(Number);
      if (!d || !m || !y) continue;

      const allDay = !item.time || item.time.toLowerCase() === 'all day';
      let eventTime: string | null = null;
      if (!allDay) {
        const [hh, mm] = item.time.split(':').map(Number);
        // O actor entrega horários em UTC.
        eventTime = new Date(Date.UTC(y, m - 1, d, hh ?? 0, mm ?? 0)).toISOString();
      }

      const { error } = await supabase.from('economic_events').upsert({
        id: item.id,
        event: item.event,
        event_time: eventTime,
        all_day_date: allDay ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null,
        importance: item.importance,
        currency: item.currency,
        zone: item.zone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.error('upsert failed', item.id, error.message);
      else upserted++;
    }

    // Higiene: eventos passados há mais de 2 dias saem da tabela.
    await supabase.from('economic_events')
      .delete()
      .lt('event_time', new Date(Date.now() - 2 * 86_400_000).toISOString());

    console.log(`calendar sync: ${upserted}/${items.length} eventos`);
    return json({ ok: true, upserted, total: items.length });
  } catch (error) {
    console.error('economic-calendar-sync error', error);
    return json({ ok: false, error: String(error) });
  }
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
