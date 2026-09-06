/**
 * Modal de Informações e Status da Integração com o Supabase
 */
import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, X, ShieldCheck, Terminal } from 'lucide-react';
import { SupabaseStatus } from '../services/api';

interface SupabaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SupabaseStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const SQL_SNIPPET = `-- Execute no SQL Editor do Supabase:
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(32) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  preco NUMERIC(10, 2) NOT NULL CHECK (preco >= 0),
  categoria VARCHAR(64) NOT NULL,
  estoque NUMERIC(10, 3) NOT NULL DEFAULT 0,
  unidade VARCHAR(10) NOT NULL DEFAULT 'un',
  icone VARCHAR(64) NOT NULL DEFAULT 'Package',
  favorito BOOLEAN DEFAULT false,
  recente BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_venda VARCHAR(64),
  subtotal NUMERIC(10, 2) NOT NULL,
  desconto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  metodo_pagamento VARCHAR(32) NOT NULL,
  operador VARCHAR(100) DEFAULT 'Carlos Silva',
  caixa VARCHAR(50) DEFAULT 'Caixa 04',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  produto_codigo VARCHAR(32) NOT NULL,
  produto_nome VARCHAR(255) NOT NULL,
  quantidade NUMERIC(10, 3) NOT NULL,
  preco_unitario NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL
);`;

export const SupabaseInfoModal: React.FC<SupabaseInfoModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh,
  isRefreshing,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="supabase-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="supabase-modal"
        className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up"
      >
        {/* Header do Modal */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Database size={22} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                Integração Banco de Dados Supabase
              </h2>
              <p className="text-[12px] text-slate-400">
                Sincronização do catálogo e registro permanente de vendas do PDV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Card de Status da Conexão */}
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
              status.connected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {status.connected ? (
                <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={22} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px]">
                    {status.connected
                      ? 'Conexão Ativa com o Supabase'
                      : status.configured
                      ? 'Credenciais detectadas, aguardando tabelas'
                      : 'Modo Local Ativo (Aguardando Credenciais)'}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      status.connected
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-amber-200 text-amber-800'
                    }`}
                  >
                    {status.connected ? 'Online' : 'Fallback Local'}
                  </span>
                </div>
                <p className="text-[13px] mt-1 opacity-90 leading-relaxed">
                  {status.message}
                </p>
                {status.connected && status.productCount !== undefined && (
                  <p className="text-[12px] font-medium text-emerald-700 mt-1.5">
                    📦 {status.productCount} produtos carregados diretamente do banco.
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-[12px] font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              title="Recarregar conexão"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#1D4ED8]' : ''} />
              <span>{isRefreshing ? 'Testando...' : 'Re-testar'}</span>
            </button>
          </div>

          {/* Variáveis de Ambiente Necessárias */}
          <div className="space-y-2">
            <h3 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1D4ED8]" />
              Variáveis de Conexão Necessárias
            </h3>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Configure as credenciais do seu projeto Supabase nas variáveis de ambiente do sistema:
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[12px] text-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>
                  <strong className="text-[#1D4ED8]">SUPABASE_URL</strong>=https://seu-projeto.supabase.co
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span>
                  <strong className="text-[#1D4ED8]">SUPABASE_ANON_KEY</strong>=eyJhbGciOiJIUzI1NiIsInR5c...
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">
                  <strong className="text-slate-600">SUPABASE_SERVICE_ROLE_KEY</strong>=(opcional para acesso irrestrito)
                </span>
              </div>
            </div>
          </div>

          {/* Script de Criação das Tabelas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                <Terminal size={16} className="text-[#0284C7]" />
                Script SQL das Tabelas (SQL Editor)
              </h3>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1D4ED8] hover:text-blue-800 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[12px] text-slate-600">
              O arquivo completo com tabelas, RLS e carga inicial também está salvo em{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">
                supabase_schema.sql
              </code>
              .
            </p>

            <div className="relative bg-slate-900 rounded-xl p-3.5 text-[12px] font-mono text-slate-200 max-h-[170px] overflow-y-auto border border-slate-800">
              <pre className="whitespace-pre">{SQL_SNIPPET}</pre>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[12px] text-slate-500">
            Pressione <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-slate-600">Esc</kbd> para fechar
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-xl text-[14px] font-semibold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
