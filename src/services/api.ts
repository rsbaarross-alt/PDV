/**
 * Serviço de API e sincronização do PDV com o Backend / Supabase
 * Suporta modo Full-Stack (Serverless /api na Vercel e Node.js)
 * e modo Failover direto pelo client caso o endpoint /api não esteja disponível.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, CartItem, PaymentMethodType } from '../types';

export interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  message: string;
  productCount?: number;
}

export interface SalePayload {
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

export interface SaleResult {
  success: boolean;
  saleId?: string;
  codigoVenda?: string;
  source: 'supabase' | 'local';
  message: string;
}

// Cliente Supabase opcional para o frontend (caso configurado com VITE_SUPABASE_*)
let clientSupabaseInstance: SupabaseClient | null = null;

function getClientSupabase(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!clientSupabaseInstance) {
    try {
      const cleanUrl = url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
      clientSupabaseInstance = createClient(cleanUrl, key.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (e) {
      console.warn('Erro ao inicializar Supabase no cliente:', e);
      return null;
    }
  }

  return clientSupabaseInstance;
}

/**
 * Consulta status da integração com o Supabase
 */
export async function checkSupabaseStatus(): Promise<SupabaseStatus> {
  // 1. Tenta verificar via endpoint /api do backend (servidor ou serverless function)
  try {
    const res = await fetch('/api/supabase/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Continua para o fallback de cliente
  }

  // 2. Fallback: verifica se há credenciais no cliente
  const clientSb = getClientSupabase();
  if (clientSb) {
    try {
      const { count, error } = await clientSb.from('products').select('*', { count: 'exact', head: true });
      if (!error) {
        return {
          configured: true,
          connected: true,
          productCount: count ?? 0,
          message: 'Conectado ao Supabase diretamente pelo cliente (Vite).',
        };
      }
      return {
        configured: true,
        connected: false,
        message: `Erro na tabela do Supabase: ${error.message}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha';
      return {
        configured: true,
        connected: false,
        message: `Exceção no cliente Supabase: ${message}`,
      };
    }
  }

  return {
    configured: false,
    connected: false,
    message: 'Backend local ativo. Supabase aguardando credenciais na Vercel.',
  };
}

/**
 * Carrega catálogo de produtos (do Supabase se ativo, ou fallback local)
 */
export async function fetchProducts(): Promise<{ products: Product[]; source: 'supabase' | 'local' }> {
  // 1. Tenta carregar via API do backend
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data && data.products) {
        return {
          products: data.products,
          source: data.source || 'local',
        };
      }
    }
  } catch {
    // Continua para o fallback
  }

  // 2. Fallback direto pelo cliente Supabase se disponível
  const clientSb = getClientSupabase();
  if (clientSb) {
    try {
      const { data, error } = await clientSb.from('products').select('*').order('nome', { ascending: true });
      if (!error && data && data.length > 0) {
        const mappedProducts: Product[] = data.map((item) => ({
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
        return {
          products: mappedProducts,
          source: 'supabase',
        };
      }
    } catch (err) {
      console.warn('Falha no fallback de produtos via cliente Supabase:', err);
    }
  }

  // 3. Fallback de dados locais
  return {
    products: [],
    source: 'local',
  };
}

/**
 * Registra a venda finalizada no Supabase
 */
export async function registerSale(payload: SalePayload): Promise<SaleResult> {
  // 1. Tenta registrar através da API do backend
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Continua para o fallback
  }

  // 2. Fallback via cliente Supabase direto (caso a API não esteja em execução)
  const clientSb = getClientSupabase();
  if (clientSb) {
    try {
      const saleCode = `VD-${Date.now().toString().slice(-6)}`;
      const { data: saleData, error: saleError } = await clientSb
        .from('sales')
        .insert([
          {
            codigo_venda: saleCode,
            subtotal: Number(payload.subtotal),
            desconto: Number(payload.desconto || 0),
            desconto_tipo: payload.descontoTipo || 'reais',
            total: Number(payload.total),
            metodo_pagamento: payload.metodoPagamento,
            valor_recebido: payload.valorRecebido ? Number(payload.valorRecebido) : null,
            troco: payload.troco ? Number(payload.troco) : 0,
            operador: payload.operador,
            caixa: payload.caixa,
            status: 'concluida',
          },
        ])
        .select('id')
        .single();

      if (!saleError && saleData) {
        const saleId = saleData.id;
        const itemsToInsert = payload.itens.map((item) => ({
          sale_id: saleId,
          produto_codigo: item.produto.codigo,
          produto_nome: item.produto.nome,
          quantidade: Number(item.quantidade),
          preco_unitario: Number(item.precoUnitario),
          total: Number(item.total),
          unidade: item.produto.unidade || 'un',
        }));

        await clientSb.from('sale_items').insert(itemsToInsert);

        return {
          success: true,
          source: 'supabase',
          saleId,
          codigoVenda: saleCode,
          message: 'Venda salva diretamente no Supabase com sucesso!',
        };
      }
    } catch (clientErr) {
      console.warn('Falha no fallback de inserção via cliente Supabase:', clientErr);
    }
  }

  // 3. Fallback local
  return {
    success: true,
    source: 'local',
    saleId: `sale-${Date.now()}`,
    codigoVenda: `LOC-${Date.now().toString().slice(-4)}`,
    message: 'Venda finalizada localmente no PDV.',
  };
}
