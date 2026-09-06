import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User,
  Monitor,
  Eye,
  EyeOff,
  ShoppingBag,
  Database,
  Clock,
  Calendar,
  AlertCircle,
  LogIn,
  KeyRound,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Delete,
} from 'lucide-react';
import { Operator, SessionInfo } from '../types';
import { MOCK_OPERATORS, AVAILABLE_TERMINALS, OperatorCredential } from '../data/mockOperators';
import { SupabaseStatus } from '../services/api';
import { formatBRL } from '../utils/formatters';

interface LoginScreenProps {
  onLoginSuccess: (session: SessionInfo) => void;
  supabaseStatus: SupabaseStatus;
  initialTerminal?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  supabaseStatus,
  initialTerminal = 'Caixa 04',
}) => {
  const [identificador, setIdentificador] = useState<string>('1001');
  const [senha, setSenha] = useState<string>('1234');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [terminal, setTerminal] = useState<string>(initialTerminal);
  const [fundoTroco, setFundoTroco] = useState<number>(100.00);
  const [lembrarLogin, setLembrarLogin] = useState<boolean>(true);
  const [loginMode, setLoginMode] = useState<'teclado' | 'pin'>('teclado');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const identificadorInputRef = useRef<HTMLInputElement>(null);
  const senhaInputRef = useRef<HTMLInputElement>(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Foca no campo de identificador ao carregar
  useEffect(() => {
    identificadorInputRef.current?.focus();
  }, []);

  const handleSelectQuickOperator = (op: OperatorCredential) => {
    setIdentificador(op.matricula);
    setSenha(op.senha);
    setErrorMessage(null);
    if (senhaInputRef.current) {
      senhaInputRef.current.focus();
    }
  };

  const handlePinInput = (num: string) => {
    setErrorMessage(null);
    setSenha((prev) => (prev.length < 8 ? prev + num : prev));
  };

  const handlePinBackspace = () => {
    setSenha((prev) => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setSenha('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanIdentificador = identificador.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!cleanIdentificador) {
      setErrorMessage('Informe a matrícula, e-mail ou nome do operador.');
      identificadorInputRef.current?.focus();
      return;
    }

    if (!cleanSenha) {
      setErrorMessage('Digite a senha ou PIN de acesso.');
      senhaInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    // Simulação com validação contra credenciais ou operador livre
    setTimeout(() => {
      // Procura operador cadastrado
      const found = MOCK_OPERATORS.find(
        (op) =>
          op.matricula.toLowerCase() === cleanIdentificador ||
          op.email.toLowerCase() === cleanIdentificador ||
          op.nome.toLowerCase() === cleanIdentificador
      );

      let loggedOperator: Operator;

      if (found) {
        if (found.senha !== cleanSenha && found.pin !== cleanSenha) {
          setIsLoading(false);
          setErrorMessage('Senha incorreta para o operador selecionado. Tente novamente.');
          return;
        }
        loggedOperator = {
          id: found.id,
          matricula: found.matricula,
          nome: found.nome,
          email: found.email,
          cargo: found.cargo,
          avatarCor: found.avatarCor,
        };
      } else {
        // Permite operador dinâmico caso seja digitado outro nome
        loggedOperator = {
          id: `op-custom-${Date.now()}`,
          matricula: cleanIdentificador,
          nome: cleanIdentificador.length <= 4 ? `Operador ${cleanIdentificador}` : cleanIdentificador,
          email: `${cleanIdentificador}@pdv.local`,
          cargo: 'operador',
          avatarCor: '#2563EB',
        };
      }

      const session: SessionInfo = {
        operador: loggedOperator,
        caixa: terminal,
        fundoTrocoInicial: Number(fundoTroco) || 0,
        dataAbertura: new Date().toISOString(),
      };

      if (lembrarLogin) {
        try {
          localStorage.setItem('pdv_last_session', JSON.stringify(session));
        } catch {
          // LocalStorage desativado ou privado
        }
      }

      setIsLoading(false);
      onLoginSuccess(session);
    }, 400);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col justify-between select-none font-['Inter',sans-serif] text-slate-800">
      {/* Topo / Barra de Status */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-white shadow-sm">
            <ShoppingBag size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                PDV Inteligente
              </span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                v2.0
              </span>
            </div>
            <p className="text-[12px] text-slate-500">Acesso Seguro do Operador de Caixa</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          {/* Status Supabase */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px] font-medium ${
              supabaseStatus.connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <Database size={14} className={supabaseStatus.connected ? 'text-emerald-600' : 'text-slate-400'} />
            <span>Supabase: {supabaseStatus.connected ? 'Conectado' : 'Offline / Local'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
          </div>

          {/* Relógio e Data */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 text-slate-600">
            <span className="hidden md:flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </span>
            <span className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
              <Clock size={14} className="text-blue-600" />
              {currentTime.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal — Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Coluna Esquerda: Informações e Acesso Rápido (5 colunas) */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[12px] font-semibold mb-4 border border-blue-400/30">
                <ShieldCheck size={14} />
                Terminal Autorizado
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                Abertura de Caixa
              </h1>
              <p className="text-slate-300 text-[13px] leading-relaxed mb-6">
                Identifique-se para liberar o caixa, sincronizar produtos com o Supabase e iniciar o registro de vendas.
              </p>

              {/* Perfis Rápidos para Demonstração */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Operadores de Turno</span>
                  <span className="text-blue-400">Clique para preencher</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {MOCK_OPERATORS.map((op) => {
                    const isSelected = identificador === op.matricula;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => handleSelectQuickOperator(op)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 border-blue-500 text-white'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                            style={{ backgroundColor: op.avatarCor }}
                          >
                            {op.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold leading-tight">{op.nome}</p>
                            <p className="text-[11px] text-slate-400 capitalize">
                              {op.cargo} • Matrícula {op.matricula}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950/60 text-slate-300 border border-slate-700">
                          {op.senha}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dica de rodapé */}
            <div className="pt-6 mt-6 border-t border-slate-800 text-[12px] text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">Enter</kbd> para autenticar rapidamente.</span>
            </div>
          </div>

          {/* Coluna Direita: Formulário de Credenciais (7 colunas) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Credenciais de Acesso</h2>
                  <p className="text-[13px] text-slate-500">Informe seus dados para prosseguir</p>
                </div>

                {/* Alternador de Modo: Teclado vs PIN Touch */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[12px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setLoginMode('teclado')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      loginMode === 'teclado'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Teclado
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMode('pin')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      loginMode === 'pin'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound size={12} />
                    PIN Touch
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Campo 1: Matrícula / Operador */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Matrícula ou E-mail do Operador
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    ref={identificadorInputRef}
                    type="text"
                    value={identificador}
                    onChange={(e) => {
                      setIdentificador(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ex: 1001 ou carlos.silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Campo 2: Senha ou PIN */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {loginMode === 'pin' ? 'PIN Numérico (4 a 8 dígitos)' : 'Senha de Acesso'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    ref={senhaInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Digite sua senha..."
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium tracking-wide focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* MODO PIN TOUCHSCREEN (Teclado Virtual de PDV) */}
              {loginMode === 'pin' && (
                <div className="pt-2">
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePinInput(num)}
                        className="py-3 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handlePinClear}
                      className="py-3 bg-slate-200 hover:bg-slate-300 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 active:scale-95 transition-all cursor-pointer"
                    >
                      LIMPAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinInput('0')}
                      className="py-3 bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handlePinBackspace}
                      className="py-3 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded-xl text-xs font-bold text-rose-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Delete size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Configurações de Abertura: Caixa e Fundo de Troco */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Seleção do Caixa */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Terminal / Caixa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Monitor size={16} />
                    </div>
                    <select
                      value={terminal}
                      onChange={(e) => setTerminal(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 text-slate-900 text-[13px] font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    >
                      {AVAILABLE_TERMINALS.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fundo de Troco Inicial (Suprimento) */}
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fundo de Troco Inicial
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600 font-bold text-xs">
                      <DollarSign size={16} />
                    </div>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={fundoTroco}
                      onChange={(e) => setFundoTroco(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-[13px] font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Preenchimento Rápido de Fundo de Troco */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Valores sugeridos:</span>
                {[50, 100, 150, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFundoTroco(val)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all border cursor-pointer ${
                      fundoTroco === val
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>

              {/* Lembrar Operador */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lembrarLogin}
                    onChange={(e) => setLembrarLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span>Lembrar operador neste navegador</span>
                </label>
              </div>

              {/* Botão de Submissão Principal */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-base shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Abrir Caixa & Iniciar PDV</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Rodapé institucional */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[12px] text-slate-500">
        <div>
          <span>PDV Inteligente v2.0 • Sistema Comercial de Ponto de Venda</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Ambiente Homologado</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Terminal Online</span>
        </div>
      </footer>
    </div>
  );
};
