import { Operator } from '../types';

export interface OperatorCredential extends Operator {
  senha: string;
  pin: string;
}

export const MOCK_OPERATORS: OperatorCredential[] = [
  {
    id: 'op-1',
    matricula: '1001',
    nome: 'Carlos Silva',
    email: 'carlos.silva@supermercado.com',
    cargo: 'operador',
    avatarCor: '#1E40AF', // Blue
    senha: '1234',
    pin: '1234',
  },
  {
    id: 'op-2',
    matricula: '2002',
    nome: 'Mariana Costa',
    email: 'mariana.costa@supermercado.com',
    cargo: 'gerente',
    avatarCor: '#7C3AED', // Purple
    senha: 'admin',
    pin: '2002',
  },
  {
    id: 'op-3',
    matricula: '1003',
    nome: 'Lucas Mendes',
    email: 'lucas.mendes@supermercado.com',
    cargo: 'operador',
    avatarCor: '#059669', // Emerald
    senha: '1234',
    pin: '1003',
  },
  {
    id: 'op-4',
    matricula: '1004',
    nome: 'Ana Beatriz',
    email: 'ana.beatriz@supermercado.com',
    cargo: 'supervisor',
    avatarCor: '#D97706', // Amber
    senha: '1234',
    pin: '1004',
  },
];

export const AVAILABLE_TERMINALS = [
  { id: 'Caixa 01', label: 'Caixa 01 — Frente de Loja (Rápido)' },
  { id: 'Caixa 02', label: 'Caixa 02 — Frente de Loja' },
  { id: 'Caixa 03', label: 'Caixa 03 — Balcão Preferencial' },
  { id: 'Caixa 04', label: 'Caixa 04 — Autoatendimento / Principal' },
];
