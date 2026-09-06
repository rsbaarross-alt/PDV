/**
 * Tipos e Interfaces do PDV Inteligente v2.0
 */

export interface Product {
  codigo: string;
  nome: string;
  preco: number;
  categoria: 'Bebidas' | 'Padaria' | 'Frios' | 'Limpeza' | 'Hortifruti' | string;
  estoque: number;
  unidade: 'un' | 'kg' | 'l';
  favorito?: boolean;
  recente?: boolean;
  icone: string; // nome do ícone lucide
  descricao?: string;
}

export interface CartItem {
  id: string; // uuid ou codigo + timestamp
  produto: Product;
  quantidade: number;
  precoUnitario: number;
  total: number;
  adicionadoRecentemente?: boolean;
}

export type FilterType = 'todos' | 'nome' | 'codigo' | 'favoritos' | 'recentes';

export type PaymentMethodType = 'dinheiro' | 'credito' | 'debito' | 'pix';

export interface PaymentMethodOption {
  id: PaymentMethodType;
  nome: string;
  icone: string;
  atalho: string;
  descricao: string;
}

export interface Operator {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  cargo: 'operador' | 'supervisor' | 'gerente';
  avatarCor: string;
}

export interface SessionInfo {
  operador: Operator;
  caixa: string;
  fundoTrocoInicial: number;
  dataAbertura: string;
}

export interface SaleSummary {
  id: string;
  dataHora: Date;
  itens: CartItem[];
  subtotal: number;
  desconto: number;
  descontoTipo: 'reais' | 'porcentagem';
  total: number;
  metodoPagamento: PaymentMethodType;
  valorRecebido?: number;
  troco?: number;
  operador: string;
  caixa: string;
}
