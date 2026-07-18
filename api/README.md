# Backend do AtePssar — Agente Pena

O AtePssar é 100% estático, exceto o **Agente Pena** (mentor de redação), que precisa chamar o Claude de verdade — e isso não pode acontecer no navegador, porque exporia a chave da Anthropic pra qualquer visitante. A solução é a function serverless `api/redacao-agente.js`, que roda na Vercel e mantém a chave só no servidor.

## Como colocar pra funcionar

1. **Importe o repositório na Vercel** (se ainda não tiver feito): [vercel.com/new](https://vercel.com/new) → selecione `RonaldoRhoney/AtePsaar`. Framework: "Other" (é um app estático + 1 function, não precisa de build step).
2. Em **Project Settings → Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave da API da Anthropic (console.anthropic.com).
3. Deploy. A Vercel detecta `api/redacao-agente.js` automaticamente e publica em `/api/redacao-agente`.
4. Pronto — o botão "Gerar redação-modelo" e "Pedir correção" no app passam a funcionar.

## Sem isso configurado

O app inteiro continua funcionando normalmente (é estático). Só o Agente Pena mostra um aviso pedindo pra configurar o backend — o resto do AtePssar (Lince, banco de questões, ciclo de estudos, etc.) não depende disso.

## Sobre o modelo usado

A function usa `claude-opus-4-8` com a ferramenta de busca na web habilitada (pra pesquisar normas atuais e repertório quando necessário) e saída estruturada (JSON), então o app sempre recebe nota/dicas/tópicos já organizados — nunca texto solto pra parsear.
