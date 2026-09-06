import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  KeyRound,
  User,
} from 'lucide-react';
import { Operator, SessionInfo } from '../types';
import { SupabaseStatus } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (session: SessionInfo) => void;
  supabaseStatus: SupabaseStatus;
  initialTerminal?: string;
}

type AuthView = 'login' | 'register' | 'recovery';

interface StoredUser {
  nome: string;
  email: string;
  senha: string;
  cargo: 'operador' | 'supervisor' | 'gerente';
}

const DEFAULT_USERS: StoredUser[] = [
  {
    nome: 'Carlos Silva',
    email: 'carlos.silva@supermercado.com',
    senha: '1234',
    cargo: 'operador',
  },
  {
    nome: 'Mariana Costa',
    email: 'admin@supermercado.com',
    senha: 'admin',
    cargo: 'gerente',
  },
  {
    nome: 'Operador Caixa',
    email: 'operador@pdv.com',
    senha: '1234',
    cargo: 'operador',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  supabaseStatus,
  initialTerminal = 'Caixa 04',
}) => {
  const [view, setView] = useState<AuthView>('login');

  // Campos de Login
  const [email, setEmail] = useState<string>('carlos.silva@supermercado.com');
  const [senha, setSenha] = useState<string>('1234');
  const [lembrarMe, setLembrarMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Campos de Cadastro de Senha / Conta
  const [regNome, setRegNome] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regSenha, setRegSenha] = useState<string>('');
  const [regConfirmSenha, setRegConfirmSenha] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Campos de Recuperação de Senha
  const [recEmail, setRecEmail] = useState<string>('');
  const [recSuccess, setRecSuccess] = useState<boolean>(false);

  // Estados de feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const regNomeInputRef = useRef<HTMLInputElement>(null);
  const recEmailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'login') {
      emailInputRef.current?.focus();
    } else if (view === 'register') {
      regNomeInputRef.current?.focus();
    } else if (view === 'recovery') {
      recEmailInputRef.current?.focus();
    }
    setErrorMsg(null);
  }, [view]);

  // Carrega lista de usuários locais (ou default)
  const getUsers = (): StoredUser[] => {
    try {
      const stored = localStorage.getItem('pdv_registered_users');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignora erro
    }
    return DEFAULT_USERS;
  };

  const saveUsers = (users: StoredUser[]) => {
    try {
      localStorage.setItem('pdv_registered_users', JSON.stringify(users));
    } catch {
      // Ignora erro
    }
  };

  // 1. SUBMIT: LOGIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!cleanEmail) {
      setErrorMsg('Por favor, informe seu e-mail.');
      return;
    }

    if (!cleanSenha) {
      setErrorMsg('Por favor, digite sua senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (user) {
        if (user.senha !== cleanSenha) {
          setIsLoading(false);
          setErrorMsg('Senha incorreta para o e-mail informado.');
          return;
        }

        const operator: Operator = {
          id: `op-${Date.now()}`,
          matricula: '1001',
          nome: user.nome,
          email: user.email,
          cargo: user.cargo,
          avatarCor: '#1D4ED8',
        };

        const session: SessionInfo = {
          operador: operator,
          caixa: initialTerminal,
          fundoTrocoInicial: 100,
          dataAbertura: new Date().toISOString(),
        };

        if (lembrarMe) {
          try {
            localStorage.setItem('pdv_last_session', JSON.stringify(session));
          } catch {
            // Ignora erro
          }
        }

        setIsLoading(false);
        onLoginSuccess(session);
      } else {
        // Se o usuário ainda não existir no cadastro local, cria uma sessão amigável
        const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = nameFromEmail
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const operator: Operator = {
          id: `op-${Date.now()}`,
          matricula: '1001',
          nome: formattedName || 'Operador',
          email: cleanEmail,
          cargo: 'operador',
          avatarCor: '#1D4ED8',
        };

        const session: SessionInfo = {
          operador: operator,
          caixa: initialTerminal,
          fundoTrocoInicial: 100,
          dataAbertura: new Date().toISOString(),
        };

        if (lembrarMe) {
          try {
            localStorage.setItem('pdv_last_session', JSON.stringify(session));
          } catch {
            // Ignora erro
          }
        }

        setIsLoading(false);
        onLoginSuccess(session);
      }
    }, 450);
  };

  // 2. SUBMIT: CADASTRO DE SENHA / CONTA
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNome = regNome.trim();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanSenha = regSenha.trim();
    const cleanConfirm = regConfirmSenha.trim();

    if (!cleanNome) {
      setErrorMsg('Informe seu nome completo.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (!cleanSenha || cleanSenha.length < 4) {
      setErrorMsg('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (cleanSenha !== cleanConfirm) {
      setErrorMsg('As senhas não coincidem. Digite novamente.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        // Atualiza a senha se já existir
        existing.senha = cleanSenha;
        existing.nome = cleanNome;
        saveUsers(users);
      } else {
        users.push({
          nome: cleanNome,
          email: cleanEmail,
          senha: cleanSenha,
          cargo: 'operador',
        });
        saveUsers(users);
      }

      setIsLoading(false);
      setEmail(cleanEmail);
      setSenha(cleanSenha);
      setSuccessMsg('Senha e conta cadastradas com sucesso! Faça login com seus dados.');
      setView('login');
    }, 500);
  };

  // 3. SUBMIT: RECUPERAÇÃO DE SENHA
  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = recEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Informe um e-mail válido para recuperação.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setRecSuccess(true);
    }, 600);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col justify-between select-none font-['Inter',sans-serif] text-slate-800">
      {/* Topo Limpo com Logo e Status */}
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
            <p className="text-[12px] text-slate-500">Ponto de Venda de Alta Performance</p>
          </div>
        </div>

        {/* Indicador discreto de status */}
        <div className="flex items-center gap-2 text-[12px] font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span
            className={`w-2 h-2 rounded-full ${
              supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span>{supabaseStatus.connected ? 'Supabase Online' : 'Modo Seguro Local'}</span>
        </div>
      </header>

      {/* Área Central — Card de Autenticação */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all">
          
          {/* Cabeçalho do Card com Cores do Sistema */}
          <div className="bg-[#1D4ED8] text-white p-6 sm:p-8 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 text-white shadow-inner">
              {view === 'login' && <LogIn size={24} />}
              {view === 'register' && <UserPlus size={24} />}
              {view === 'recovery' && <KeyRound size={24} />}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              {view === 'login' && 'Entrar no Sistema'}
              {view === 'register' && 'Cadastrar Nova Senha'}
              {view === 'recovery' && 'Recuperar Acesso'}
            </h1>

            <p className="text-blue-100 text-[13px]">
              {view === 'login' && 'Digite seu e-mail e senha para acessar o PDV'}
              {view === 'register' && 'Crie suas credenciais para acesso de operador'}
              {view === 'recovery' && 'Redefina sua senha através do seu e-mail'}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Alertas de Erro ou Sucesso */}
            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[13px] flex items-center gap-2.5">
                <AlertCircle size={17} className="text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex items-center gap-2.5">
                <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW 1: TELA DE LOGIN                                    */}
            {/* ========================================================= */}
            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecEmail(email);
                        setRecSuccess(false);
                        setView('recovery');
                      }}
                      className="text-[12px] font-semibold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium tracking-wide focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lembrarMe}
                      onChange={(e) => setLembrarMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-[#1D4ED8] border-slate-300 cursor-pointer"
                    />
                    <span>Manter conectado</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-3"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Entrar</span>
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-[13px] text-slate-600">
                    Ainda não possui senha cadastrada?{' '}
                    <button
                      type="button"
                      onClick={() => setView('register')}
                      className="font-bold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer"
                    >
                      Cadastrar Senha
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW 2: CADASTRO DE SENHA / NOVA CONTA                    */}
            {/* ========================================================= */}
            {view === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input
                      ref={regNomeInputRef}
                      type="text"
                      value={regNome}
                      onChange={(e) => setRegNome(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regSenha}
                      onChange={(e) => setRegSenha(e.target.value)}
                      placeholder="Mínimo 4 dígitos..."
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium tracking-wide focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmSenha}
                      onChange={(e) => setRegConfirmSenha(e.target.value)}
                      placeholder="Confirme sua senha..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium tracking-wide focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-3"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Cadastrar Senha</span>
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-[13px] text-slate-600">
                    Já possui acesso?{' '}
                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="font-bold text-[#1D4ED8] hover:text-[#1E40AF] hover:underline cursor-pointer"
                    >
                      Fazer Login
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* VIEW 3: RECUPERAÇÃO DE SENHA                              */}
            {/* ========================================================= */}
            {view === 'recovery' && (
              <div className="space-y-4">
                {recSuccess ? (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={26} />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">E-mail de Recuperação Enviado!</h2>
                    <p className="text-[13px] text-slate-600 leading-relaxed max-w-sm mx-auto">
                      Enviamos as instruções de redefinição de senha para o e-mail{' '}
                      <strong className="text-slate-900">{recEmail}</strong>. Verifique sua caixa de entrada e spam.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecSuccess(false);
                        setView('login');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-4"
                    >
                      Voltar para o Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRecovery} className="space-y-4">
                    <p className="text-[13px] text-slate-600">
                      Informe seu e-mail cadastrado e enviaremos um link para você redefinir sua senha com segurança.
                    </p>

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input
                          ref={recEmailInputRef}
                          type="email"
                          value={recEmail}
                          onChange={(e) => setRecEmail(e.target.value)}
                          placeholder="seu.email@empresa.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none transition-all placeholder:text-slate-400 bg-slate-50/50 hover:bg-white"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-3"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound size={18} />
                          <span>Enviar Link de Recuperação</span>
                        </>
                      )}
                    </button>

                    <div className="pt-4 border-t border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => setView('login')}
                        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                        <span>Voltar para o Login</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[12px] text-slate-500">
        <div>
          <span>PDV Inteligente v2.0 • Acesso de Operador</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Ambiente Seguro</span>
        </div>
      </footer>
    </div>
  );
};
