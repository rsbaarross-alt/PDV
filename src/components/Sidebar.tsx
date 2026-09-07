/**
 * BARRA LATERAL (SIDEBAR) MASTER — PDV INTELIGENTE v2.0
 * Painel lateral completo com Navegação, Perfil do Operador, Gestão,
 * Movimentação de Caixa (Sangria/Suprimento), Histórico de Vendas,
 * Status de Conexão Supabase, Periféricos e Ferramentas Rápidas.
 */
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Users,
  Wallet,
  Receipt,
  Database,
  Calculator,
  Keyboard,
  Cpu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  DollarSign,
  TrendingUp,
  Circle,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SessionInfo, UserRole } from '../types';
import { formatBRL, formatLiveTime } from '../utils/formatters';
import { SupabaseStatus } from '../services/api';
import { getUserMetrics, subscribeUsersChange } from '../services/userService';
import {
  getCashDrawerSummary,
  getRecordedSales,
  subscribeSessionSales,
} from '../services/salesSessionService';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  session: SessionInfo | null;
  onLogout: () => void;
  onOpenConsultPrice: () => void;
  onOpenUsersManagement: () => void;
  onOpenSupabaseInfo: () => void;
  onOpenShortcuts: () => void;
  onOpenSalesHistory: () => void;
  onOpenCashMovement: () => void;
  onOpenCalculator: () => void;
  onOpenPeripherals: () => void;
  supabaseStatus: SupabaseStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  session,
  onLogout,
  onOpenConsultPrice,
  onOpenUsersManagement,
  onOpenSupabaseInfo,
  onOpenShortcuts,
  onOpenSalesHistory,
  onOpenCashMovement,
  onOpenCalculator,
  onOpenPeripherals,
  supabaseStatus,
}) => {
  const [userMetrics, setUserMetrics] = useState(getUserMetrics());
  const [salesSummary, setSalesSummary] = useState(() =>
    getCashDrawerSummary(session?.fundoTrocoInicial || 200)
  );
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualização em tempo real das métricas
  useEffect(() => {
    const unsubUsers = subscribeUsersChange(() => {
      setUserMetrics(getUserMetrics());
    });
    const unsubSales = subscribeSessionSales(() => {
      setSalesSummary(getCashDrawerSummary(session?.fundoTrocoInicial || 200));
    });
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      unsubUsers();
      unsubSales();
      clearInterval(timer);
    };
  }, [session]);

  const operador = session?.operador;

  // Tradução e cor do Cargo
  const getCargoLabel = (cargo?: UserRole) => {
    switch (cargo) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'gerente':
        return { label: 'Gerente Geral', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'supervisor':
        return { label: 'Supervisor', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'Operador de Caixa', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const cargoInfo = getCargoLabel(operador?.cargo);

  // Iniciais do Operador para Avatar
  const getInitials = (name?: string) => {
    if (!name) return 'OP';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside
      id="main-sidebar"
      aria-label="Barra Lateral de Navegação do PDV"
      className={`relative flex flex-col bg-[#0F172A] text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out shrink-0 select-none z-30 ${
        isCollapsed ? 'w-[72px]' : 'w-[270px]'
      }`}
    >
      {/* 1. CABEÇALHO DO SIDEBAR: LOGO + TOGGLE */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <ShoppingCart size={19} className="text-white" />
            </div>
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[14px] text-white tracking-tight">PDV INTELIGENTE</span>
                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Terminal Frente de Caixa</span>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShoppingCart size={20} />
            </div>
          </div>
        )}

        {/* Botão de Colapsar/Expandir */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ${
            isCollapsed ? 'absolute -right-3 top-5 bg-slate-800 text-white rounded-full p-1 border border-slate-700 shadow-md' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* 2. CARD DO OPERADOR DA SESSÃO */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar com cor do usuário e bolinha de status */}
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                  style={{ backgroundColor: operador?.avatarCor || '#1D4ED8' }}
                >
                  {getInitials(operador?.nome)}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0F172A]"
                  title="Operador Conectado"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">{operador?.nome || 'Operador'}</h4>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${cargoInfo.bg}`}>
                    {cargoInfo.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">• {session?.caixa || 'Caixa 04'}</span>
                </div>
              </div>
            </div>

            {/* Ação rápida: Trocar Operador */}
            <button
              type="button"
              onClick={onLogout}
              title="Trocar Operador / Encerrar Sessão"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs cursor-pointer"
                style={{ backgroundColor: operador?.avatarCor || '#1D4ED8' }}
                title={`${operador?.nome} (${cargoInfo.label})`}
              >
                {getInitials(operador?.nome)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0F172A]" />
            </div>
          </div>
        )}
      </div>

      {/* 3. MENU DE NAVEGAÇÃO E RECURSOS COM SCROLL */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 custom-scrollbar">
        {/* GRUPO 1: OPERAÇÃO DE CAIXA */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operação de Caixa
            </div>
          )}

          {/* Frente de Caixa (Ativo) */}
          <div
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Frente de Caixa (PDV) — Em Atendimento"
          >
            <ShoppingCart size={18} className="shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Frente de Caixa</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-700/60 px-2 py-0.5 rounded-full text-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo
                </span>
              </div>
            )}
          </div>

          {/* Consultar Preço (F8) */}
          <button
            type="button"
            onClick={onOpenConsultPrice}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Consultar Preço de Produto (Atalho: F8)"
          >
            <Search size={18} className="text-slate-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Consultar Preço</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 rounded text-slate-400">
                  F8
                </kbd>
              </div>
            )}
          </button>

          {/* Movimentação de Caixa: Sangria & Suprimento */}
          <button
            type="button"
            onClick={onOpenCashMovement}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Movimentação de Caixa (Sangria & Suprimento)"
          >
            <Wallet size={18} className="text-amber-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Sangria & Suprimento</span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {formatBRL(salesSummary.saldoGavetaAtual)}
                </span>
              </div>
            )}
          </button>

          {/* Histórico de Vendas do Turno */}
          <button
            type="button"
            onClick={onOpenSalesHistory}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Histórico de Vendas do Turno Atual"
          >
            <Receipt size={18} className="text-emerald-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Histórico de Vendas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {salesSummary.qtdVendas} vendas
                </span>
              </div>
            )}
          </button>
        </div>

        {/* GRUPO 2: ADMINISTRAÇÃO & CONECTIVIDADE */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Administração & Nuvem
            </div>
          )}

          {/* Gestão de Usuários (F7) */}
          <button
            type="button"
            onClick={onOpenUsersManagement}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Gestão de Usuários e Permissões (Atalho: F7)"
          >
            <Users size={18} className="text-indigo-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Gestão de Usuários</span>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {userMetrics.ativos} ativos
                  </span>
                  <kbd className="px-1 py-0.5 text-[9px] font-mono font-bold bg-slate-800 border border-slate-700 rounded text-slate-400">
                    F7
                  </kbd>
                </div>
              </div>
            )}
          </button>

          {/* Status do Supabase */}
          <button
            type="button"
            onClick={onOpenSupabaseInfo}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Diagnóstico da Conexão com Supabase"
          >
            <Database
              size={18}
              className={`shrink-0 ${supabaseStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`}
            />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Supabase Nuvem</span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    supabaseStatus.connected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      supabaseStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {supabaseStatus.connected ? 'Online' : 'Local'}
                </span>
              </div>
            )}
          </button>

          {/* Periféricos do Caixa */}
          <button
            type="button"
            onClick={onOpenPeripherals}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Diagnóstico de Hardware & Periféricos"
          >
            <Cpu size={18} className="text-purple-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Periféricos & Portas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  4/4 OK
                </span>
              </div>
            )}
          </button>
        </div>

        {/* GRUPO 3: FERRAMENTAS DO OPERADOR */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ferramentas & Ajuda
            </div>
          )}

          {/* Calculadora / Troco Rápido */}
          <button
            type="button"
            onClick={onOpenCalculator}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Calculadora Rápida e Conferência de Troco"
          >
            <Calculator size={18} className="text-cyan-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Calculadora de Caixa</span>
                <span className="text-[10px] text-slate-400 font-mono">Troco</span>
              </div>
            )}
          </button>

          {/* Atalhos de Teclado */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Guia Completo de Teclas de Atalho (F1-F12)"
          >
            <Keyboard size={18} className="text-slate-400 shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span>Guia de Atalhos</span>
                <span className="text-[10px] text-slate-400">F1 - F12</span>
              </div>
            )}
          </button>
        </div>

        {/* 4. MINI-DASHBOARD DO TURNO (EXIBIDO QUANDO EXPANDIDO) */}
        {!isCollapsed && (
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-400" />
                Resumo do Turno
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {formatLiveTime(currentTime)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block">Vendas Totais:</span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  {formatBRL(salesSummary.totalVendasGeral)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block">Saldo Gaveta:</span>
                <span className="text-xs font-black text-amber-400 font-mono">
                  {formatBRL(salesSummary.saldoGavetaAtual)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Cupons Emitidos: <strong>{salesSummary.qtdVendas}</strong></span>
              <span>Ticket Médio: <strong>{formatBRL(salesSummary.ticketMedio)}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 5. RODAPÉ DO SIDEBAR: BOTÃO DE LOGOUT & STATUS */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PDV Operacional</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLogout}
              title="Encerrar Sessão / Trocar Operador"
              className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
