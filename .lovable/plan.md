

## Fix: Google OAuth no domínio custom

### Problema
Quando o usuário acessa via `thetradingdiary.com`, o SDK do Lovable constrói a URL de inicio do OAuth como `thetradingdiary.com/~oauth/initiate`, mas o endpoint `~oauth` só existe em `the-trading-diary.lovable.app`. Resultado: 404.

### Causa
O SDK `@lovable.dev/cloud-auth-js` usa internamente `window.location.origin` para montar a URL do `~oauth/initiate`. No domínio custom, isso quebra.

### Solução
Passar o parâmetro `redirect_uri` apontando para o domínio `.lovable.app` — que já está correto no código. Porém, o SDK também precisa saber onde iniciar o fluxo. Precisamos verificar se o SDK aceita um parâmetro de `baseUrl` ou similar.

**Opção mais provável**: O SDK do Lovable Cloud Auth já deveria lidar com isso automaticamente. Isso pode ser um bug do SDK ou uma configuração faltando.

### Passos
1. **Investigar o SDK** — verificar como `@lovable.dev/cloud-auth-js` constrói a URL de initiate e se aceita configuração de base URL
2. **Se o SDK aceitar config** — passar o domínio `.lovable.app` como base para o fluxo OAuth
3. **Se não aceitar** — criar um workaround redirecionando o usuário manualmente para `https://the-trading-diary.lovable.app/~oauth/initiate?...` antes de iniciar o fluxo

### Arquivo afetado
- `src/contexts/AuthContext.tsx` — ajustar chamada do `signInWithGoogle`

### Detalhe técnico
```text
Atual (quebrado no domínio custom):
  thetradingdiary.com/~oauth/initiate?provider=google&redirect_uri=...
  → 404 (endpoint não existe no domínio custom)

Correto:
  the-trading-diary.lovable.app/~oauth/initiate?provider=google&redirect_uri=...
  → Funciona (endpoint existe no .lovable.app)
```

