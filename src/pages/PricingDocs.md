# Documentação Completa de Precificação

## Objetivo

Calcular o custo total para manter 1 usuário por mês e definir preços por plano com margem clara, validar caps semanais de análises e mapear todos os custos envolvidos.

## Estrutura de Custos

### 1. Custos de AI (Lovable AI Gateway)

#### Modelos Disponíveis

**google/gemini-2.5-flash** (modelo padrão)
- Input: $0.075 por 1M tokens
- Output: $0.30 por 1M tokens
- Uso: 95% dos casos (uploads lite, análises, chat, widgets)

**google/gemini-2.5-pro** (análises complexas)
- Input: $1.25 por 1M tokens
- Output: $5.00 por 1M tokens
- Uso: 5% dos uploads que precisam análise profunda

#### Consumo de Tokens por Evento

| Evento | Modelo | Input Médio | Output Médio | P95 Input | P95 Output | Custo Médio |
|--------|--------|-------------|--------------|-----------|------------|-------------|
| extract-trade-info (lite) | Flash | 1.2K | 300 | 2K | 500 | $0.00018 |
| extract-trade-info (deep) | Pro | 2.5K | 800 | 4K | 1.5K | $0.00716 |
| trade-analysis | Flash | 1.8K | 600 | 3K | 1.2K | $0.00032 |
| weekly-report | Flash | 3.5K | 1.5K | 5K | 2.5K | $0.00071 |
| chat-message | Flash | 800 | 400 | 1.5K | 800 | $0.00018 |
| generate-widget | Flash | 1K | 1.2K | 1.8K | 2K | $0.00044 |
| dashboard-assistant | Flash | 1.2K | 500 | 2K | 900 | $0.00024 |

### 2. Processamento de Imagens

**Parâmetros:**
- Imagens por trade: 1.2 (média)
- Tamanho médio: 0.8 MB (após compressão)
- P95 tamanho: 2.5 MB
- OCR por imagem: $0.002 (Tesseract.js local)
- Thumbnails por imagem: 3 variantes
- Redundância: 1.5x (geo-replication)

**Custo por trade devido a imagens:**
```
Custo_imagem = (imgs × OCR) + (imgs × tamanho × storage_GB_mês × redundância × 12) + 
               (imgs × thumbnails × thumb_storage) + (imgs × PUT_cost)
             = (1.2 × $0.002) + (1.2 × 0.8MB × $0.021/GB × 1.5 × 12 / 1024) +
               (1.2 × 3 × 0.05MB × $0.021/GB × 12 / 1024) + (1.2 × 4 × $0.005/1000)
             ≈ $0.0024 + $0.00035 + $0.00005 + $0.000024
             = $0.00282 por trade
```

### 3. Banco de Dados e Storage (Supabase via Lovable Cloud)

**Database:**
- Base mensal: $25 (Pro plan)
- Storage: $0.125 por GB-mês
- Por usuário: 0.5 GB médio
- Crescimento: +0.1 GB/mês por usuário ativo
- Egress: $0.09 por GB (200 MB/usuário/mês médio)

**Object Storage:**
- Storage: $0.021 por GB-mês
- GET: $0.0004 por 1K requests
- PUT: $0.005 por 1K requests
- Médio por trade: 1.5 MB armazenado

**CDN:**
- Requests: $1 por 1M requests
- Traffic: $0.12 por GB
- Cache hit rate: 75%
- Por usuário: 2K requests/mês, 0.5 GB traffic

### 4. Custos Fixos por Usuário

| Item | Custo Mensal |
|------|--------------|
| Suporte alocado | $2.00 |
| Monitoring e logs | $0.50 |
| Email transacional | $0.30 |
| Backups e snapshots | $0.25 |
| Security scanning | $0.20 |
| CDN base | $0.50 |
| **TOTAL** | **$3.75** |

### 5. Custos Fixos Globais (não por usuário)

| Item | Custo Mensal |
|------|--------------|
| Domínio + SSL | $15.00 |
| Error tracking (Sentry) | $29.00 |
| Uptime monitoring | $19.00 |
| Analytics | $0.00 (free tier) |
| CI/CD | $0.00 (Lovable incluído) |
| Dev tools | $50.00 |
| Compliance e legal | $100.00 |
| **TOTAL** | **$213.00** |

### 6. Taxas de Pagamento (Stripe)

- Taxa percentual: 2.9%
- Taxa fixa: $0.30 por transação
- FX markup: 1% (conversão de moeda)
- Chargeback rate: 0.4%
- Custo médio de chargeback: $15.00

**Exemplo para plano Pro ($49/mês):**
```
Taxa_pagamento = ($49 × 0.029) + $0.30 + ($49 × 0.01) + ($15 × 0.004)
               = $1.42 + $0.30 + $0.49 + $0.06
               = $2.27
```

## Volumes por Plano

