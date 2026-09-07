import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Singleton para o cliente Supabase
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!rawUrl || !key) {
    return null;
  }

  // Remove caminhos como /rest/v1/ e barras finais que causam PGRST125 no supabase-js
  const cleanUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(cleanUrl, key.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`✅ Cliente Supabase conectado com sucesso em: ${cleanUrl}`);
    } catch (err) {
      console.error('❌ Erro ao inicializar cliente Supabase:', err);
      return null;
    }
  }

  return supabaseClient;
}

// Produtos padrão para fallback se o Supabase não estiver configurado ou tabela vazia
const FALLBACK_PRODUCTS = [
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
    descricao: 'Refrigerante de cola garrafa pet 2L',
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
    descricao: 'Refrigerante Guaraná sabor natural 1.5L',
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
    descricao: 'Água mineral natural sem gás 500ml',
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
    icone: 'Apple',
    descricao: 'Suco integral de uva 1 Litro',
  },
  {
    codigo: '7891010',
    nome: 'Pão Francês (kg)',
    preco: 14.90,
    categoria: 'Padaria',
    estoque: 15.5,
    unidade: 'kg',
    favorito: true,
    recente: true,
    icone: 'Croissant',
    descricao: 'Pão francês fresquinho assado na hora',
  },
  {
    codigo: '7891011',
    nome: 'Bolo de Chocolate Fatia',
    preco: 8.50,
    categoria: 'Padaria',
    estoque: 14,
    unidade: 'un',
    favorito: false,
    recente: false,
    icone: 'Cake',
    descricao: 'Fatia individual de bolo de brigadeiro',
  },
  {
    codigo: '7891020',
    nome: 'Queijo Mussarela (kg)',
    preco: 39.90,
    categoria: 'Frios',
    estoque: 12.0,
    unidade: 'kg',
    favorito: true,
    recente: false,
    icone: 'Beef',
    descricao: 'Mussarela fatiada fresca ou pedaço',
  },
  {
    codigo: '7891021',
    nome: 'Presunto Cozido (kg)',
    preco: 29.90,
    categoria: 'Frios',
    estoque: 9.8,
    unidade: 'kg',
    favorito: false,
    recente: false,
    icone: 'Beef',
    descricao: 'Presunto cozido fatiado magro',
  },
  {
    codigo: '7891030',
    nome: 'Detergente Ypê 500ml',
    preco: 2.79,
    categoria: 'Limpeza',
    estoque: 65,
    unidade: 'un',
    favorito: true,
    recente: false,
    icone: 'Sparkles',
    descricao: 'Lava-louças neutro biodegradável 500ml',
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
    icone: 'SprayCan',
    descricao: 'Desinfetante e alvejante clorado 1L',
  },
  {
    codigo: '7891040',
    nome: 'Banana Prata (kg)',
    preco: 5.99,
    categoria: 'Hortifruti',
    estoque: 28.5,
    unidade: 'kg',
    favorito: true,
    recente: false,
    icone: 'Apple',
    descricao: 'Banana prata selecionada de primeira',
  },
  {
    codigo: '7891041',
    nome: 'Tomate Italiano (kg)',
    preco: 8.49,
    categoria: 'Hortifruti',
    estoque: 18.2,
    unidade: 'kg',
    favorito: false,
    recente: false,
    icone: 'Apple',
    descricao: 'Tomate italiano maduro para salada e molho',
  },
];

// -------------------------------------------------------------
// ROTAS DE API (Backend PDV)
// Suportam tanto '/api/*' quanto '/*' para compatibilidade total
// com Vercel Serverless Functions e servidores dedicados Express
// -------------------------------------------------------------

// Health check básico
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Status da conexão com o Supabase
app.get(['/api/supabase/status', '/supabase/status'], async (_req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não informadas no ambiente.',
    });
  }

  try {
    const { count, error } = await sb.from('products').select('*', { count: 'exact', head: true });
    if (error) {
      return res.json({
        configured: true,
        connected: false,
        message: `Erro ao consultar Supabase: ${error.message}. Execute o script supabase_schema.sql.`,
        error: error.message,
      });
    }

    return res.json({
      configured: true,
      connected: true,
      productCount: count ?? 0,
      message: 'Conectado com sucesso ao Supabase!',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Falha desconhecida';
    return res.json({
      configured: true,
      connected: false,
      message: `Exceção de conexão: ${errorMessage}`,
    });
  }
});

