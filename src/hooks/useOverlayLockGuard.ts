import { useEffect } from 'react';

/**
 * Destrava a página quando um overlay do Radix não desmonta.
 *
 * O PROBLEMA (medido, não suposto)
 *
 * Dialog, Sheet, Popover e DropdownMenu do Radix trancam a página enquanto
 * estão abertos: põem `pointer-events: none` no <body> e deixam um overlay
 * `fixed inset-0` por cima de tudo. Quem desfaz isso é o `Presence`, e ele só
 * desmonta o overlay quando a animação de saída dispara `animationend`.
 *
 * Se essa animação não completa, nada disso é desfeito. E ela não completa
 * sempre que a aba deixa de ser pintada — trocar de aba ou de aplicativo
 * enquanto o drawer está fechando basta: a animação fica `running` com
 * `currentTime: 0`, congelada, e o `animationend` nunca chega.
 *
 * O resultado é uma página que parece normal e não responde a clique nenhum,
 * sem erro no console. Fechar o Risk Copilot e trocar de aba reproduz.
 *
 * A SOLUÇÃO
 *
 * Um vigia global: sempre que não houver nenhuma camada modal ABERTA, o body
 * não pode estar trancado nem sobrar overlay capturando clique. A checagem roda
 * quando o DOM do body muda e — o momento que importa — quando a aba volta a
 * ficar visível, que é exatamente quando o usuário reencontra a tela morta.
 *
 * Só age quando não há camada aberta, então nunca destrava um modal legítimo.
 * Neutraliza o overlay órfão por estilo em vez de removê-lo do DOM: o nó é do
 * React, e arrancá-lo faria o React quebrar ao tentar removê-lo depois.
 */

/** Camadas que de fato trancam a página. `data-state` é o que o Radix mantém. */
const CAMADA_ABERTA = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="menu"][data-state="open"]',
  '[role="listbox"][data-state="open"]',
].join(',');

const OVERLAY_FECHADO = 'div[data-state="closed"].fixed.inset-0';

/** Modais de verdade (Dialog e Sheet). Menu e listbox ficam de fora: nem todo
 *  popover e modal, e forcar trava neles quebraria o comportamento normal. */
const MODAL_ABERTO = '[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"]';

export function sincronizarTrava(): boolean {
  let agiu = false;

  if (document.querySelector(CAMADA_ABERTA)) {
    // Ha camada aberta: o body TEM que estar trancado. Depois que este vigia
    // limpa uma trava orfa, a contabilidade interna do Radix fica adiantada --
    // ele so aplica o estilo na primeira camada, e passa a achar que ja aplicou.
    // Sem isto, o proximo modal abriria sem bloquear o que esta atras dele.
    if (document.querySelector(MODAL_ABERTO) && document.body.style.pointerEvents !== 'none') {
      document.body.style.pointerEvents = 'none';
      agiu = true;
    }
    return agiu;
  }

  if (document.body.style.pointerEvents === 'none') {
    document.body.style.removeProperty('pointer-events');
    agiu = true;
  }

  document.querySelectorAll<HTMLElement>(OVERLAY_FECHADO).forEach((el) => {
    if (el.style.pointerEvents !== 'none') {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      agiu = true;
    }
  });

  return agiu;
}

export function useOverlayLockGuard() {
  useEffect(() => {
    // Espera um quadro antes de agir: no instante em que um modal abre, o
    // conteudo pode ainda nao ter recebido data-state="open", e destravar ali
    // desligaria a trava de um modal legitimo.
    let pendente = 0;
    const agendar = () => {
      window.clearTimeout(pendente);
      pendente = window.setTimeout(sincronizarTrava, 150);
    };

    const observer = new MutationObserver(agendar);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'data-state'],
      childList: true,
      subtree: true,
    });

    // O caso real: o usuario sai da aba enquanto o drawer fecha e volta depois.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') agendar();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    window.addEventListener('focus', aoVoltar);
    window.addEventListener('pageshow', aoVoltar);

    agendar();

    return () => {
      window.clearTimeout(pendente);
      observer.disconnect();
      document.removeEventListener('visibilitychange', aoVoltar);
      window.removeEventListener('focus', aoVoltar);
      window.removeEventListener('pageshow', aoVoltar);
    };
  }, []);
}
