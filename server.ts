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