| Métrica | Free | Basic | Pro | Elite |
|---------|------|-------|-----|-------|
| Trades/mês | 10 | 50 | 1,000 | 5,000 |
| AI uploads/mês | 5 | 50 | 1,000 | 5,000 |
| Análises/semana | 1 | 4 | 8 | 20 |
| Chat msgs/mês | 20 | 100 | 500 | 2,000 |
| Reports semanais | 0 | 4 | 4 | 4 |
| Widgets customizados | 0 | 0 | 5 | 20 |
| Exchanges | 1 | 1 | 3 | 5 |
| Dashboard custom | Não | Não | Sim | Sim |
| Team seats | - | - | - | 3 |

## Cálculo de Custo Total por Usuário

### Basic Plan

**Custos Variáveis:**
- 50 uploads × $0.00018 = $0.009
- 50 trades × $0.00282 (imagem) = $0.141
- 4 análises/semana × 4 × $0.00032 = $0.005
- 100 msgs × $0.00018 = $0.018
- 4 reports × $0.00071 = $0.003
- DB storage: 0.5 GB × $0.125 = $0.063
- Object storage: 75 MB × $0.021/GB = $0.002
- CDN: (2000/1M × $1) + (0.5 × $0.12 × 0.25) = $0.017
- **Subtotal variável: $0.258**

**Custos Fixos:**
- Por usuário: $3.75

**Custo Total por Usuário/Mês:** $4.01

**Receita:** $19/mês (monthly) ou $15.83/mês (yearly)

**Taxas Pagamento:** $0.88 (monthly) ou $0.79 (yearly)

**Margem Bruta:**
- Monthly: $19 - $4.01 - $0.88 = $14.11 (74.3%)
- Yearly: $15.83 - $4.01 - $0.79 = $11.03 (69.7%)

✓ **Atinge margem alvo de 60%**

### Pro Plan

**Custos Variáveis:**
- 1000 uploads × $0.00018 = $0.18
- 1000 trades × $0.00282 = $2.82
- 8 análises/semana × 4 × $0.00032 = $0.010
- 500 msgs × $0.00018 = $0.09
- 4 reports × $0.00071 = $0.003
- 5 widgets × $0.00044 × 0.35 (cache miss) = $0.001
- DB storage: 0.5 GB × $0.125 = $0.063
- Object storage: 1.5 GB × $0.021 = $0.032
- CDN: (2000/1M × $1) + (0.5 × $0.12 × 0.25) = $0.017
- **Subtotal variável: $3.216**

**Custos Fixos:**
- Por usuário: $3.75

**Custo Total por Usuário/Mês:** $6.97

**Receita:** $49/mês (monthly) ou $40.83/mês (yearly)

**Taxas Pagamento:** $2.27 (monthly) ou $2.01 (yearly)

**Margem Bruta:**
- Monthly: $49 - $6.97 - $2.27 = $39.76 (81.1%)
- Yearly: $40.83 - $6.97 - $2.01 = $31.85 (78.0%)

✓ **Atinge margem alvo de 70%**

### Elite Plan

**Custos Variáveis:**
- 5000 uploads × $0.00018 = $0.90
- 5000 trades × $0.00282 = $14.10
- 20 análises/semana × 4 × $0.00032 = $0.026
- 2000 msgs × $0.00018 = $0.36
- 4 reports × $0.00071 = $0.003
- 20 widgets × $0.00044 × 0.35 = $0.003
- DB storage: 0.5 GB × $0.125 = $0.063
- Object storage: 7.5 GB × $0.021 = $0.158
- CDN: (2000/1M × $1) + (0.5 × $0.12 × 0.25) = $0.017
- **Subtotal variável: $15.630**

**Custos Fixos:**
- Por usuário base: $3.75
- 3 team seats × $2.00 = $6.00
- **Subtotal fixo: $9.75**

**Custo Total por Usuário/Mês:** $25.38

**Receita:** $149/mês (monthly) ou $124.17/mês (yearly)

**Taxas Pagamento:** $6.70 (monthly) ou $5.93 (yearly)

**Margem Bruta:**
- Monthly: $149 - $25.38 - $6.70 = $116.92 (78.5%)
- Yearly: $124.17 - $25.38 - $5.93 = $92.86 (74.8%)

✓ **Atinge margem alvo de 75%**

## Bundles e Add-ons

### Extra Trades

| Pacote | Custo Base | Markup | Desconto | Preço Final | $/trade | Margem |
|--------|-----------|--------|----------|-------------|---------|--------|
| 100 | $0.31 | 150% | 0% | $0.47 | $0.0047 | 34% |
| 500 | $1.55 | 150% | 10% | $2.09 | $0.0042 | 26% |
| 1000 | $3.10 | 150% | 20% | $3.72 | $0.0037 | 17% |
| 5000 | $15.50 | 150% | 30% | $16.28 | $0.0033 | 5% |

**Recomendação:** Ajustar markup ou reduzir descontos para manter margem mínima de 20%.

### Extra Exchanges
- Custo operacional: $5.00/mês
- Preço para cliente: $15.00/mês
- **Margem: 67%** ✓

