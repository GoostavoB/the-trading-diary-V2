import { Link, useParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { PublicLSRGrid, PUBLIC_ASSETS } from '@/components/public/PublicLSRGrid';

type Lang = 'pt' | 'en';

const DOMAIN = 'https://www.thetradingdiary.com';
const EN_URL = `${DOMAIN}/long-short-ratio`;
const PT_URL = `${DOMAIN}/pt/long-short-ratio`;

const meta = {
  pt: {
    title: 'Long/Short Ratio ao vivo — Bitcoin, Ouro, Prata e 24 ativos',
    description:
      'Veja em tempo real quantas pessoas estão apostando na alta ou na baixa de Bitcoin, Ethereum, Ouro, Prata e outros 20 ativos. Leitura simples, sem jargão, atualizada a cada minuto.',
  },
  en: {
    title: 'Live Long/Short Ratio — Bitcoin, Gold, Silver and 24 assets',
    description:
      'See in real time how many people are betting on the rise or fall of Bitcoin, Ethereum, Gold, Silver and 20 other assets. Plain-English reading, updated continuously.',
  },
};

/* ------------------------------------------------------------------ content */

type Section = { h2: string; body: string[] };

const intro = {
  pt: {
    h1: 'Long/Short Ratio ao vivo: quem está apostando na alta e quem está apostando na queda',
    lede:
      'Esta página mostra, em tempo real e em português simples, quantas pessoas estão posicionadas esperando alta ("longs", ou compradas) e quantas estão esperando queda ("shorts", ou vendidas) em 24 ativos — de Bitcoin e Ethereum a Ouro e Prata. Você não precisa entender de mercado financeiro para usar: cada card traz uma etiqueta direta em vez de números soltos.',
    how: 'Como ler os sinais',
    signals: [
      ['Evite compras', 'Quase todo mundo já está apostando na alta. Quando o mercado fica assim tão inclinado, o risco de uma queda repentina aumenta — por isso é um sinal de cautela para quem pensa em comprar agora.'],
      ['Evite vendas', 'Quase todo mundo já está apostando na queda. Nessa situação, o risco de um repique forte para cima aumenta — cautela para quem pensa em apostar na queda agora.'],
      ['Longs', 'A maioria das pessoas está apostando na alta, mas ainda dentro de níveis normais. É apenas a inclinação atual do mercado.'],
      ['Shorts', 'A maioria está apostando na queda, também dentro de níveis normais.'],
      ['Neutro', 'Compradores e vendedores estão equilibrados. Nenhum lado domina.'],
    ] as [string, string][],
  },
  en: {
    h1: 'Live Long/Short Ratio: who is betting on a rise and who is betting on a fall',
    lede:
      'This page shows, in real time and in plain English, how many people are positioned expecting a price rise ("longs", or buyers) and how many expect a fall ("shorts", or sellers) across 24 assets — from Bitcoin and Ethereum to Gold and Silver. You do not need any trading background: every card carries a direct label instead of raw numbers.',
    how: 'How to read the signals',
    signals: [
      ['Avoid buying', 'Almost everyone is already betting on a rise. When the market leans this far to one side, the risk of a sudden drop increases — a caution sign for anyone thinking about buying right now.'],
      ['Avoid selling', 'Almost everyone is already betting on a fall. Here the risk of a sharp bounce upward increases — caution for anyone thinking about betting on a decline right now.'],
      ['Longs', 'Most people are betting on a rise, but still within normal levels. This is simply the current tilt of the market.'],
      ['Shorts', 'Most people are betting on a fall, also within normal levels.'],
      ['Neutral', 'Buyers and sellers are balanced. Neither side dominates.'],
    ] as [string, string][],
  },
};

const sections: Record<Lang, Section[]> = {
  pt: [
    {
      h2: 'O que é o Long/Short Ratio (LSR)?',
      body: [
        'O Long/Short Ratio, ou proporção long/short, é uma conta simples: quantas pessoas estão apostando que o preço vai subir dividido por quantas estão apostando que vai cair. "Long" (ou comprado) é quem ganha se o preço subir. "Short" (ou vendido) é quem ganha se o preço cair — sim, no mercado de futuros dá para lucrar com a queda de um ativo.',
        'Se o número mostrado no card é 1,00, existe exatamente uma pessoa apostando na alta para cada pessoa apostando na queda: um empate. Se é 2,00, há duas pessoas apostando na alta para cada uma apostando na queda. Se é 0,50, é o contrário: duas apostando na queda para cada uma na alta.',
        'Os dados vêm das contas de futuros da Binance, a maior corretora de criptomoedas do mundo em volume negociado. É por isso que o número muda ao longo do dia: ele reflete o que milhões de pessoas estão realmente fazendo com o próprio dinheiro, e não uma opinião de analista.',
      ],
    },
    {
      h2: 'O que é Open Interest (contratos em aberto)?',
      body: [
        'Open Interest é o valor total em dinheiro que está "parado" dentro dessas apostas naquele momento. Pense num cassino imaginário onde todas as fichas na mesa ainda não foram sacadas: o Open Interest é a soma dessas fichas.',
        'Ele não diz para que lado o mercado vai. Diz o tamanho do interesse. Quando o Open Interest está subindo, dinheiro novo está entrando naquele ativo — mais gente se posicionando. Quando está caindo, as pessoas estão encerrando posições e tirando dinheiro da mesa.',
        'A combinação é o que interessa ao leigo: um Long/Short Ratio muito alto junto de um Open Interest muito alto significa muita gente apostando na mesma direção com muito dinheiro envolvido. É exatamente o cenário em que movimentos bruscos costumam acontecer, porque quando muitos precisam sair ao mesmo tempo, o preço se mexe rápido.',
      ],
    },
    {
      h2: 'Por que "todo mundo comprado" é um sinal de cautela?',
      body: [
        'A lógica se chama leitura contrária, e é mais intuitiva do que parece. Para o preço continuar subindo, é preciso que ainda exista gente disposta a comprar. Se praticamente todo mundo já comprou, quem sobra para comprar mais? Falta combustível — e qualquer notícia ruim faz muita gente querer sair ao mesmo tempo, derrubando o preço.',
        'O contrário vale igual. Se quase todo mundo já apostou na queda, uma alta pequena obriga esse pessoal a recomprar às pressas para limitar o prejuízo, e essas recompras empurram o preço ainda mais para cima. Por isso "Evite vendas" aparece quando o mercado está muito inclinado para o lado vendedor.',
        'Importante: isso é leitura de sentimento de mercado, não previsão. Um ativo pode ficar com "Evite compras" por dias e continuar subindo. O sinal indica que o risco está desequilibrado naquele momento, não que a virada vai acontecer hoje. Use como um termômetro, junto de outras informações — nunca como resposta única.',
      ],
    },
  ],
  en: [
    {
      h2: 'What is the Long/Short Ratio (LSR)?',
      body: [
        'The Long/Short Ratio is a simple division: how many people are betting the price will rise, divided by how many are betting it will fall. "Long" (a buyer) profits if the price goes up. "Short" (a seller) profits if the price goes down — yes, in futures markets you can profit from a falling asset.',
        'If a card shows 1.00, there is exactly one person betting on a rise for each person betting on a fall: a tie. If it shows 2.00, there are two betting on a rise for each one betting on a fall. If it shows 0.50, the opposite: two betting on a fall for each one on a rise.',
        'The data comes from futures accounts on Binance, the largest crypto exchange in the world by traded volume. That is why the number moves during the day: it reflects what millions of people are actually doing with their own money, not an analyst opinion.',
      ],
    },
    {
      h2: 'What is Open Interest?',
      body: [
        'Open Interest is the total amount of money currently parked inside those bets. Picture a table where all the chips still on it have not been cashed out: Open Interest is the sum of those chips.',
        'It does not tell you which way the market is going. It tells you how big the interest is. Rising Open Interest means new money is entering that asset — more people taking positions. Falling Open Interest means people are closing positions and taking money off the table.',
        'The combination is what matters for a beginner: a very high Long/Short Ratio together with very high Open Interest means a lot of people betting the same way with a lot of money at stake. That is exactly when sharp moves tend to happen, because when many people need to exit at once, the price moves fast.',
      ],
    },
    {
      h2: 'Why is "everyone is buying" a caution sign?',
      body: [
        'The logic is called contrarian reading, and it is more intuitive than it sounds. For a price to keep rising, there must still be people willing to buy. If nearly everyone has already bought, who is left to buy more? The fuel runs out — and any bad headline makes many people rush for the exit at once, pushing the price down.',
        'The reverse works the same way. If almost everyone has already bet on a fall, a small rise forces those people to buy back quickly to limit losses, and that buying pushes the price even higher. That is why "Avoid selling" appears when the market leans heavily to the seller side.',
        'Important: this is market sentiment, not a forecast. An asset can sit on "Avoid buying" for days and keep rising. The signal says the risk is unbalanced right now, not that a reversal happens today. Use it as a thermometer alongside other information — never as the only answer.',
      ],
    },
  ],
};

type AssetNote = { slug: string; h3: string; body: string };

const assetNotes: Record<Lang, AssetNote[]> = {
  pt: [
    {
      slug: 'bitcoin',
      h3: 'Bitcoin (BTC) — quando comprar e o que o sinal mostra',
      body: 'Bitcoin é a primeira e maior criptomoeda, criada em 2009. Funciona como uma moeda digital com quantidade máxima limitada a 21 milhões de unidades, e por isso muita gente o compara ao ouro: é escasso por desenho. É também o ativo mais líquido do mercado cripto, ou seja, o mais fácil de comprar e vender a qualquer hora. No grid acima você vê o sinal atual do Bitcoin: se está em "Evite compras", significa que a maioria esmagadora já está posicionada para a alta e o risco de correção está maior; se está em "Evite vendas", o mercado está muito pessimista e um repique fica mais provável. Isso não responde "quando comprar bitcoin" de forma definitiva — nenhuma ferramenta responde. É um ponto de partida para você evitar entrar exatamente no momento em que todo mundo já entrou.',
    },
    {
      slug: 'ethereum',
      h3: 'Ethereum (ETH) — o que é e como usar o sinal',
      body: 'Ethereum é a segunda maior criptomoeda e funciona menos como "dinheiro digital" e mais como uma plataforma: outros projetos, aplicativos financeiros e tokens são construídos em cima dela, pagando taxas em ETH. Por isso o preço do Ethereum costuma reagir tanto ao humor geral do mercado cripto quanto ao uso real da rede. Como o Bitcoin, ele tem um mercado de futuros muito grande, o que torna a leitura de Long/Short Ratio relevante. Consulte o card do Ethereum acima antes de decidir: um sinal de "Evite compras" indica que o entusiasmo já está no preço; "Neutro" indica que não há exagero para nenhum lado no momento. É informação de contexto, não recomendação de compra.',
    },
    {
      slug: 'ouro-gold',
      h3: 'Ouro (XAU) — vale a pena comprar ouro agora?',
      body: 'O ouro é a reserva de valor mais antiga que existe e costuma ser procurado quando as pessoas ficam com medo de inflação, de guerra ou de crises bancárias. Diferente das criptomoedas, ele tem séculos de histórico e oscila menos no dia a dia. No grid acima o ouro aparece com o código XAU, e o sinal vem do mercado de futuros de ouro tokenizado, que acompanha de perto o preço internacional do metal. A pergunta "vale a pena comprar ouro agora" depende do seu objetivo e do seu prazo, mas o sinal ajuda numa coisa específica: mostrar se o mercado de curto prazo já está lotado de gente apostando na mesma direção. Quando está, esperar costuma custar menos do que entrar no topo do entusiasmo.',
    },
    {
      slug: 'prata-silver',
      h3: 'Prata (XAG) — comprar prata é bom investimento?',
      body: 'A prata tem duas caras: é metal precioso, como o ouro, mas também é insumo industrial usado em painéis solares, eletrônicos e equipamentos médicos. Isso a torna mais volátil — sobe e desce mais forte do que o ouro, tanto em momentos de medo quanto em momentos de crescimento industrial. No grid acima ela aparece como XAG. Se você está pesquisando se comprar prata é bom investimento, a resposta honesta é que depende de horizonte e tolerância a oscilação; a prata costuma exigir mais paciência. O sinal de Long/Short Ratio da prata acima serve para uma decisão menor e mais prática: identificar se, neste momento específico, o mercado está esticado para um dos lados.',
    },
    {
      slug: 'solana',
      h3: 'Solana (SOL) — o que é e o que observar',
      body: 'Solana é uma rede de criptomoeda conhecida por transações rápidas e taxas muito baixas, o que a tornou popular para aplicativos financeiros e para tokens de comunidades. Em compensação, é um ativo mais novo e historicamente mais volátil que Bitcoin e Ethereum: movimentos de dois dígitos em um único dia não são raros. Justamente por isso, saber se o mercado está unilateralmente posicionado importa mais aqui do que em ativos mais calmos. Veja o card da Solana acima: quando o sinal marca "Evite compras", significa que o entusiasmo está concentrado e uma correção rápida encontra menos gente para segurar o preço. Nada disso é recomendação — é contexto de risco.',
    },
    {
      slug: 'xrp',
      h3: 'XRP (Ripple) — o que é e como interpretar',
      body: 'XRP é a criptomoeda associada à Ripple, empresa que desenvolve tecnologia de pagamentos e transferências internacionais entre instituições financeiras. O preço do XRP historicamente reage muito a notícias regulatórias e jurídicas, o que produz movimentos súbitos e desproporcionais em relação ao resto do mercado. Por isso, olhar o Long/Short Ratio do XRP tem um valor específico: quando o mercado está muito inclinado para um lado às vésperas de uma notícia, o movimento contrário tende a ser mais violento. Use o card acima como termômetro do posicionamento atual, e lembre que sentimento extremo pode durar bastante tempo antes de se resolver.',
    },
  ],
  en: [
    {
      slug: 'bitcoin',
      h3: 'Bitcoin (BTC) — when to buy and what the signal shows',
      body: 'Bitcoin is the first and largest cryptocurrency, created in 2009. It works as a digital currency capped at 21 million units, which is why many people compare it to gold: it is scarce by design. It is also the most liquid asset in crypto, meaning the easiest to buy and sell at any hour. In the grid above you can see Bitcoin\'s current signal: "Avoid buying" means the overwhelming majority is already positioned for a rise and correction risk is higher; "Avoid selling" means the market is very pessimistic and a bounce becomes more likely. This does not definitively answer "when should I buy bitcoin" — no tool does. It is a starting point that helps you avoid entering exactly when everybody else already has.',
    },
    {
      slug: 'ethereum',
      h3: 'Ethereum (ETH) — what it is and how to use the signal',
      body: 'Ethereum is the second largest cryptocurrency and works less like digital money and more like a platform: other projects, financial applications and tokens are built on top of it, paying fees in ETH. Its price therefore reacts both to the general mood of crypto and to real usage of the network. Like Bitcoin, it has a very large futures market, which makes the Long/Short Ratio reading meaningful. Check the Ethereum card above before deciding: an "Avoid buying" signal suggests enthusiasm is already priced in; "Neutral" means there is no excess on either side right now. This is context, not a buy recommendation.',
    },
    {
      slug: 'ouro-gold',
      h3: 'Gold (XAU) — is it worth buying gold now?',
      body: 'Gold is the oldest store of value there is, and demand rises when people fear inflation, war or banking crises. Unlike crypto, it has centuries of history and moves less on a daily basis. In the grid above gold appears under the code XAU, and the signal comes from the tokenised gold futures market, which tracks the international metal price closely. Whether it is worth buying gold now depends on your goal and time horizon, but the signal helps with one specific thing: showing whether the short-term market is already crowded with people betting the same way. When it is, waiting usually costs less than entering at the peak of enthusiasm.',
    },
    {
      slug: 'prata-silver',
      h3: 'Silver (XAG) — is silver a good investment?',
      body: 'Silver has two faces: it is a precious metal, like gold, but also an industrial input used in solar panels, electronics and medical equipment. That makes it more volatile — it rises and falls harder than gold, both in fearful moments and in industrial booms. In the grid above it appears as XAG. If you are researching whether silver is a good investment, the honest answer is that it depends on your horizon and tolerance for swings; silver usually demands more patience. The Long/Short Ratio signal above serves a smaller, more practical decision: telling you whether the market is stretched to one side right now.',
    },
    {
      slug: 'solana',
      h3: 'Solana (SOL) — what it is and what to watch',
      body: 'Solana is a blockchain known for fast transactions and very low fees, which made it popular for financial applications and community tokens. In exchange, it is a newer and historically more volatile asset than Bitcoin or Ethereum: double-digit moves in a single day are not rare. That is exactly why knowing whether the market is one-sided matters more here than in calmer assets. Look at the Solana card above: when the signal reads "Avoid buying", enthusiasm is concentrated and a quick correction finds fewer people to hold the price up. None of this is a recommendation — it is risk context.',
    },
    {
      slug: 'xrp',
      h3: 'XRP (Ripple) — what it is and how to read it',
      body: 'XRP is the cryptocurrency associated with Ripple, a company building payment and cross-border transfer technology for financial institutions. XRP\'s price has historically reacted strongly to regulatory and legal news, producing sudden moves out of step with the rest of the market. That gives its Long/Short Ratio a specific value: when the market leans heavily one way on the eve of news, the opposite move tends to be more violent. Use the card above as a thermometer of current positioning, and remember that extreme sentiment can last a long time before it resolves.',
    },
  ],
};

const outro = {
  pt: {
    disclaimerTitle: 'Aviso importante',
    disclaimer:
      'Esta página é uma ferramenta informativa de sentimento de mercado. Nada aqui é aconselhamento financeiro, recomendação de investimento ou promessa de resultado. Os dados vêm de uma fonte pública de terceiros e podem apresentar atraso ou falha. Investir em criptomoedas e em metais envolve risco real de perda do valor aplicado. Avalie sua situação e, se precisar, procure um profissional habilitado antes de investir.',
    ctaTitle: 'Quer ir além do grid público?',
    ctaBody:
      'O The Trading Diary é um diário de operações completo: você registra (ou importa automaticamente) suas operações, acompanha lucro real, taxa de acerto, evolução do capital e recebe análises do seu próprio comportamento. Criar conta é grátis.',
    ctaBtn: 'Criar conta grátis',
    assetsTitle: 'Guia rápido por ativo',
    assetsLede:
      'Explicações curtas dos principais ativos do grid, para quem está começando. Todos os sinais citados são os que aparecem ao vivo no topo desta página.',
    listTitle: 'Ativos acompanhados nesta página',
    updates: 'Os dados são atualizados automaticamente a cada 5 minutos enquanto a página fica aberta.',
  },
  en: {
    disclaimerTitle: 'Important notice',
    disclaimer:
      'This page is an informational market-sentiment tool. Nothing here is financial advice, an investment recommendation or a promise of results. Data comes from a public third-party source and may be delayed or unavailable. Investing in crypto and metals carries a real risk of losing the money you put in. Assess your own situation and, if needed, consult a licensed professional before investing.',
    ctaTitle: 'Want more than the public grid?',
    ctaBody:
      'The Trading Diary is a complete trading journal: log (or automatically import) your trades, track real profit, win rate, capital growth and get analytics on your own behaviour. Creating an account is free.',
    ctaBtn: 'Create a free account',
    assetsTitle: 'Quick guide by asset',
    assetsLede:
      'Short explanations of the main assets in the grid, for beginners. Every signal mentioned is the one shown live at the top of this page.',
    listTitle: 'Assets tracked on this page',
    updates: 'Data refreshes automatically every 5 minutes while the page stays open.',
  },
};

/* --------------------------------------------------------------------- page */

export default function PublicLongShortRatio() {
  const params = useParams();
  const lang: Lang = params.lang === 'pt' ? 'pt' : 'en';
  const t = intro[lang];
  const o = outro[lang];
  const canonical = lang === 'pt' ? PT_URL : EN_URL;

  return (
    <>
      <SEO
        title={meta[lang].title}
        description={meta[lang].description}
        canonical={canonical}
        hreflang={[
          { lang: 'en', url: EN_URL },
          { lang: 'pt', url: PT_URL },
          { lang: 'x-default', url: EN_URL },
        ]}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
          {/* Header */}
          <header className="space-y-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Link to={lang === 'pt' ? '/pt' : '/'} className="text-sm font-semibold text-gradient-electric">
                The Trading Diary
              </Link>
              <nav aria-label="Language" className="flex items-center rounded-full border border-border/60 overflow-hidden text-xs font-semibold">
                <Link
                  to="/pt/long-short-ratio"
                  className={`px-3 py-1.5 ${lang === 'pt' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                  hrefLang="pt"
                >
                  PT
                </Link>
                <span className="w-px h-4 bg-border/60" />
                <Link
                  to="/long-short-ratio"
                  className={`px-3 py-1.5 ${lang === 'en' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                  hrefLang="en"
                >
                  EN
                </Link>
              </nav>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-4xl">{t.h1}</h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">{t.lede}</p>
          </header>

          {/* Live grid */}
          <section aria-label="Live grid" className="space-y-4">
            <PublicLSRGrid lang={lang} />
            <p className="text-xs text-muted-foreground">{o.updates}</p>
          </section>

          {/* Signal legend */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">{t.how}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.signals.map(([label, text]) => (
                <div key={label} className="card-premium p-4">
                  <p className="font-semibold mb-1">{label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Educational blocks */}
          {sections[lang].map((s) => (
            <section key={s.h2} className="space-y-3 max-w-3xl">
              <h2 className="text-2xl font-bold">{s.h2}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} className="text-base text-muted-foreground leading-relaxed">
                  {p}
                </p>
              ))}
            </section>
          ))}

          {/* Per-asset SEO sections */}
          <section className="space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-2xl font-bold">{o.assetsTitle}</h2>
              <p className="text-base text-muted-foreground leading-relaxed">{o.assetsLede}</p>
            </div>
            <div className="space-y-6">
              {assetNotes[lang].map((a) => (
                <article key={a.slug} className="max-w-3xl space-y-2">
                  <h3 className="text-lg font-semibold">
                    <a href={`#ativo-${a.slug}`} className="hover:text-primary transition-colors">
                      {a.h3}
                    </a>
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{a.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Full asset list */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">{o.listTitle}</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {PUBLIC_ASSETS.map((a) => (
                <li key={a.symbol}>
                  <a
                    href={`#ativo-${a.slug}`}
                    className="inline-block rounded-full border border-border/60 px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    {lang === 'pt' ? a.namePt : a.nameEn} ({a.ticker})
                  </a>
                </li>
              ))}
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5 max-w-3xl space-y-2">
            <h2 className="text-base font-bold text-amber-300">{o.disclaimerTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{o.disclaimer}</p>
          </section>

          {/* CTA */}
          <section className="card-premium p-6 space-y-3 max-w-3xl">
            <h2 className="text-xl font-bold">{o.ctaTitle}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{o.ctaBody}</p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {o.ctaBtn}
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
