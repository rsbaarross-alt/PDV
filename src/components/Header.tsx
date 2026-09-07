/**
 * ZONA A — HEADER (64px altura fixa)
 * Logo PDV | Busca Inteligente (F3) | Info Operador & Relógio
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingBag,
  Clock,
  User,
  Monitor,
  X,
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  Sparkles,
  Database,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Users,
  PanelLeft,
  Receipt,
  Wallet,
} from 'lucide-react';
import { Product, SessionInfo } from '../types';
import { fuzzySearchProducts, SearchMatchResult } from '../utils/fuzzySearch';
import { formatBRL } from '../utils/formatters';
import { SupabaseStatus } from '../services/api';
import { getUserMetrics, subscribeUsersChange } from '../services/userService';

interface HeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenConsultPrice: () => void;
  onOpenShortcuts: () => void;
  supabaseStatus: SupabaseStatus;
  onOpenSupabaseInfo: () => void;
  session: SessionInfo | null;
  onLogout: () => void;
  onOpenUsersManagement: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenSalesHistory?: () => void;
  onOpenCashMovement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  products,
  onSelectProduct,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  onOpenConsultPrice,
  onOpenShortcuts,
  supabaseStatus,
  onOpenSupabaseInfo,
  session,
  onLogout,
  onOpenUsersManagement,
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenSalesHistory,
  onOpenCashMovement,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchResults, setSearchResults] = useState<SearchMatchResult[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMetrics, setUserMetrics] = useState(getUserMetrics());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Subscreve a atualizações na base de usuários/sessões
  useEffect(() => {
    const unsub = subscribeUsersChange(() => {
      setUserMetrics(getUserMetrics());
    });
    return () => unsub();
  }, []);

  // Fecha dropdown do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounce de 150ms para busca tolerante
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSelectedIndex(-1);
      return;
    }

    const handler = setTimeout(() => {
      const results = fuzzySearchProducts(searchQuery, products);
      setSearchResults(results.slice(0, 6)); // máximo 6 sugestões
      setSelectedIndex(0); // foca no primeiro por padrão para agilidade no Enter
    }, 150);

    return () => clearTimeout(handler);
  }, [searchQuery, products]);

  // Teclas no input de busca
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const itemToSelect = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
        if (itemToSelect) {
          onSelectProduct(itemToSelect.product);
          setSearchQuery('');
          setSearchResults([]);
          setSelectedIndex(-1);
          searchInputRef.current?.blur();
        }
      }
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setSelectedIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  return (
    <header
      id="pdv-header"
      className="h-16 w-full border-b border-[#E2E8F0] bg-white flex items-center justify-between px-5 relative z-40 select-none shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
    >
      {/* Lado Esquerdo: Toggle da Sidebar + Marca & Status */}
      <div className="flex items-center gap-3 min-w-[220px]">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <PanelLeft size={18} />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/20">
          <ShoppingBag size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[17px] text-[#1E293B] tracking-tight leading-none">
              PDV INTELIGENTE
            </span>
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[#1D4ED8]">
              v2.0
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Caixa Aberto
            </span>
            <span className="text-slate-300">•</span>
            <button
              onClick={onOpenShortcuts}
              className="text-[11px] text-[#64748B] hover:text-[#1D4ED8] underline cursor-pointer transition-colors"
              title="Ver atalhos do teclado"
            >
              Atalhos de Teclado
            </button>
          </div>
        </div>
      </div>

      {/* Centro: Barra de Busca Inteligente (50%+ da largura) */}
      <div className="w-[52%] max-w-[760px] relative">
        <div
          className={`relative flex items-center h-11 w-full rounded-[14px] bg-[#F9FAFB] border transition-all duration-150 ${
            isFocused
              ? 'border-[#1D4ED8] bg-white shadow-[0_0_0_3px_rgba(29,78,216,0.12)]'
              : 'border-[#E2E8F0] hover:border-slate-300'
          }`}
        >
          <Search
            size={18}
            className={`ml-3.5 transition-colors ${
              isFocused ? 'text-[#1D4ED8]' : 'text-[#64748B]'
            }`}
          />
          <input
            id="pdv-search-input"
            ref={searchInputRef}
            type="text"
            role="searchbox"
            aria-label="Buscar produto por nome, código ou descrição"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Pequeno delay para permitir clique nas sugestões
              setTimeout(() => setIsFocused(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar produto por nome, código ou descrição... (F3)"
            className="w-full h-full bg-transparent px-3 text-[14px] text-[#1E293B] placeholder-[#64748B] outline-none font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                searchInputRef.current?.focus();
              }}
              aria-label="Limpar busca"
              className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <div className="flex items-center gap-1 mr-2.5">
            <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              F3
            </kbd>
          </div>
        </div>

        {/* Dropdown de Autocompletar Flutuante */}
        {isFocused && searchResults.length > 0 && (
          <div
            id="pdv-search-dropdown"
            ref={dropdownRef}
            className="absolute left-0 right-0 top-12 mt-1.5 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50 animate-slide-down"
          >
            <div className="px-3 py-2 bg-[#F9FAFB] border-b border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">
                {searchResults.length} {searchResults.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
              </span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <ArrowUp size={12} />
                  <ArrowDown size={12} /> navegar
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft size={12} /> adicionar
                </span>
              </div>
            </div>

            <ul className="divide-y divide-[#E2E8F0] max-h-[360px] overflow-y-auto">
              {searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={item.product.codigo}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelect(item.product)}
                    className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-l-4 border-[#1D4ED8]'
                        : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-[12px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {item.highlightedCode.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            className={part.highlight ? 'font-bold text-[#1D4ED8]' : ''}
                          >
                            {part.text}
                          </span>
                        ))}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#1E293B]">
                          {item.highlightedName.map((part, pIdx) => (
                            <span
                              key={pIdx}
                              className={part.highlight ? 'font-bold text-[#1D4ED8]' : ''}
                            >
                              {part.text}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
                          <span>{item.product.categoria}</span>
                          <span>•</span>
                          <span>Estoque: {item.product.estoque} {item.product.unidade}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[16px] font-bold text-[#1D4ED8]">
                        {formatBRL(item.product.preco)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        por {item.product.unidade}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Lado Direito: Info Operador, Caixa e Relógio */}
      <div className="flex items-center gap-3 text-right min-w-[220px] justify-end">
        {/* Status Supabase */}
        <button
          onClick={onOpenSupabaseInfo}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
            supabaseStatus.connected
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/80'
              : supabaseStatus.configured
              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title={
            supabaseStatus.connected
              ? 'Supabase: Banco conectado'
              : 'Supabase: Clique para ver status e credenciais'
          }
        >
          <Database size={13} className={supabaseStatus.connected ? 'text-emerald-600' : 'text-slate-500'} />
          <span className="hidden sm:inline">Supabase</span>
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseStatus.connected
                ? 'bg-emerald-500 animate-pulse'
                : supabaseStatus.configured
                ? 'bg-amber-500'
                : 'bg-slate-400'
            }`}
          />
        </button>

        <button
          onClick={onOpenConsultPrice}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1D4ED8] hover:border-blue-300 hover:bg-blue-50/50 text-[12px] font-semibold transition-all cursor-pointer"
          title="Consulta Rápida de Preço (F8)"
        >
          <Sparkles size={14} className="text-[#0284C7]" />
          <span>Preço</span>
          <kbd className="px-1 text-[10px] bg-slate-100 border border-slate-200 rounded font-mono text-slate-500">
            F8
          </kbd>
        </button>

        {/* Botão de Gestão de Usuários & Sessões */}
        <button
          type="button"
          onClick={onOpenUsersManagement}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-blue-50/70 hover:border-blue-300 text-slate-700 hover:text-[#1D4ED8] text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
          title="Controle de Usuários e Sessões Conectadas"
        >
          <Users size={14} className="text-[#1D4ED8]" />
          <span className="hidden sm:inline">Usuários</span>
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {userMetrics.conectados}
          </span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        {/* Informações do Operador & Menu de Sessão */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-all text-left cursor-pointer border border-transparent hover:border-slate-200"
            title="Clique para opções de operador e caixa"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0"
              style={{ backgroundColor: session?.operador.avatarCor || '#1E40AF' }}
            >
              {session?.operador.nome.charAt(0) || 'O'}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[13px] font-semibold text-slate-800 leading-tight">
                  {session?.operador.nome || 'Carlos Silva'}
                </span>
                <ChevronDown size={13} className="text-slate-400" />
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Monitor size={11} />
                  {session?.caixa || 'Caixa 04'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                  <Clock size={11} className="text-slate-400" />
                  {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </button>

          {/* Dropdown do Operador */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-slide-down">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                    style={{ backgroundColor: session?.operador.avatarCor || '#1E40AF' }}
                  >
                    {session?.operador.nome.charAt(0) || 'O'}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight">
                      {session?.operador.nome || 'Carlos Silva'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Matrícula: {session?.operador.matricula || '1001'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                    {session?.operador.cargo || 'operador'}
                  </span>
                  <span className="text-slate-500">
                    {session?.caixa || 'Caixa 04'}
                  </span>
                </div>
                {session?.fundoTrocoInicial !== undefined && (
                  <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between">
                    <span>Fundo inicial:</span>
                    <span className="font-bold text-emerald-700">
                      {formatBRL(session.fundoTrocoInicial)}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-1.5 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenUsersManagement();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1D4ED8] rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-[#1D4ED8]" />
                    <span>Gestão de Usuários</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {userMetrics.conectados} online
                  </span>
                </button>

                {onOpenSalesHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenSalesHistory();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all cursor-pointer"
                  >
                    <Receipt size={15} className="text-emerald-600" />
                    <span>Histórico de Vendas</span>
                  </button>
                )}

                {onOpenCashMovement && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenCashMovement();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all cursor-pointer"
                  >
                    <Wallet size={15} className="text-amber-600" />
                    <span>Sangria & Suprimento</span>
                  </button>
                )}

                <div className="h-px bg-slate-100 my-1"></div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Trocar Operador / Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
