/**
 * Motor de Busca Tolerante (Fuzzy Search) para PDV Inteligente
 * - Ignora acentuação (ex: 'agua' casa com 'água')
 * - Aceita termos fora de ordem (ex: '2l coca' casa com 'Coca-Cola 2 Litros')
 * - Busca por código de barras numérico ou código interno
 * - Destaca substrings correspondentes para feedback visual
 */
import { Product } from '../types';

/**
 * Remove acentos e caracteres especiais para comparação flexível
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface SearchMatchResult {
  product: Product;
  score: number;
  highlightedName: Array<{ text: string; highlight: boolean }>;
  highlightedCode: Array<{ text: string; highlight: boolean }>;
}

/**
 * Executa a busca tolerante sobre a lista de produtos
 */
export function fuzzySearchProducts(query: string, products: Product[]): SearchMatchResult[] {
  const cleanQuery = normalizeText(query);
  if (!cleanQuery || cleanQuery.length < 2) {
    return [];
  }

  // Divide a query em tokens (ex: "coc 2l" -> ["coc", "2l"])
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  const isNumericOnly = /^\d+$/.test(cleanQuery);

  const results: SearchMatchResult[] = [];

  for (const product of products) {
    const normName = normalizeText(product.nome);
    const normCode = normalizeText(product.codigo);
    const normCategory = normalizeText(product.categoria);
    const normDesc = product.descricao ? normalizeText(product.descricao) : '';

    let match = false;
    let score = 0;

    // 1. Verificação por Código de barras / código exato ou parcial
    if (isNumericOnly) {
      if (normCode === cleanQuery) {
        match = true;
        score += 1000; // Prioridade máxima
      } else if (normCode.startsWith(cleanQuery)) {
        match = true;
        score += 500;
      } else if (normCode.includes(cleanQuery)) {
        match = true;
        score += 200;
      }
    }

    // 2. Verificação de tokens no Nome, Descrição e Categoria (ordem independente)
    const allTokensMatchName = queryTokens.every(token => normName.includes(token));
    const allTokensMatchAny = queryTokens.every(
      token => normName.includes(token) || normDesc.includes(token) || normCategory.includes(token) || normCode.includes(token)
    );

    if (allTokensMatchName) {
      match = true;
      score += 300;
      // Bônus se começar pelo primeiro termo
      if (normName.startsWith(queryTokens[0])) {
        score += 100;
      }
    } else if (allTokensMatchAny) {
      match = true;
      score += 100;
    }

    if (match) {
      // Cria o destaque das palavras encontradas no Nome
      const highlightedName = generateHighlights(product.nome, queryTokens);
      const highlightedCode = generateHighlights(product.codigo, queryTokens);

      results.push({
        product,
        score,
        highlightedName,
        highlightedCode,
      });
    }
  }

  // Ordena por score decrescente
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Divide o texto original em fragmentos destacados e não destacados
 */
function generateHighlights(originalText: string, tokens: string[]): Array<{ text: string; highlight: boolean }> {
  if (!originalText || tokens.length === 0) {
    return [{ text: originalText, highlight: false }];
  }

  const normOriginal = normalizeText(originalText);
  const matchedIndices: boolean[] = new Array(originalText.length).fill(false);

  for (const token of tokens) {
    if (!token) continue;
    let startIndex = 0;
    while (startIndex < normOriginal.length) {
      const idx = normOriginal.indexOf(token, startIndex);
      if (idx === -1) break;
      for (let i = idx; i < idx + token.length; i++) {
        matchedIndices[i] = true;
      }
      startIndex = idx + 1;
    }
  }

  const segments: Array<{ text: string; highlight: boolean }> = [];
  let currentSegment = '';
  let currentHighlight = matchedIndices[0] || false;

  for (let i = 0; i < originalText.length; i++) {
    const isHighlight = matchedIndices[i];
    if (isHighlight === currentHighlight) {
      currentSegment += originalText[i];
    } else {
      if (currentSegment) {
        segments.push({ text: currentSegment, highlight: currentHighlight });
      }
      currentSegment = originalText[i];
      currentHighlight = isHighlight;
    }
  }

  if (currentSegment) {
    segments.push({ text: currentSegment, highlight: currentHighlight });
  }

  return segments;
}
