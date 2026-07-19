// Sincroniza o calendário econômico a partir do actor do Apify
// (investing.com scraper) que o usuário agenda no próprio Apify.
// Roda 1x/dia (config.toml) e puxa o dataset da ÚLTIMA execução bem-sucedida
// — não dispara o actor, só lê o resultado. Secrets: APIFY_TOKEN e
// APIFY_ACTOR_ID (ex.: "usuario~economic-calendar-data-investing-com").

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
  const actorId = Deno.env.get('APIFY_ACTOR_ID');
  if (!token || !actorId) {
    console.error('APIFY_TOKEN/APIFY_ACTOR_ID não configurados');
    return json({ ok: false, error: 'missing secrets' });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs/last/dataset/items` +
      `?token=${encodeURIComponent(token)}&status=SUCCEEDED&clean=true`,
      { signal: AbortSignal.timeout(30_000) },
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
