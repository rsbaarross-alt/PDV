-- ==============================================================================
-- SCHEMA SUPABASE — PDV INTELIGENTE v2.0
-- Execute este script no SQL Editor do seu projeto Supabase (Dashboard -> SQL Editor)
-- ==============================================================================

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  categoria VARCHAR(64) NOT NULL,
  estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
  unidade VARCHAR(10) NOT NULL DEFAULT 'un',
  icone VARCHAR(64) NOT NULL DEFAULT 'Package',
  descricao TEXT,
  favorito BOOLEAN DEFAULT false,
  recente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_venda VARCHAR(64),
  subtotal NUMERIC(10, 2) NOT NULL,
  desconto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  desconto_tipo VARCHAR(20) DEFAULT 'reais',
  total NUMERIC(10, 2) NOT NULL,
  metodo_pagamento VARCHAR(32) NOT NULL,
  valor_recebido NUMERIC(10, 2),
  troco NUMERIC(10, 2) DEFAULT 0,
  operador VARCHAR(100) NOT NULL DEFAULT 'Carlos Silva',
  caixa VARCHAR(50) NOT NULL DEFAULT 'Caixa 04',
  status VARCHAR(20) NOT NULL DEFAULT 'concluida',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ITENS DA VENDA
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  produto_codigo VARCHAR(32) NOT NULL,
  produto_nome VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10, 3) NOT NULL,
  preco_unitario NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  unidade VARCHAR(10) DEFAULT 'un',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para operação do PDV (permitir leitura e inserção)
CREATE POLICY IF NOT EXISTS "Permitir leitura de produtos para todos" ON products
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Permitir inserção e atualização de produtos" ON products
  FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Permitir inserção de vendas" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Permitir leitura de vendas" ON sales
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Permitir inserção de itens de venda" ON sale_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Permitir leitura de itens de venda" ON sale_items
  FOR SELECT USING (true);

-- 4. CARGA INICIAL DE PRODUTOS DO PDV
INSERT INTO products (codigo, nome, preco, categoria, estoque, unidade, icone, favorito)
VALUES
  ('7891000', 'Coca-Cola 2 Litros', 9.49, 'Bebidas', 48, 'un', 'Wine', true),
  ('7891001', 'Guaraná Antarctica 1,5L', 7.99, 'Bebidas', 32, 'un', 'Wine', true),
  ('7891002', 'Água Mineral 500ml', 2.49, 'Bebidas', 120, 'un', 'Milk', true),
  ('7891003', 'Suco Del Valle Uva 1L', 6.29, 'Bebidas', 25, 'un', 'Coffee', false),
  ('7891010', 'Pão Francês (kg)', 14.90, 'Padaria', 15.5, 'kg', 'Croissant', true),
  ('7891011', 'Bolo de Chocolate Fatia', 8.50, 'Padaria', 14, 'un', 'Cake', false),
  ('7891020', 'Queijo Mussarela (kg)', 39.90, 'Frios', 12.0, 'kg', 'Beef', true),
  ('7891021', 'Presunto Cozido (kg)', 29.90, 'Frios', 9.8, 'kg', 'Beef', false),
  ('7891030', 'Detergente Ypê 500ml', 2.79, 'Limpeza', 65, 'un', 'Sparkles', true),
  ('7891031', 'Água Sanitária 1L', 4.49, 'Limpeza', 40, 'un', 'SprayCan', false),
  ('7891040', 'Banana Prata (kg)', 5.99, 'Hortifruti', 28.5, 'kg', 'Apple', true),
  ('7891041', 'Tomate Italiano (kg)', 8.49, 'Hortifruti', 18.2, 'kg', 'Apple', false)
ON CONFLICT (codigo) DO UPDATE
SET
  nome = EXCLUDED.nome,
  preco = EXCLUDED.preco,
  categoria = EXCLUDED.categoria,
  estoque = EXCLUDED.estoque,
  unidade = EXCLUDED.unidade;