// Obter catálogo de produtos
app.get(['/api/products', '/products'], async (_req: Request, res: Response) => {
  const sb = getSupabase();

  if (!sb) {
    return res.json({
      source: 'local',
      products: FALLBACK_PRODUCTS,
      supabaseConfigured: false,
    });
  }

  try {
    const { data, error } = await sb
      .from('products')
      .select('*')
      .order('nome', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) {
        console.warn('⚠️ Erro ao buscar produtos no Supabase (usando fallback local):', error.message);
      }
      return res.json({
        source: 'local',
        products: FALLBACK_PRODUCTS,
        supabaseConfigured: true,
        supabaseError: error ? error.message : 'Tabela de produtos vazia',
      });
    }

    // Mapeia colunas do Supabase para formato frontend
    const mappedProducts = data.map((item) => ({
      codigo: String(item.codigo),
      nome: item.nome,
      preco: Number(item.preco),
      categoria: item.categoria,
      estoque: Number(item.estoque ?? 0),
      unidade: item.unidade || 'un',
      icone: item.icone || 'Package',
      descricao: item.descricao || '',
      favorito: Boolean(item.favorito),
      recente: Boolean(item.recente),
    }));

    return res.json({
      source: 'supabase',
      products: mappedProducts,
      supabaseConfigured: true,
    });
  } catch (err: unknown) {
    console.error('❌ Exceção ao buscar produtos do Supabase:', err);
    return res.json({
      source: 'local',
      products: FALLBACK_PRODUCTS,
      supabaseConfigured: true,
    });
  }
});

// Registrar nova venda
app.post(['/api/sales', '/sales'], async (req: Request, res: Response) => {
  const {
    itens,
    subtotal,
    desconto,
    descontoTipo,
    total,
    metodoPagamento,
    valorRecebido,
    troco,
    operador = 'Carlos Silva',
    caixa = 'Caixa 04',
  } = req.body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'Nenhum item informado para a venda.' });
  }

  const sb = getSupabase();

  // Se não tiver Supabase configurado, simula gravação local com sucesso
  if (!sb) {
    const fakeSaleId = `sale-${Date.now()}`;
    return res.json({
      success: true,
      source: 'local',
      saleId: fakeSaleId,
      message: 'Venda finalizada localmente (Supabase aguardando credenciais).',
    });
  }

  try {
    const saleCode = `VD-${Date.now().toString().slice(-6)}`;

    // 1. Inserir venda principal
    const { data: saleData, error: saleError } = await sb
      .from('sales')
      .insert([
        {
          codigo_venda: saleCode,
          subtotal: Number(subtotal),
          desconto: Number(desconto || 0),
          desconto_tipo: descontoTipo || 'reais',
          total: Number(total),
          metodo_pagamento: metodoPagamento,
          valor_recebido: valorRecebido ? Number(valorRecebido) : null,
          troco: troco ? Number(troco) : 0,
          operador,
          caixa,
          status: 'concluida',
        },
      ])
      .select('id')
      .single();

    if (saleError || !saleData) {
      console.error('❌ Erro ao salvar venda no Supabase:', saleError);
      return res.status(500).json({
        error: 'Erro ao gravar venda no banco Supabase.',
        details: saleError?.message,
      });
    }

    const saleId = saleData.id;

    // 2. Inserir itens da venda
    const itemsToInsert = itens.map((item: any) => ({
      sale_id: saleId,
      produto_codigo: item.produto.codigo,
      produto_nome: item.produto.nome,
      quantidade: Number(item.quantidade),
      preco_unitario: Number(item.precoUnitario),
      total: Number(item.total),
      unidade: item.produto.unidade || 'un',
    }));

    const { error: itemsError } = await sb.from('sale_items').insert(itemsToInsert);

    if (itemsError) {
      console.warn('⚠️ Erro ao inserir itens da venda:', itemsError.message);
    }

    // 3. Atualizar estoque de forma assíncrona
    for (const item of itens) {
      try {
        const { data: currentProduct } = await sb
          .from('products')
          .select('estoque')
          .eq('codigo', item.produto.codigo)
          .single();

        if (currentProduct) {
          const novoEstoque = Math.max(0, Number(currentProduct.estoque) - Number(item.quantidade));
          await sb.from('products').update({ estoque: novoEstoque }).eq('codigo', item.produto.codigo);
        }
      } catch (stockErr) {
        console.warn(`Aviso: Falha ao deduzir estoque de ${item.produto.codigo}:`, stockErr);
      }
    }

    return res.json({
      success: true,
      source: 'supabase',
      saleId,
      codigoVenda: saleCode,
      message: 'Venda e itens gravados com sucesso no Supabase!',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro interno';
    console.error('❌ Falha ao processar venda:', err);
    return res.status(500).json({
      error: 'Erro ao processar venda.',
      details: errorMessage,
    });
  }
});

