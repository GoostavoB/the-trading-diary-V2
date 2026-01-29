
# Corrigir Layout do Trade Station: 2x2 Retângulos ao Invés de 4 Colunas

## Problema Identificado

O screenshot mostra 4 widgets em uma única linha horizontal:
```
┌─────────┬─────────┬─────────┬─────────┐
│ Risk    │ Leverage│ Error   │ Rolling │
│ Calc    │ Calc    │ Reflect │ Target  │
└─────────┴─────────┴─────────┴─────────┘
          ↑ 4 colunas estreitas
```

Mas o layout correto deveria ser 2x2 retângulos:
```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Risk Calculator   │  Leverage Calculator│
│                     │                     │
├─────────────────────┼─────────────────────┤
│                     │                     │
│  Error Reflection   │   Rolling Target    │
│                     │                     │
└─────────────────────┴─────────────────────┘
        ↑ 2x2 retângulos grandes
```

## Causa Raiz

O `AdaptiveGrid` usa `gridTemplateColumns: repeat(${responsiveColumns}, minmax(0, 1fr))` onde `responsiveColumns` é calculado como `columnCount * 2 = 6-8 subcolumns`. Cada widget ocupa apenas 1 célula, resultando em widgets muito estreitos.

## Solução: Criar TradeStationContent com Layout Fixo 2x2

Criar um componente dedicado similar ao `CommandCenterContent` com layout fixo de 2 colunas e 2 linhas:

**Arquivo: `src/components/dashboard/tabs/TradeStationContent.tsx`**

```typescript
<div 
  className="grid grid-cols-2 gap-4"
  style={{
    gridTemplateRows: '1fr 1fr',
    height: 'calc(100vh - 220px)',
    overflow: 'hidden',
  }}
>
  {/* Linha 1 */}
  <div className="col-span-1">
    <RiskCalculatorV2Widget />
  </div>
  <div className="col-span-1">
    <SimpleLeverageWidget />
  </div>
  
  {/* Linha 2 */}
  <div className="col-span-1">
    <ErrorReflectionWidget />
  </div>
  <div className="col-span-1">
    <TradeStationRollingTarget />
  </div>
</div>
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/dashboard/tabs/TradeStationContent.tsx` | Criar novo componente com grid 2x2 |
| `src/pages/Dashboard.tsx` | Usar TradeStationContent no tab Trade Station |
| `src/components/trade-station/TradeStationView.tsx` | Simplificar para usar layout fixo |

## Resultado Visual

```
┌───────────────────────────┬───────────────────────────┐
│                           │                           │
│     RISK CALCULATOR       │   LEVERAGE CALCULATOR     │
│                           │                           │
│  Strategy: Scalp          │  Entry: 50000             │
│  Base: Current...         │  Stop %: 1.0              │
│  Risk per Trade: 3.5%     │  Max Leverage: 60x        │
│  Daily Loss Limit: 7%     │  Liquidation: $49416.67   │
│                           │  Risk Level: High         │
├───────────────────────────┼───────────────────────────┤
│                           │                           │
│    ERROR REFLECTION       │    ROLLING TARGET         │
│                           │                           │
│  No Active Errors         │  You are ahead!           │
│                           │  Headroom: $138.27        │
│  + Add Your First Error   │  Target: 1%               │
│                           │  30d: $2,269.41           │
│                           │                           │
└───────────────────────────┴───────────────────────────┘
```

Cada widget agora ocupa 50% da largura e 50% da altura, dando espaço suficiente para todo o conteúdo.
