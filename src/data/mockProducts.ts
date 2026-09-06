/**
 * Dados de exemplo para o PDV Inteligente v2.0
 * Inclui os 12 produtos obrigatórios com código, nome, preço e categoria.
 */
import { Product } from '../types';

export const CATEGORIAS: string[] = [
  'Todas',
  'Bebidas',
  'Padaria',
  'Frios',
  'Limpeza',
  'Hortifruti',
];

export const MOCK_PRODUTOS: Product[] = [
  {
    codigo: '7891000',
    nome: 'Coca-Cola 2 Litros',
    preco: 9.49,
    categoria: 'Bebidas',
    estoque: 48,
    unidade: 'un',
    favorito: true,
    recente: true,
    icone: 'Wine',
    descricao: 'Refrigerante de cola garrafa pet 2L'
  },
  {
    codigo: '7891001',
    nome: 'Guaraná Antarctica 1,5L',
    preco: 7.99,
    categoria: 'Bebidas',
    estoque: 36,
    unidade: 'un',
    favorito: true,
    recente: false,
    icone: 'Coffee',
    descricao: 'Refrigerante Guaraná sabor natural 1.5L'
  },
  {
    codigo: '7891002',
    nome: 'Água Mineral 500ml',
    preco: 2.49,
    categoria: 'Bebidas',
    estoque: 120,
    unidade: 'un',
    favorito: true,
    recente: true,
    icone: 'Droplets',
    descricao: 'Água mineral natural sem gás 500ml'
  },
  {
    codigo: '7891003',
    nome: 'Suco Del Valle Uva 1L',
    preco: 6.29,
    categoria: 'Bebidas',
    estoque: 24,
    unidade: 'un',
    favorito: false,
    recente: false,
    icone: 'GlassWater',
    descricao: 'Néctar de uva integral Del Valle 1 Litro'
  },
  {
    codigo: '7891010',
    nome: 'Pão Francês (kg)',
    preco: 14.90,
    categoria: 'Padaria',
    estoque: 15,
    unidade: 'kg',
    favorito: true,
    recente: true,
    icone: 'Croissant',
    descricao: 'Pão francês fresquinho assado na hora'
  },
  {
    codigo: '7891011',
    nome: 'Bolo de Chocolate Fatia',
    preco: 8.50,
    categoria: 'Padaria',
    estoque: 12,
    unidade: 'un',
    favorito: false,
    recente: true,
    icone: 'Cake',
    descricao: 'Fatia de bolo artesanal com cobertura brigadeiro'
  },
  {
    codigo: '7891020',
    nome: 'Queijo Mussarela (kg)',
    preco: 39.90,
    categoria: 'Frios',
    estoque: 8,
    unidade: 'kg',
    favorito: true,
    recente: false,
    icone: 'Sandwich',
    descricao: 'Queijo tipo mussarela fatiado fresco'
  },
  {
    codigo: '7891021',
    nome: 'Presunto Cozido (kg)',
    preco: 29.90,
    categoria: 'Frios',
    estoque: 10,
    unidade: 'kg',
    favorito: false,
    recente: false,
    icone: 'Beef',
    descricao: 'Presunto cozido magro sem capa de gordura'
  },
  {
    codigo: '7891030',
    nome: 'Detergente Ypê 500ml',
    preco: 2.79,
    categoria: 'Limpeza',
    estoque: 65,
    unidade: 'un',
    favorito: false,
    recente: true,
    icone: 'Sparkles',
    descricao: 'Detergente líquido lava-louças neutro 500ml'
  },
  {
    codigo: '7891031',
    nome: 'Água Sanitária 1L',
    preco: 4.49,
    categoria: 'Limpeza',
    estoque: 40,
    unidade: 'un',
    favorito: false,
    recente: false,
    icone: 'ShieldAlert',
    descricao: 'Água sanitária desinfetante clorado 1 Litro'
  },
  {
    codigo: '7891040',
    nome: 'Banana Prata (kg)',
    preco: 5.99,
    categoria: 'Hortifruti',
    estoque: 25,
    unidade: 'kg',
    favorito: true,
    recente: true,
    icone: 'Apple',
    descricao: 'Banana prata selecionada de primeira qualidade'
  },
  {
    codigo: '7891041',
    nome: 'Tomate Italiano (kg)',
    preco: 8.49,
    categoria: 'Hortifruti',
    estoque: 18,
    unidade: 'kg',
    favorito: false,
    recente: false,
    icone: 'Cherry',
    descricao: 'Tomate tipo italiano maduro para saladas e molhos'
  },
];