// -------------------------------------------------------------
// GESTÃO DE USUÁRIOS & CONTROLE DE ACESSO RBAC
// -------------------------------------------------------------

// Middleware de proteção de rotas por Cargo/Role
const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const userRole = (
      (req.headers['x-user-role'] as string) ||
      (req.query.role as string) ||
      'operador'
    ).toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Acesso Negado: Permissão insuficiente.',
        requiredRoles: allowedRoles,
        providedRole: userRole,
      });
    }
    next();
  };
};

// Armazenamento em memória de usuários no servidor
let SERVER_USERS = [
  {
    id: 'user-1',
    matricula: '1001',
    nome: 'Carlos Silva',
    email: 'carlos.silva@supermercado.com',
    senha: '1234',
    cargo: 'operador',
    status: 'ativo',
    avatarCor: '#1D4ED8',
    criadoEm: '2026-01-15T08:00:00.000Z',
    ultimoAcesso: new Date().toISOString(),
    estaConectado: true,
    terminalConectado: 'Caixa 04',
  },
  {
    id: 'user-2',
    matricula: '2002',
    nome: 'Mariana Costa',
    email: 'admin@supermercado.com',
    senha: 'admin',
    cargo: 'admin',
    status: 'ativo',
    avatarCor: '#7C3AED',
    criadoEm: '2026-01-10T09:30:00.000Z',
    ultimoAcesso: new Date().toISOString(),
    estaConectado: false,
  },
  {
    id: 'user-3',
    matricula: '1003',
    nome: 'Lucas Mendes',
    email: 'lucas.mendes@supermercado.com',
    senha: '1234',
    cargo: 'operador',
    status: 'ativo',
    avatarCor: '#059669',
    criadoEm: '2026-02-01T14:15:00.000Z',
    ultimoAcesso: new Date().toISOString(),
    estaConectado: true,
    terminalConectado: 'Caixa 01',
  },
  {
    id: 'user-4',
    matricula: '1004',
    nome: 'Ana Beatriz',
    email: 'ana.beatriz@supermercado.com',
    senha: '1234',
    cargo: 'supervisor',
    status: 'ativo',
    avatarCor: '#D97706',
    criadoEm: '2026-02-15T11:00:00.000Z',
    ultimoAcesso: new Date().toISOString(),
    estaConectado: false,
  },
];

// Helpers para conversão entre o modelo da aplicação e as colunas do Supabase/PostgreSQL
function toSupabaseUser(user: any) {
  return {
    matricula: String(user.matricula || ''),
    nome: String(user.nome || '').trim(),
    email: String(user.email || '').trim().toLowerCase(),
    senha: String(user.senha || '1234'),
    cargo: String(user.cargo || 'operador'),
    status: String(user.status || 'ativo'),
    avatar_cor: user.avatarCor || user.avatar_cor || '#1D4ED8',
    esta_conectado: Boolean(user.estaConectado ?? user.esta_conectado ?? false),
    terminal_conectado: user.terminalConectado || user.terminal_conectado || null,
    ultimo_acesso: user.ultimoAcesso || user.ultimo_acesso || new Date().toISOString(),
  };
}

