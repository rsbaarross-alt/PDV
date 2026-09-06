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

export type UserRole = 'operador' | 'supervisor' | 'gerente';
export type UserStatus = 'ativo' | 'inativo';

export interface SystemUser {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  senha: string;
  cargo: UserRole;
  status: UserStatus;
  avatarCor: string;
  criadoEm: string;
  ultimoAcesso?: string;
  estaConectado?: boolean;
  terminalConectado?: string;
  ipOuDispositivo?: string;
}

export interface Operator {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  cargo: UserRole;
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
