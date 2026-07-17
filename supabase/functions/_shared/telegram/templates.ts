// Message templates for the mentor bot, isolated from handler logic.
// Spec §4 asks for .md files; we use a TS module instead so templates ship
// inside the eszip bundle without extra static-file config. Same rule applies:
// templates NEVER inline in handler code — they all live here.
//
// Rendering: {{var}} placeholders. Locale: 'pt' for Gustavo-style Portuguese,
// everything else falls back to English. Tone (spec §13): kind, blunt trading
// buddy. Honest about losses, never toxic-positive, numbers first.

export type Locale = 'en' | 'pt';

type TemplateSet = Record<string, Record<Locale, string>>;

const T: TemplateSet = {
  onboarding: {
    en: `✅ <b>Connected!</b>

I'm your trading mentor. I'll ping you:
• when your day closes — nightly digest at {{digestHour}}:00 your time
• weekly recap on Sundays

Commands: /today · /week · /stats · /mute · /help

I read your numbers straight from The Trading Diary. No sugarcoating.`,
    pt: `✅ <b>Conectado!</b>

Sou seu mentor de trading. Vou te chamar:
• no fechamento do dia — resumo às {{digestHour}}:00 no seu fuso
• recap semanal aos domingos

Comandos: /today · /week · /stats · /mute · /help

Leio seus números direto do The Trading Diary. Sem dourar a pílula.`,
  },

  help: {
    en: `<b>Commands</b>
/today — today's P&L and trades
/week — this week's stats
/stats — all-time stats
/mute — pause alerts for 2h (or /mute 4h)
/unmute — resume alerts
/help — this list

Free-form questions are coming soon.`,
    pt: `<b>Comandos</b>
/today — P&L e trades de hoje
/week — estatísticas da semana
/stats — estatísticas gerais
/mute — pausa alertas por 2h (ou /mute 4h)
/unmute — retoma alertas
/help — esta lista

Perguntas em texto livre chegam em breve.`,
  },

  not_linked: {
    en: `This chat isn't linked to a Trading Diary account yet.

Go to <b>thetradingdiary.com → Settings → Telegram</b> and tap "Connect Telegram".`,
    pt: `Este chat ainda não está vinculado a uma conta do Trading Diary.

Vá em <b>thetradingdiary.com → Settings → Telegram</b> e toque em "Conectar Telegram".`,
  },

  link_invalid: {
    en: `That link token is invalid or expired (they last 15 minutes). Generate a new one in Settings → Telegram.`,
    pt: `Esse token de vínculo é inválido ou expirou (dura 15 minutos). Gere outro em Settings → Telegram.`,
  },

  daily_digest: {
    en: `📊 <b>Today · {{date}}</b>
━━━━━━━━━━━━━━━━━
P&L      {{pnl}}
Trades   {{trades}} · {{wins}}W / {{losses}}L
Best     {{best}}
Worst    {{worst}}

{{comment}}`,
    pt: `📊 <b>Hoje · {{date}}</b>
━━━━━━━━━━━━━━━━━
P&L      {{pnl}}
Trades   {{trades}} · {{wins}}W / {{losses}}L
Melhor   {{best}}
Pior     {{worst}}

{{comment}}`,
  },

  weekly_digest: {
    en: `📈 <b>Week recap · {{range}}</b>
━━━━━━━━━━━━━━━━━
P&L        {{pnl}}
Trades     {{trades}} · {{wins}}W / {{losses}}L
Win rate   {{winRate}}
Best       {{best}}
Worst      {{worst}}

{{comment}}`,
    pt: `📈 <b>Recap da semana · {{range}}</b>
━━━━━━━━━━━━━━━━━
P&L        {{pnl}}
Trades     {{trades}} · {{wins}}W / {{losses}}L
Taxa       {{winRate}}
Melhor     {{best}}
Pior       {{worst}}

{{comment}}`,
  },

  trade_closed_alert: {
    en: `{{emoji}} Trade closed: <b>{{symbol}}</b> {{pnl}}{{roi}}
{{comment}}`,
    pt: `{{emoji}} Trade fechado: <b>{{symbol}}</b> {{pnl}}{{roi}}
{{comment}}`,
  },

  today_empty: {
    en: `No trades today. Sometimes the best trade is no trade.`,
    pt: `Nenhum trade hoje. Às vezes o melhor trade é trade nenhum.`,
  },

  stats: {
    en: `📊 <b>All-time</b>
━━━━━━━━━━━━━━━━━
Trades     {{trades}}
Win rate   {{winRate}}
Net P&L    {{pnl}}
Avg ROI    {{avgRoi}}`,
    pt: `📊 <b>Geral</b>
━━━━━━━━━━━━━━━━━
Trades     {{trades}}
Taxa       {{winRate}}
P&L total  {{pnl}}
ROI médio  {{avgRoi}}`,
  },

  muted: {
    en: `🔕 Alerts muted until {{until}}. /unmute to resume.`,
    pt: `🔕 Alertas pausados até {{until}}. /unmute para retomar.`,
  },

  unmuted: {
    en: `🔔 Alerts back on.`,
    pt: `🔔 Alertas religados.`,
  },

  free_text_soon: {
    en: `I can't answer free-form questions yet — that's coming soon. For now: /today, /week, /stats.`,
    pt: `Ainda não respondo perguntas em texto livre — isso chega em breve. Por enquanto: /today, /week, /stats.`,
  },

  lesson_saved: {
    en: `📚 Learned. I'll hold you to it in future analyses.`,
    pt: `📚 Aprendido. Vou te cobrar isso nas próximas análises.`,
  },

  mentor_error: {
    en: `⚠️ My analysis engine choked on that one. Try again in a minute.`,
    pt: `⚠️ Meu motor de análise engasgou nessa. Tenta de novo em um minuto.`,
  },
};

export function render(
  name: keyof typeof T,
  locale: string | null | undefined,
  vars: Record<string, string | number> = {},
): string {
  const loc: Locale = locale === 'pt' ? 'pt' : 'en';
  let text = T[name][loc];
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{{${key}}}`, String(value));
  }
  return text;
}