function fromSupabaseUser(row: any) {
  return {
    id: String(row.id),
    matricula: String(row.matricula || ''),
    nome: row.nome || '',
    email: row.email || '',
    senha: row.senha || '1234',
    cargo: row.cargo || 'operador',
    status: row.status || 'ativo',
    avatarCor: row.avatar_cor || row.avatarCor || '#1D4ED8',
    criadoEm: row.created_at || row.criadoEm || new Date().toISOString(),
    ultimoAcesso: row.ultimo_acesso || row.ultimoAcesso || new Date().toISOString(),
    estaConectado: Boolean(row.esta_conectado ?? row.estaConectado ?? false),
    terminalConectado: row.terminal_conectado || row.terminalConectado || undefined,
  };
}

// SQL pronto para criação da tabela no Supabase
const CREATE_USERS_TABLE_SQL = `-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR:
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  matricula VARCHAR(32) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL DEFAULT '1234',
  cargo VARCHAR(32) NOT NULL DEFAULT 'operador' CHECK (cargo IN ('admin', 'gerente', 'supervisor', 'operador')),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  avatar_cor VARCHAR(32) DEFAULT '#1D4ED8',
  esta_conectado BOOLEAN DEFAULT false,
  terminal_conectado VARCHAR(64),
  ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e criar políticas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de usuários" ON public.users;
CREATE POLICY "Permitir leitura de usuários" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir inserção de usuários" ON public.users;
CREATE POLICY "Permitir inserção de usuários" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de usuários" ON public.users;
CREATE POLICY "Permitir atualização de usuários" ON public.users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir exclusão de usuários" ON public.users;
CREATE POLICY "Permitir exclusão de usuários" ON public.users FOR DELETE USING (true);

-- Carga inicial recomendada
INSERT INTO public.users (matricula, nome, email, senha, cargo, status, avatar_cor, esta_conectado)
VALUES
  ('2002', 'Mariana Costa', 'admin@supermercado.com', 'admin', 'admin', 'ativo', '#7C3AED', false),
  ('1001', 'Carlos Silva', 'carlos.silva@supermercado.com', '1234', 'operador', 'ativo', '#1D4ED8', false),
  ('1003', 'Lucas Mendes', 'lucas.mendes@supermercado.com', '1234', 'operador', 'ativo', '#059669', false),
  ('1004', 'Ana Beatriz', 'ana.beatriz@supermercado.com', '1234', 'supervisor', 'ativo', '#D97706', false)
ON CONFLICT (email) DO UPDATE
SET
  cargo = EXCLUDED.cargo,
  status = EXCLUDED.status;`;

// 0. Diagnóstico detalhado do Schema no Supabase
app.get(['/api/supabase/schema-status', '/supabase/schema-status'], async (_req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({
      configured: false,
      connected: false,
      message: 'Supabase não configurado no ambiente.',
      tables: {},
      usersTableMissing: true,
      sqlScript: CREATE_USERS_TABLE_SQL,
    });
  }

  const checkTable = async (tableName: string) => {
    try {
      const { count, error } = await sb.from(tableName).select('*', { count: 'exact', head: true });
      if (error) {
        const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache');
        return { exists: !isMissing, count: null, error: error.message, code: error.code };
      }
      return { exists: true, count: count ?? 0, error: null };
    } catch (err: any) {
      return { exists: false, count: null, error: err?.message || 'Falha desconhecida' };
    }
  };

  const [productsStatus, salesStatus, saleItemsStatus, usersStatus] = await Promise.all([
    checkTable('products'),
    checkTable('sales'),
    checkTable('sale_items'),
    checkTable('users'),
  ]);

  return res.json({
    configured: true,
    connected: true,
    tables: {
      products: productsStatus,
      sales: salesStatus,
      sale_items: saleItemsStatus,
      users: usersStatus,
    },
    usersTableMissing: !usersStatus.exists,
    sqlScript: CREATE_USERS_TABLE_SQL,
  });
});

