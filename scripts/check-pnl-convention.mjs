#!/usr/bin/env node
/**
 * Trava de convenção do P&L.
 *
 * `profit_loss` é o BRUTO. Somar esse campo diretamente produz um total sem
 * taxas — foi assim que a página de Forecast mostrou $963 quando o resultado
 * real era $783, e que o relatório de imposto inflou a base tributável.
 *
 * Só dois arquivos podem ler o campo cru: utils/pnl.ts, que define a conta, e
 * utils/feeCalculations.ts, que a espelha. Todo o resto usa calculateTradePnL.
 *
 * Este script procura AGREGAÇÕES (reduce/sum/+=) sobre profit_loss. Ler o campo
 * para exibir um trade isolado é legítimo e não é sinalizado.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = 'src';
const LIVRES = new Set([
  'src/utils/pnl.ts',
  'src/utils/feeCalculations.ts',
]);
// Padrões que caracterizam somatório do campo cru.
const SUSPEITOS = [
  /sum\s*\+\s*\(?\s*t(?:rade)?\.profit_loss/,
  /\+=\s*\(?\s*t(?:rade)?\.profit_loss/,
  /reduce\([^)]*profit_loss/,
];

function varrer(dir, achados = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) { varrer(caminho, achados); continue; }
    if (!/\.(ts|tsx)$/.test(nome) || /\.test\.tsx?$/.test(nome)) continue;
    const rel = relative('.', caminho).replace(/\\/g, '/');
    if (LIVRES.has(rel)) continue;
    const linhas = readFileSync(caminho, 'utf8').split('\n');
    linhas.forEach((linha, i) => {
      if (linha.trim().startsWith('//') || linha.trim().startsWith('*')) return;
      // Escape consciente: para os poucos lugares que exibem o bruto de
      // proposito, sempre ao lado do liquido. Exige a marca explicita na linha.
      if (linha.includes('pnl-bruto-proposital')) return;
      if (SUSPEITOS.some((re) => re.test(linha))) achados.push(`${rel}:${i + 1}  ${linha.trim()}`);
    });
  }
  return achados;
}

const achados = varrer(RAIZ);
if (achados.length) {
  console.error('\nP&L bruto sendo somado fora dos utilitários autorizados:\n');
  for (const a of achados) console.error('  ' + a);
  console.error('\nUse calculateTradePnL(trade, { includeFees: true }) — ver src/utils/pnl.ts\n');
  process.exit(1);
}
console.log('convenção de P&L ok: nenhuma soma de profit_loss cru fora de utils/pnl.ts');
