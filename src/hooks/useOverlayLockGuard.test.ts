import { describe, it, expect, beforeEach } from 'vitest';
import { sincronizarTrava } from './useOverlayLockGuard';

/**
 * O bug que estes testes travam: o Radix so desmonta o overlay quando a
 * animacao de saida dispara `animationend`. Em aba de fundo a animacao congela,
 * o overlay fica no DOM por cima de tudo e o body fica com pointer-events:none.
 * A pagina inteira para de aceitar clique, sem erro nenhum.
 */

function overlay(estado: 'open' | 'closed') {
  const el = document.createElement('div');
  el.setAttribute('data-state', estado);
  el.className = 'fixed inset-0 z-50';
  document.body.appendChild(el);
  return el;
}

function conteudoModal(estado: 'open' | 'closed', papel = 'dialog') {
  const el = document.createElement('div');
  el.setAttribute('role', papel);
  el.setAttribute('data-state', estado);
  document.body.appendChild(el);
  return el;
}

describe('vigia de trava de overlay', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.removeProperty('pointer-events');
  });

  it('destrava quando sobrou overlay orfao e nenhum modal aberto', () => {
    document.body.style.pointerEvents = 'none';
    const orfao = overlay('closed');

    expect(sincronizarTrava()).toBe(true);
    expect(document.body.style.pointerEvents).toBe('');
    expect(orfao.style.pointerEvents).toBe('none');
    expect(orfao.style.opacity).toBe('0');
  });

  it('NAO destrava enquanto ha modal aberto', () => {
    document.body.style.pointerEvents = 'none';
    overlay('open');
    conteudoModal('open');

    sincronizarTrava();
    expect(document.body.style.pointerEvents).toBe('none');
  });

  it('devolve a trava quando um modal abre e o body ficou solto', () => {
    // Depois de uma limpeza o Radix acha que ja aplicou o estilo e nao aplica
    // de novo. Sem isto o proximo modal abriria sem bloquear o fundo.
    conteudoModal('open');
    expect(document.body.style.pointerEvents).toBe('');

    expect(sincronizarTrava()).toBe(true);
    expect(document.body.style.pointerEvents).toBe('none');
  });

  it('nao trava por causa de menu ou listbox, que nem sempre sao modais', () => {
    conteudoModal('open', 'menu');
    sincronizarTrava();
    expect(document.body.style.pointerEvents).toBe('');
  });

  it('com camada aberta e body ja trancado, nao mexe em nada', () => {
    document.body.style.pointerEvents = 'none';
    conteudoModal('open');
    expect(sincronizarTrava()).toBe(false);
  });

  it('pagina limpa: nada a fazer', () => {
    expect(sincronizarTrava()).toBe(false);
    expect(document.body.style.pointerEvents).toBe('');
  });

  it('nao mexe duas vezes no mesmo orfao', () => {
    document.body.style.pointerEvents = 'none';
    overlay('closed');
    expect(sincronizarTrava()).toBe(true);
    expect(sincronizarTrava()).toBe(false);
  });

  it('varios orfaos empilhados sao todos neutralizados', () => {
    document.body.style.pointerEvents = 'none';
    const a = overlay('closed');
    const b = overlay('closed');
    sincronizarTrava();
    expect(a.style.pointerEvents).toBe('none');
    expect(b.style.pointerEvents).toBe('none');
  });

  it('alertdialog tambem devolve a trava', () => {
    conteudoModal('open', 'alertdialog');
    sincronizarTrava();
    expect(document.body.style.pointerEvents).toBe('none');
  });
});