// 1. Listar todos os usuários (com filtros opcionais ?status=ativo & ?role=...)
app.get(['/api/users', '/users'], async (req: Request, res: Response) => {
  const { status, role } = req.query;
  const sb = getSupabase();

  if (sb) {
    try {
      let query = sb.from('users').select('*');
      if (status) query = query.eq('status', String(status));
      if (role) query = query.eq('cargo', String(role));
      const { data, error } = await query;

      if (error) {
        const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache');
        if (isMissing) {
          // Tabela users ainda não criada no Supabase
          let localUsers = [...SERVER_USERS];
          if (status) localUsers = localUsers.filter((u) => u.status === status);
          if (role) localUsers = localUsers.filter((u) => u.cargo === role);
          const safeUsers = localUsers.map(({ senha, ...rest }) => rest);

          return res.json({
            source: 'server_memory',
            supabaseConnected: true,
            supabaseTableMissing: true,
            message: "A tabela 'users' ainda não foi criada no Supabase. Execute o script SQL no Supabase Dashboard.",
            sqlScript: CREATE_USERS_TABLE_SQL,
            users: safeUsers,
            total: safeUsers.length,
          });
        }
      } else if (data) {
        // Se a tabela existe mas está vazia, auto-semeia com os usuários padrão
        if (data.length === 0 && !status && !role) {
          try {
            const seedRows = SERVER_USERS.map(toSupabaseUser);
            const { data: inserted, error: seedError } = await sb.from('users').insert(seedRows).select();
            if (!seedError && inserted && inserted.length > 0) {
              const mapped = inserted.map(fromSupabaseUser).map(({ senha, ...rest }) => rest);
              return res.json({
                source: 'supabase',
                supabaseTableMissing: false,
                users: mapped,
                total: mapped.length,
              });
            }
          } catch {
            // Ignora falha no auto-seed e segue
          }
        }

        const mapped = data.map(fromSupabaseUser).map(({ senha, ...rest }) => rest);
        return res.json({
          source: 'supabase',
          supabaseTableMissing: false,
          users: mapped,
          total: mapped.length,
        });
      }
    } catch {
      // Fallback para armazenamento interno
    }
  }

  let result = [...SERVER_USERS];
  if (status) {
    result = result.filter((u) => u.status === status);
  }
  if (role) {
    result = result.filter((u) => u.cargo === role);
  }

  const safeUsers = result.map(({ senha, ...rest }) => rest);
  return res.json({
    source: 'server_memory',
    supabaseTableMissing: false,
    users: safeUsers,
    total: safeUsers.length,
  });
});

// 2. Endpoint exclusivo para listar TODOS OS USUÁRIOS ATIVOS
app.get(['/api/users/active', '/users/active'], async (_req: Request, res: Response) => {
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb.from('users').select('*').eq('status', 'ativo');
      if (!error && data) {
        const mapped = data.map(fromSupabaseUser).map(({ senha, ...rest }) => rest);
        return res.json({
          source: 'supabase',
          status: 'ativo',
          total: mapped.length,
          users: mapped,
        });
      }
    } catch {
      // Fallback para servidor
    }
  }

  const activeUsers = SERVER_USERS.filter((u) => u.status === 'ativo').map(
    ({ senha, ...rest }) => rest
  );

  return res.json({
    source: 'server_memory',
    status: 'ativo',
    total: activeUsers.length,
    users: activeUsers,
  });
});

