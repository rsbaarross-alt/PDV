/**
 * Utilitários de formatação para moeda (BRL), números e datas
 */

export function formatBRL(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(valor: number): string {
  if (isNaN(valor)) return '0,00';
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatUnitQuantity(qtd: number, unidade: 'un' | 'kg' | 'l' | string): string {
  if (unidade === 'kg') {
    return `${qtd.toFixed(3).replace('.', ',')} kg`;
  }
  return `${qtd} ${unidade}`;
}

export function formatLiveTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatLiveDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
