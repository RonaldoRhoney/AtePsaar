# Automações N8N — AtePssar

## Atualizar status dos concursos

Arquivo: `atualizar-status-concursos.n8n.json`

O app lê `concursos.json` (na raiz do repo) em tempo de execução, com fallback para a lista embutida no código se o arquivo não existir ou o fetch falhar. Este workflow mantém esse arquivo atualizado sozinho, toda segunda-feira às 7h:

1. Busca o `concursos.json` atual no GitHub.
2. Para cada concurso, pesquisa manchetes recentes no Google News.
3. Manda as manchetes pro Claude (`claude-opus-4-8`) classificar a situação em `aberto` / `andamento` / `concluido`, com nível de confiança.
4. Só aplica a mudança se a confiança for `alta` — caso contrário mantém o status atual (evita atualizar errado por notícia ambígua).
5. Se algo mudou, commita o `concursos.json` atualizado direto no GitHub.

### Como importar

1. No N8N: **Workflows → Import from File** → selecione `atualizar-status-concursos.n8n.json`.
2. Crie duas credenciais do tipo **Header Auth**:
   - `GitHub PAT (AtePssar)` — header `Authorization` com valor `Bearer <seu-token-github>` (o token precisa de permissão `contents: write` no repo `RonaldoRhoney/AtePsaar`).
   - `Anthropic API Key` — header `x-api-key` com valor `<sua-chave-anthropic>`.
3. Associe cada credencial aos nós que a usam (os nós já vêm nomeados: "Buscar concursos.json (GitHub)", "Commitar concursos.json" e "Classificar com Claude").
4. Ative o workflow. O gatilho já vem configurado para toda segunda-feira às 7h (`0 7 * * 1`) — ajuste em **Toda segunda às 7h** se quiser outra frequência.

### Por que confiança "alta" só

Notícias antigas ou ambíguas no Google News podem levar a uma classificação errada — e um concurseiro pode perder um prazo real por causa disso. Por segurança, o workflow só aplica a mudança quando o modelo está confiante; do contrário mantém o status curado manualmente e a próxima execução tenta de novo.