// 3. Cadastrar usuário (CRUD - Create) com sincronização no Supabase
app.post(['/api/users', '/users'], requireRole(['admin', 'gerente']), async (req: Request, res: Response) => {
  const { nome, email, senha = '1234', cargo = 'operador', status = 'ativo', matricula, avatarCor } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existsLocal = SERVER_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existsLocal) {
    return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
  }

  const generatedMatricula = matricula || (1000 + SERVER_USERS.length + 1).toString();
  const newUser = {
    id: `user-${Date.now()}`,
    matricula: generatedMatricula,
    nome: nome.trim(),
    email: cleanEmail,
    senha,
    cargo,
    status,
    avatarCor: avatarCor || '#1D4ED8',
    criadoEm: new Date().toISOString(),
    ultimoAcesso: new Date().toISOString(),
    estaConectado: false,
    terminalConectado: undefined,
  };

  const sb = getSupabase();
  let supabaseResult = null;
  let supabaseTableMissing = false;

  if (sb) {
    try {
      const rowToInsert = toSupabaseUser(newUser);
      const { data, error } = await sb.from('users').insert(rowToInsert).select().single();

      if (error) {
        console.warn('Erro ao inserir no Supabase:', error.message);
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          supabaseTableMissing = true;
        }
      } else if (data) {
        supabaseResult = fromSupabaseUser(data);
        newUser.id = supabaseResult.id;
      }
    } catch (err: any) {
      console.warn('Exceção ao persistir no Supabase:', err?.message);
    }
  }

  SERVER_USERS.push(newUser);
  const { senha: _, ...safeUser } = newUser;

  return res.status(201).json({
    success: true,
    source: supabaseResult ? 'supabase' : 'server_memory',
    supabaseTableMissing,
    user: safeUser,
    message: supabaseResult
      ? 'Usuário criado com sucesso no Supabase!'
      : supabaseTableMissing
      ? "Usuário salvo localmente. Crie a tabela 'users' no Supabase para sincronizar em nuvem."
      : 'Usuário registrado com sucesso.',
  });
});

// 4. Atualizar dados do usuário (CRUD - Update)
app.put(['/api/users/:id', '/users/:id'], requireRole(['admin', 'gerente']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, email, senha, cargo, status, matricula, avatarCor } = req.body;

  const userIndex = SERVER_USERS.findIndex((u) => u.id === id || u.email.toLowerCase() === String(email || '').toLowerCase());
  let targetUser = userIndex !== -1 ? SERVER_USERS[userIndex] : null;

  const updates: any = {};
  if (nome) updates.nome = nome.trim();
  if (email) updates.email = email.trim().toLowerCase();
  if (senha) updates.senha = senha.trim();
  if (cargo) updates.cargo = cargo;
  if (status) updates.status = status;
  if (matricula) updates.matricula = matricula;
  if (avatarCor) updates.avatar_cor = avatarCor;

  const sb = getSupabase();
  let supabaseUpdated = false;

  if (sb) {
    try {
      const { data, error } = await sb
        .from('users')
        .update(updates)
        .or(`id.eq.${id},email.eq.${email || targetUser?.email || ''}`)
        .select();

      if (!error && data && data.length > 0) {
        supabaseUpdated = true;
      }
    } catch (err: any) {
      console.warn('Erro ao atualizar no Supabase:', err?.message);
    }
  }

  if (targetUser) {
    if (nome) targetUser.nome = nome.trim();
    if (email) targetUser.email = email.trim().toLowerCase();
    if (senha) targetUser.senha = senha.trim();
    if (cargo) targetUser.cargo = cargo;
    if (status) targetUser.status = status;
    if (matricula) targetUser.matricula = matricula;
    if (avatarCor) targetUser.avatarCor = avatarCor;
  }

  return res.json({
    success: true,
    source: supabaseUpdated ? 'supabase' : 'server_memory',
    message: 'Dados do usuário atualizados com sucesso.',
  });
});

