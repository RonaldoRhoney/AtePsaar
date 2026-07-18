const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-opus-4-8';
const MAX_TEXTO = 8000;
const MAX_TEMA = 200;

function clamp(str, max){
  return String(str || '').slice(0, max);
}

const SCHEMA_MODELO = {
  type: 'object',
  properties: {
    tema: { type: 'string' },
    redacao: { type: 'string' },
    porqueFunciona: { type: 'array', items: { type: 'string' } },
  },
  required: ['tema', 'redacao', 'porqueFunciona'],
  additionalProperties: false,
};

const SCHEMA_CORRECAO = {
  type: 'object',
  properties: {
    notaEstimada: { type: 'integer' },
    resumo: { type: 'string' },
    pontosFortes: { type: 'array', items: { type: 'string' } },
    pontosMelhorar: { type: 'array', items: { type: 'string' } },
    observacoesGramaticais: { type: 'array', items: { type: 'string' } },
  },
  required: ['notaEstimada', 'resumo', 'pontosFortes', 'pontosMelhorar', 'observacoesGramaticais'],
  additionalProperties: false,
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ erro: 'ANTHROPIC_API_KEY não configurada no projeto Vercel' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const acao = body.acao;
  const concurso = clamp(body.concurso, MAX_TEMA);
  const banca = clamp(body.banca, MAX_TEMA);
  const tema = clamp(body.tema, MAX_TEMA);

  if (acao !== 'modelo' && acao !== 'corrigir') {
    res.status(400).json({ erro: 'Campo "acao" deve ser "modelo" ou "corrigir"' });
    return;
  }
  if (acao === 'corrigir' && !clamp(body.texto, 1).trim()) {
    res.status(400).json({ erro: 'Envie o texto da redação em "texto"' });
    return;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const contexto = `Concurso: ${concurso || 'não informado'}.` + (banca ? ` Banca: ${banca}.` : '');

  let userPrompt, schema;

  if (acao === 'modelo') {
    userPrompt = `Você é um professor de redação especializado em concursos públicos brasileiros. ${contexto}
${tema ? `Tema solicitado pelo candidato: "${tema}".` : 'O candidato não sugeriu tema — escolha um tema típico, atual e relevante pra esse concurso.'}

Escreva uma redação-modelo dissertativo-argumentativa completa (4 a 5 parágrafos, em norma culta), com:
- Introdução com tese clara.
- Desenvolvimento com repertório sociocultural concreto (dados, fatos, referências reais) — use a busca na internet se precisar de informação atual ou específica.
- Conclusão com proposta de intervenção (agente, ação, meio, finalidade, detalhamento) quando esse for o padrão desse tipo de prova.

Depois, liste em tópicos curtos por que essa estrutura funciona bem para bancas de concurso.`;
    schema = SCHEMA_MODELO;
  } else {
    const texto = clamp(body.texto, MAX_TEXTO);
    userPrompt = `Você é um corretor de redações especializado em concursos públicos brasileiros, agindo como um corretor real de banca examinadora. ${contexto}
${tema ? `Tema da redação: "${tema}".` : ''}

Se precisar confirmar alguma norma da língua portuguesa ou critério específico da banca, pesquise antes de responder.

REDAÇÃO DO CANDIDATO:
"""
${texto}
"""

Dê uma nota estimada de 0 a 100, um resumo geral, pontos fortes, pontos a melhorar (cite trechos específicos do texto quando possível) e observações objetivas de gramática/norma culta.`;
    schema = SCHEMA_CORRECAO;
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      res.status(502).json({ erro: 'O modelo não retornou uma resposta em texto' });
      return;
    }
    const parsed = JSON.parse(textBlock.text);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(502).json({ erro: 'Falha ao consultar o Claude', detalhe: String(err && err.message || err) });
  }
};
