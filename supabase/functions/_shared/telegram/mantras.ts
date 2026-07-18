// Os 12 mantras de Mark Douglas ("Trading in the Zone") — um por noite,
// rotação determinística pelo dia do ano, fechando o digest das 22h.

const MANTRAS: Array<{ pt: string; en: string }> = [
  {
    pt: 'O profit gap não se fecha com mais indicadores — se fecha com habilidade mental.',
    en: 'The profit gap is not closed with more indicators — it is closed with mental skills.',
  },
  {
    pt: 'Ganhar um trade qualquer um ganha. Ser vencedor é executar a série inteira.',
    en: 'Anyone can win a trade. Being a winner is executing the whole series.',
  },
  {
    pt: 'Método vencedor sem disciplina perde. O método não segura tua mão no stop.',
    en: 'A winning method without discipline loses. The method does not hold your hand at the stop.',
  },
  {
    pt: 'Padrões não preveem nada — só colocam a probabilidade a teu favor numa série.',
    en: 'Patterns predict nothing — they only put the odds in your favor over a series.',
  },
  {
    pt: 'Aceita a aleatoriedade e ganha como o cassino: a rodada é sorte, a série é matemática.',
    en: 'Accept randomness and win like the casino: the round is luck, the series is math.',
  },
  {
    pt: 'Pensa em probabilidades. A moeda viciada em 70% ainda te dá 5 coroas seguidas.',
    en: 'Think in probabilities. A 70% weighted coin still gives you 5 tails in a row.',
  },
  {
    pt: 'Todo preço é gente decidindo. Você nunca sabe quem está do outro lado do teu trade.',
    en: 'Every price is people deciding. You never know who is on the other side of your trade.',
  },
  {
    pt: 'Mente livre: no momento em que você ESPERA que este trade ganhe, o apego já entrou.',
    en: 'Free mind: the moment you EXPECT this trade to win, attachment is already in.',
  },
  {
    pt: 'O pro não pergunta "vai funcionar?" — pergunta "quanto deixo ir contra mim antes de sair?".',
    en: 'The pro does not ask "will it work?" — he asks "how far do I let it go against me?".',
  },
  {
    pt: 'Não é sobre estar certo. Um loss só diz que a maioria não compartilhou tua crença hoje.',
    en: 'It is not about being right. A loss only says the majority did not share your belief today.',
  },
  {
    pt: 'No demo você opera sem medo e foca no processo. É ASSIM que se opera a conta real.',
    en: 'On demo you trade without fear and focus on process. THAT is how to trade the real account.',
  },
  {
    pt: 'Edge é probabilidade maior numa série — nunca garantia. Edge + disciplina = arsenal completo.',
    en: 'An edge is a higher probability over a series — never a guarantee. Edge + discipline = full arsenal.',
  },
];

/** Mantra do dia: rotação pelo dia do ano no fuso do usuário (determinístico). */
export function dailyMantra(localDateStr: string, locale: string): string {
  const [y, m, d] = localDateStr.split('-').map(Number);
  const dayOfYear = Math.floor(
    (Date.UTC(y, (m ?? 1) - 1, d ?? 1) - Date.UTC(y, 0, 1)) / 86_400_000,
  );
  const mantra = MANTRAS[dayOfYear % MANTRAS.length];
  return locale === 'pt' ? mantra.pt : mantra.en;
}