// 5. Alterar Status Ativo/Inativo (Admin ou Gerente)
app.patch(
  ['/api/users/:id/status', '/users/:id/status'],
  requireRole(['admin', 'gerente']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = SERVER_USERS.find((u) => u.id === id);
    const newStatus = status === 'inativo' ? 'inativo' : 'ativo';

    if (user) {
      user.status = newStatus;
      if (newStatus === 'inativo') {
        user.estaConectado = false;
        user.terminalConectado = undefined;
      }
    }

    const sb = getSupabase();
    if (sb) {
      try {
        await sb
          .from('users')
          .update({
            status: newStatus,
            esta_conectado: newStatus === 'inativo' ? false : undefined,
          })
          .or(`id.eq.${id},email.eq.${user?.email || ''}`);
      } catch {
        // Ignora erro no Supabase
      }
    }

    const safeUser = user ? (({ senha, ...rest }) => rest)(user) : { id, status: newStatus };
    return res.json({ success: true, user: safeUser });
  }
);

// 6. Atualizar Conexão/Terminal do Usuário
app.patch(['/api/users/:id/connect', '/users/:id/connect'], async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estaConectado, terminalConectado } = req.body;

  const user = SERVER_USERS.find((u) => u.id === id);
  if (user) {
    user.estaConectado = Boolean(estaConectado);
    user.terminalConectado = terminalConectado || undefined;
    user.ultimoAcesso = new Date().toISOString();
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb
        .from('users')
        .update({
          esta_conectado: Boolean(estaConectado),
          terminal_conectado: terminalConectado || null,
          ultimo_acesso: new Date().toISOString(),
        })
        .or(`id.eq.${id},email.eq.${user?.email || ''}`);
    } catch {
      // Ignora erro
    }
  }

  return res.json({ success: true });
});

// 7. Excluir usuário (Acesso EXCLUSIVO do Administrador)
app.delete(
  ['/api/users/:id', '/users/:id'],
  requireRole(['admin']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const index = SERVER_USERS.findIndex((u) => u.id === id);

    if (index !== -1 && SERVER_USERS[index].cargo === 'admin') {
      const adminCount = SERVER_USERS.filter((u) => u.cargo === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Não é permitido remover o único Administrador do sistema.' });
      }
    }

    const targetEmail = index !== -1 ? SERVER_USERS[index].email : '';

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('users').delete().or(`id.eq.${id},email.eq.${targetEmail}`);
      } catch (err: any) {
        console.warn('Erro ao deletar no Supabase:', err?.message);
      }
    }

    if (index !== -1) {
      SERVER_USERS.splice(index, 1);
    }

    return res.json({ success: true, message: 'Usuário removido com sucesso.' });
  }
);

// 8. Sincronizar todos os usuários locais com o Supabase (Bulk Sync)
app.post(['/api/users/sync-all', '/users/sync-all'], requireRole(['admin', 'gerente']), async (req: Request, res: Response) => {
  const { users } = req.body;
  const userList: any[] = Array.isArray(users) && users.length > 0 ? users : SERVER_USERS;

  const sb = getSupabase();
  if (!sb) {
    return res.status(400).json({ success: false, error: 'Supabase não conectado.' });
  }

  try {
    const rows = userList.map(toSupabaseUser);
    const { data, error } = await sb.from('users').upsert(rows, { onConflict: 'email' }).select();

    if (error) {
      const isMissing = error.code === 'PGRST205' || error.message?.includes('schema cache');
      return res.status(400).json({
        success: false,
        supabaseTableMissing: isMissing,
        error: error.message,
        sqlScript: CREATE_USERS_TABLE_SQL,
      });
    }

    return res.json({
      success: true,
      syncedCount: data?.length ?? rows.length,
      message: `${data?.length ?? rows.length} usuários sincronizados com o Supabase com sucesso!`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Falha ao sincronizar' });
  }
});

// Inicialização do servidor Vite e Express
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PDV Inteligente rodando em http://localhost:${PORT}`);
    const sb = getSupabase();
    if (sb) {
      console.log('📡 Integração com Supabase ATIVA.');
    } else {
      console.log('ℹ️ Supabase não configurado. Adicione SUPABASE_URL e SUPABASE_ANON_KEY no arquivo de ambiente/segredos.');
    }
  });
}

// Exporta a instância do Express para plataformas serverless como Vercel
export default app;

// Inicia o servidor apenas em ambiente de servidor (não em funções serverless da Vercel)
if (!process.env.VERCEL) {
  startServer();
}