### Team Seats
- Custo incremental: $2.00/mês
- Preço para cliente: $20.00/mês
- **Margem: 90%** ✓

## Break-even e Viabilidade

### Custos Fixos Globais
Total mensal: **$213.00**

Para cobrir custos fixos globais com margem Pro:
- Margem bruta Pro (monthly): $39.76
- **Usuários necessários: 6 Pro**

Para cobrir custos fixos globais com mix (60% Pro, 30% Basic, 10% Elite):
- Margem média ponderada: $31.18
- **Usuários necessários: ~7 usuários**

### Picos e Riscos

**Cenários de risco:**

1. **Uso acima do P95** (tokens 2x a média)
   - Custo por trade: $0.00036 → $0.00072 (2x)
   - Impacto no Pro: +$0.36/mês
   - Nova margem: 80.4% → 79.8%

2. **Taxa de retry alta** (15% em vez de 8%)
   - Custo por upload: +13% → +$0.23 (Pro)
   - Nova margem: 81.1% → 80.6%

3. **Crescimento de storage acelerado** (+0.3 GB/mês em vez de 0.1)
   - Custo adicional: +$0.025/mês
   - Impacto marginal

4. **Chargebacks acima da média** (1% em vez de 0.4%)
   - Custo adicional Pro: +$0.09
   - Nova margem: 81.1% → 80.9%

**Conclusão:** Margens robustas mesmo em cenários adversos.

## Caps Semanais Recomendados

Com base em p95 de uso e limites técnicos:

| Plano | Cap Uploads | Cap Análises | Cap Chat | Cap Widgets |
|-------|-------------|--------------|----------|-------------|
| Free | 2/semana | 1/semana | 5/semana | 0 |
| Basic | 15/semana | 1/semana | 25/semana | 0 |
| Pro | 300/semana | 2/semana | 150/semana | 2/semana |
| Elite | 1500/semana | 5/semana | 600/semana | 5/semana |

**Justificativa:** Caps semanais evitam abuse e distribuem uso ao longo do mês.

## Recomendações Finais

### ✅ Validado
1. Todos os planos atingem margem alvo
2. Margens robustas para absorver variação de uso
3. Add-ons lucrativos (exceto bundles grandes)
4. Break-even alcançável com ~7 usuários

### ⚠️ Pontos de Atenção
1. **Bundles de 1000+ trades:** Margem muito baixa. Considerar:
   - Reduzir desconto de 30% para 20%
   - Aumentar markup base de 150% para 200%
2. **Deep analysis:** Custo 40x maior que lite. Limitar uso:
   - Oferecer apenas em Elite
   - Cap de 5% dos uploads podem ser deep
3. **Team seats Elite:** Incluídos 3 seats, mas custo incremental baixo. Considerar cobrar por seat adicional desde o 1º.

### 📊 Métricas para Monitorar
1. **Distribuição lite vs deep** em uploads
2. **Taxa de retry** por tipo de análise
3. **Cache hit rate** em widgets
4. **Crescimento de storage** por usuário
5. **Uso médio por plano** vs projetado
6. **Taxa de conversão** Free → Paid
7. **Churn** por plano e motivo

### 🔄 Iterações Futuras
1. Introduzir tier "Starter" entre Free e Basic ($9/mês, 25 trades)
2. Criar bundle anual com desconto maior (3 meses grátis)
3. Oferecer créditos de AI como add-on ($10 = 2000 uploads extras)
4. Programa de afiliados com comissão recorrente
5. Volume discount enterprise (>10 users)

## Dados para Preencher

### ✅ Já Preenchidos
- [x] Custos de AI por modelo e evento
- [x] Volumes base por plano
- [x] Custos de infraestrutura (DB, storage, CDN)
- [x] Custos fixos (por usuário e globais)
- [x] Taxas de pagamento
- [x] Processamento de imagens
- [x] Cálculo de margens
- [x] Bundles e add-ons
- [x] Break-even analysis

### 📋 Para Validar com Dados Reais
- [ ] Token usage médio real dos últimos 30 dias
- [ ] Taxa de retry real dos últimos 30 dias
- [ ] Cache hit rate real de widgets
- [ ] Tamanho médio de imagens após compressão
- [ ] Distribuição lite vs deep em produção
- [ ] Custos reais de Supabase (confirmar tier atual)
- [ ] Volume de egress real de DB e storage

## Checklist de Implementação

- [ ] Configurar rate limiting por plano
- [ ] Implementar contadores de uso em tempo real
- [ ] Criar dashboard de analytics de custos
- [ ] Configurar alertas de anomalia de uso
- [ ] Documentar caps e limites no Help Center
- [ ] Implementar upgrade prompts quando próximo do limite
- [ ] Criar sistema de créditos para overages
- [ ] Configurar webhooks Stripe para eventos de pagamento
- [ ] Implementar tracking de custos por usuário
- [ ] Criar relatório mensal de P&L por plano
