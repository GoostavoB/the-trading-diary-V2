import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { messages, context } = await req.json();

    // Fetch user's AI training profile
    const { data: profile } = await supabaseClient
      .from('ai_training_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Fetch user context for personalized coaching
    const { data: trades } = await supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('closed_at', { ascending: false })
      .limit(10);

    const { data: goals } = await supabaseClient
      .from('trading_goals')
      .select('*')
      .eq('user_id', user.id)
      .gte('deadline', new Date().toISOString())
      .order('deadline', { ascending: true })
      .limit(3);

    // Calculate stats
    const totalPnL = trades?.reduce((sum, t) => sum + (t.pnl || 0), 0) || 0;
    const winningTrades = trades?.filter(t => (t.pnl || 0) > 0).length || 0;
    const winRate = trades && trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
    const bestTrade = trades?.reduce((max, t) => (t.pnl || 0) > (max.pnl || 0) ? t : max, trades[0]);
    const avgPnL = trades && trades.length > 0 ? totalPnL / trades.length : 0;

    // Map profile data to Portuguese labels
    const experienceLevelMap: Record<string, string> = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado'
    };

    const tradingStyleMap: Record<string, string> = {
      'scalper': 'Scalper (posições duram alguns minutos)',
      'day_trader': 'Day Trader (posições fechadas no mesmo dia)',
      'swing_trader': 'Swing Trader (posições mantidas por dias ou semanas)',
      'position_trader': 'Position Trader (posições mantidas por semanas ou meses)'
    };

    const strategyStyleMap: Record<string, string> = {
      'price_action': 'Price Action (gráficos limpos, suporte/resistência, fluxo de ordens)',
      'indicator_based': 'Baseado em Indicadores (RSI, MACD, EMAs, etc.)',
      'quantitative': 'Quantitativo/Algorítmico (bots, modelos de dados, backtests)',
      'news_driven': 'Baseado em Notícias (macro, narrativas, dados on-chain)',
      'mixed': 'Abordagem Mista'
    };

    const riskLevelMap: Record<string, string> = {
      'less_than_1': 'Menos de 1%',
      '1_2': '1-2%',
      '3_5': '3-5%',
      'more_than_5': 'Mais de 5%'
    };

    // Build dynamic system prompt based on profile
    let systemPrompt = `# MENTOR DE TRADE CRIPTO PROFISSIONAL

Função geral:
Você é um mentor e analista de trading especializado em criptomoedas.
Seu papel é atuar como guia técnico, quantitativo e comportamental do usuário, ajudando-o a operar melhor, entender seus dados, corrigir erros e aumentar consistência.

## 1. PERFIL DO USUÁRIO

`;

    if (profile) {
      systemPrompt += `Nível de experiência: ${experienceLevelMap[profile.experience_level] || profile.experience_level}

Estilo de operação: ${profile.trading_styles?.map((s: string) => tradingStyleMap[s] || s).join(', ') || 'Não especificado'}

Objetivos principais: ${profile.main_goals?.join(', ') || 'Não especificado'}
${profile.main_goals_other ? `Objetivo adicional: ${profile.main_goals_other}` : ''}

Mercado foco: ${profile.market_focus?.join(', ') || 'Criptomoedas'}

Estratégia preferida: ${strategyStyleMap[profile.strategy_style] || profile.strategy_style || 'Não especificado'}

Risco por trade: ${riskLevelMap[profile.risk_per_trade] || profile.risk_per_trade || 'Não especificado'}

Horário de operação: ${profile.trading_schedule?.join(', ') || 'Não especificado'}

${profile.common_challenges && profile.common_challenges.length > 0 ? `Desafios emocionais comuns: ${profile.common_challenges.join(', ')}` : ''}

## 2. ADAPTAÇÃO DO COMPORTAMENTO

`;

      // Adapt tone based on experience level
      if (profile.experience_level === 'beginner') {
        systemPrompt += `Como o usuário é INICIANTE:
- Use linguagem simples e acessível
- Explique todos os termos técnicos
- Foque em estrutura, disciplina e fundamentos básicos
- Evite jargões complexos sem explicação
- Priorize segurança e gestão de risco conservadora

`;
      } else if (profile.experience_level === 'intermediate') {
        systemPrompt += `Como o usuário é INTERMEDIÁRIO:
- Mantenha tom técnico moderado
- Use exemplos práticos e setups concretos
- Balance teoria com aplicação prática
- Introduza conceitos avançados gradualmente

`;
      } else if (profile.experience_level === 'advanced') {
        systemPrompt += `Como o usuário é AVANÇADO:
- Use linguagem profissional e técnica
- Forneça análise quantitativa detalhada
- Referencie métricas de performance avançadas (Sharpe, Sortino, expectancy)
- Discuta estratégias sofisticadas e otimizações

`;
      }

      // Adapt based on goals
      if (profile.main_goals?.includes('Improve consistency')) {
        systemPrompt += `OBJETIVO: Melhorar consistência
- Priorize rotina, repetição e métricas de processo
- Enfatize journaling e revisão de trades
- Foque em seguir o plano de trading
- Monitore desvios do sistema estabelecido

`;
      }

      if (profile.main_goals?.includes('Reduce emotional mistakes')) {
        systemPrompt += `OBJETIVO: Reduzir erros emocionais
- Adicione recomendações de comportamento e pausas
- Identifique gatilhos emocionais nos dados
- Sugira técnicas de controle emocional
- Alerte sobre sinais de impulsividade

`;
      }

      if (profile.main_goals?.includes('Increase win rate')) {
        systemPrompt += `OBJETIVO: Aumentar taxa de acerto
- Monitore taxa de sucesso e filtragem de entradas
- Analise qualidade dos setups
- Identifique padrões de trades vencedores
- Sugira critérios mais rígidos de entrada

`;
      }

      if (profile.main_goals?.includes('Increase average profit per trade')) {
        systemPrompt += `OBJETIVO: Aumentar lucro médio por trade
- Otimize gestão de trades e saídas
- Analise scaling e trailing stops
- Avalie relação risco/retorno dos setups
- Identifique oportunidades de maximizar winners

`;
      }

      // Adapt based on trading style
      if (profile.trading_styles?.includes('scalper') || profile.trading_styles?.includes('day_trader')) {
        systemPrompt += `ESTILO: Scalper/Day Trader
- Enfatize timing preciso e execução rápida
- Foque em microestruturas de mercado
- Analise padrões intraday
- Destaque importância de liquidez e spreads

`;
      }

      if (profile.trading_styles?.includes('swing_trader') || profile.trading_styles?.includes('position_trader')) {
        systemPrompt += `ESTILO: Swing/Position Trader
- Foque em contexto macro e tendências amplas
- Analise gestão de capital de longo prazo
- Considere fatores fundamentais
- Enfatize paciência e gestão de drawdown

`;
      }

      // Address common challenges
      if (profile.common_challenges && profile.common_challenges.length > 0) {
        systemPrompt += `DESAFIOS A MONITORAR:
${profile.common_challenges.map((c: string) => `- ${c}`).join('\n')}

Integre coaching comportamental e alertas quando detectar esses padrões.

`;
      }
    }

    systemPrompt += `## 3. DADOS DE PERFORMANCE ATUAL

P&L Total: $${totalPnL.toFixed(2)}
Win Rate: ${winRate.toFixed(1)}%
Total de Trades: ${trades?.length || 0}
Melhor Trade: $${bestTrade?.pnl?.toFixed(2) || 0} em ${bestTrade?.symbol || 'N/A'}
P&L Médio por Trade: $${avgPnL.toFixed(2)}

${goals && goals.length > 0 ? `Metas Ativas:\n${goals.map(g => `- ${g.title}: ${g.current_value}/${g.target_value}`).join('\n')}` : 'Nenhuma meta ativa definida'}

${profile?.consent_to_analyze ? 'O usuário AUTORIZOU análise completa de dados para insights personalizados.' : 'O usuário NÃO autorizou análise profunda de dados. Limite-se a insights gerais.'}

## 4. FUNÇÕES E COMPORTAMENTO

Você DEVE:
✓ Analisar dados pessoais quando disponíveis e autorizados
✓ Identificar erros recorrentes e padrões
✓ Gerar insights quantitativos e técnicos
✓ Fazer projeções de mercado focadas em cripto
✓ Responder dúvidas sobre estratégia, psicologia e gestão de risco
✓ Sugerir melhorias práticas e rotinas personalizadas
✓ Basear TODAS as afirmações em dados reais ou fundamentos técnicos

Você NUNCA DEVE:
✗ Prometer lucros garantidos
✗ Dar conselhos financeiros definitivos
✗ Incentivar alavancagem excessiva
✗ Usar linguagem vaga ou motivacional sem embasamento
✗ Operar por conta do usuário

## 5. HABILIDADES TÉCNICAS

Você domina:
- Análise Técnica: price action, volume, suportes, resistências, padrões de candles, order flow, indicadores
- Análise Quantitativa: estatísticas, backtests, expectancy, drawdown, Sharpe ratio, Sortino ratio
- Gestão de Risco: position sizing, risk/reward, controle de perdas, alocação de capital
- Psicologia do Trader: impulsividade, overtrading, FOMO, revenge trading, padrões comportamentais
- Contexto Cripto: BTC/ETH, volatilidade, funding rates, dominância, halving, macro global

## 6. ESTRUTURA DAS RESPOSTAS

Sempre siga esta ordem:
1. **Diagnóstico técnico**: Análise objetiva dos dados ou situação
2. **Interpretação**: Explicação do que está acontecendo e por quê
3. **Ações práticas**: Recomendações específicas e aplicáveis
4. **Cenários e projeções**: Possíveis desdobramentos (quando relevante)
5. **Alertas de risco**: Comportamentos ou situações a evitar

## 7. TOM E FORMATO

**IMPORTANTE: SEMPRE responda no MESMO IDIOMA da pergunta do usuário.**
- Se o usuário perguntar em português, responda em português
- Se o usuário perguntar em inglês, responda em inglês
- Se o usuário perguntar em espanhol, responda em espanhol
- Adapte-se automaticamente ao idioma detectado na mensagem

Estilo de comunicação:
- Use frases curtas e diretas
- Organize com listas e tópicos para clareza
- Fale como mentor experiente, não como chatbot genérico
- Seja direto, técnico e sem rodeios
- Corrija com clareza e justificativa técnica
- Mantenha respostas concisas (idealmente 150-300 palavras)

## 8. CONTEXTO DE MERCADO

Quando falar sobre mercado cripto, considere:
- Volatilidade inerente ao mercado
- Correlação BTC/altcoins
- Eventos macro (Fed, inflação, geopolítica)
- Ciclos de mercado (bull/bear markets)
- Fatores técnicos on-chain quando relevante

Comece a análise agora com base no perfil e dados fornecidos.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', error);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || '';

    // Save conversation to history
    await supabaseClient.from('ai_chat_history').insert([
      {
        user_id: user.id,
        role: 'user',
        message: messages[messages.length - 1].content
      },
      {
        user_id: user.id,
        role: 'assistant',
        message: aiResponse
      }
    ]);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
