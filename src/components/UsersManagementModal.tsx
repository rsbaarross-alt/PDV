import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Trash2,
  LogOut,
  Power,
  RefreshCw,
  Clock,
  Monitor,
  Lock,
  Mail,
  User,
  Key,
  Filter,
  Check,
} from 'lucide-react';
import { SystemUser, UserRole, UserStatus, SessionInfo } from '../types';
import {
  getSystemUsers,
  saveSystemUser,
  deleteSystemUser,
  toggleSystemUserStatus,
  disconnectUserSession,
  subscribeUsersChange,
  isAdminRole,
  canAccessUserManagement,
  canDeleteUser,
} from '../services/userService';

interface UsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: SessionInfo | null;
  onSessionTerminated?: () => void;
}

const AVATAR_PALETTE = [
  '#1D4ED8', // Azul PDV
  '#7C3AED', // Roxo
  '#059669', // Esmeralda
  '#D97706', // Âmbar
  '#DC2626', // Vermelho
  '#0284C7', // Ciano
  '#4F46E5', // Índigo
  '#0D9488', // Teal
];

export const UsersManagementModal: React.FC<UsersManagementModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onSessionTerminated,
}) => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'todos' | UserRole>('todos');
  const [activeTab, setActiveTab] = useState<'todos' | 'conectados' | 'ativos' | 'inativos'>('todos');

  // Modal de Edição / Criação
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  // Formulário de Criação/Edição
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMatricula, setFormMatricula] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [formCargo, setFormCargo] = useState<UserRole>('operador');
  const [formStatus, setFormStatus] = useState<UserStatus>('ativo');
  const [formAvatarCor, setFormAvatarCor] = useState('#1D4ED8');
  const [formError, setFormError] = useState<string | null>(null);

  // Confirmação de Exclusão
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Carrega lista de usuários e subscreve mudanças
  const refreshUsers = () => {
    setUsers(getSystemUsers());
  };

  useEffect(() => {
    if (isOpen) {
      refreshUsers();
      setActionNotice(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeUsersChange(() => {
      refreshUsers();
    });
    return () => unsubscribe();
  }, []);

  // Notificação temporária
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 3500);
  };

  // Filtragem e Métricas
  const metrics = useMemo(() => {
    const total = users.length;
    const conectados = users.filter((u) => u.estaConectado).length;
    const ativos = users.filter((u) => u.status === 'ativo').length;
    const inativos = users.filter((u) => u.status === 'inativo').length;
    return { total, conectados, ativos, inativos };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab === 'conectados' && !u.estaConectado) return false;
      if (activeTab === 'ativos' && u.status !== 'ativo') return false;
      if (activeTab === 'inativos' && u.status !== 'inativo') return false;

      // Role filter
      if (filterRole !== 'todos' && u.cargo !== filterRole) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = u.nome.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesMatricula = u.matricula.toLowerCase().includes(query);
        const matchesCargo = u.cargo.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesMatricula || matchesCargo;
      }

      return true;
    });
  }, [users, activeTab, filterRole, searchQuery]);

  const currentOperatorRole: UserRole = currentSession?.operador.cargo || 'operador';
  const isCurrentUserAdmin = currentOperatorRole === 'admin';
  const isCurrentUserGerenteOrAdmin = currentOperatorRole === 'admin' || currentOperatorRole === 'gerente';

  // Abertura do modal de criação
  const handleOpenCreateModal = () => {
    if (!isCurrentUserGerenteOrAdmin) {
      showNotice('Apenas Administradores e Gerentes podem cadastrar novos usuários.', 'error');
      return;
    }
    setEditingUser(null);
    setFormNome('');
    setFormEmail('');
    setFormMatricula((1000 + users.length + 1).toString());
    setFormSenha('');
    setFormCargo('operador');
    setFormStatus('ativo');
    setFormAvatarCor(AVATAR_PALETTE[users.length % AVATAR_PALETTE.length]);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Abertura do modal de edição
  const handleOpenEditModal = (user: SystemUser) => {
    if (!isCurrentUserGerenteOrAdmin) {
      showNotice('Apenas Administradores e Gerentes podem editar dados de usuários.', 'error');
      return;
    }
    // Apenas admin pode editar outro admin
    if (user.cargo === 'admin' && !isCurrentUserAdmin) {
      showNotice('Apenas o Administrador Geral pode editar contas administrativas.', 'error');
      return;
    }
    setEditingUser(user);
    setFormNome(user.nome);
    setFormEmail(user.email);
    setFormMatricula(user.matricula);
    setFormSenha(''); // Deixa vazio para manter a atual se não preenchido
    setFormCargo(user.cargo);
    setFormStatus(user.status);
    setFormAvatarCor(user.avatarCor || '#1D4ED8');
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submissão do formulário CRUD (Salvar Usuário)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isCurrentUserGerenteOrAdmin) {
      setFormError('Permissão negada. Apenas Administradores e Gerentes podem salvar alterações.');
      return;
    }

    // Se estiver tentando criar ou alterar para admin sem ser admin
    if (formCargo === 'admin' && !isCurrentUserAdmin) {
      setFormError('Apenas o Administrador Geral pode conceder perfil Administrador.');
      return;
    }

    const cleanNome = formNome.trim();
    const cleanEmail = formEmail.trim().toLowerCase();

    if (!cleanNome) {
      setFormError('Informe o nome do usuário.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Informe um e-mail válido.');
      return;
    }

    if (!editingUser && (!formSenha || formSenha.trim().length < 4)) {
      setFormError('A senha inicial deve ter no mínimo 4 caracteres.');
      return;
    }

    const res = saveSystemUser({
      id: editingUser ? editingUser.id : undefined,
      nome: cleanNome,
      email: cleanEmail,
      matricula: formMatricula.trim(),
      senha: formSenha.trim() || undefined,
      cargo: formCargo,
      status: formStatus,
      avatarCor: formAvatarCor,
    });

    if (!res.success) {
      setFormError(res.message || 'Erro ao salvar usuário.');
      return;
    }

    setIsEditModalOpen(false);
    showNotice(
      editingUser
        ? `Usuário "${cleanNome}" atualizado com sucesso!`
        : `Usuário "${cleanNome}" cadastrado com sucesso!`,
      'success'
    );
  };

  // Alternar Status: Manter Ativo ou Inativar
  const handleToggleStatus = (user: SystemUser) => {
    if (!isCurrentUserGerenteOrAdmin) {
      showNotice('Apenas Administradores e Gerentes podem ativar ou inativar usuários.', 'error');
      return;
    }

    if (user.cargo === 'admin' && !isCurrentUserAdmin) {
      showNotice('Apenas o Administrador Geral pode alterar o status de outro administrador.', 'error');
      return;
    }

    const newStatus: UserStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    toggleSystemUserStatus(user.id, newStatus);
    showNotice(
      newStatus === 'ativo'
        ? `Usuário "${user.nome}" agora está ATIVO e liberado no sistema.`
        : `Usuário "${user.nome}" foi DESATIVADO do sistema.`,
      newStatus === 'ativo' ? 'success' : 'error'
    );

    // Se inativou o próprio usuário logado
    if (
      newStatus === 'inativo' &&
      currentSession?.operador.email.toLowerCase() === user.email.toLowerCase()
    ) {
      if (onSessionTerminated) {
        onSessionTerminated();
      }
    }
  };

  // Desconectar Sessão Ativa
  const handleDisconnectSession = (user: SystemUser) => {
    if (!isCurrentUserGerenteOrAdmin) {
      showNotice('Apenas Administradores e Gerentes podem desconectar sessões ativas.', 'error');
      return;
    }

    disconnectUserSession(user.id);
    showNotice(`Sessão de "${user.nome}" desconectada com sucesso.`, 'success');

    // Se desconectou o próprio usuário atual
    if (currentSession?.operador.email.toLowerCase() === user.email.toLowerCase()) {
      if (onSessionTerminated) {
        onSessionTerminated();
      }
    }
  };

  // Excluir Usuário (CRUD - Delete)
  const handleConfirmDelete = () => {
    if (!deletingUser) return;

    if (!isCurrentUserAdmin) {
      showNotice('Acesso negado: Apenas o Administrador Geral pode remover usuários do sistema.', 'error');
      setDeletingUser(null);
      return;
    }

    if (!canDeleteUser(currentOperatorRole, deletingUser)) {
      showNotice('Não é permitido remover o único Administrador ativo do sistema.', 'error');
      setDeletingUser(null);
      return;
    }

    const res = deleteSystemUser(deletingUser.id);
    if (!res.success) {
      showNotice(res.message || 'Erro ao excluir usuário.', 'error');
      setDeletingUser(null);
      return;
    }

    const deletedName = deletingUser.nome;
    const isCurrent =
      currentSession?.operador.email.toLowerCase() === deletingUser.email.toLowerCase();

    setDeletingUser(null);
    showNotice(`Usuário "${deletedName}" foi removido do sistema.`, 'success');

    if (isCurrent && onSessionTerminated) {
      onSessionTerminated();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in font-['Inter',sans-serif]">
      <div className="bg-white w-full max-w-5xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* TOPO: Cabeçalho com Título, Indicadores e Fechar */}
        <div className="p-5 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1D4ED8] flex items-center justify-center text-white shadow-xs">
              <Users size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Gestão de Usuários & Sessões
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Painel de Controle
                </span>
              </div>
              <p className="text-[12px] text-slate-500">
                Gerencie permissões, controle conexões ativas e mantenha o acesso dos operadores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Novo Usuário</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NOTIFICAÇÃO RÁPIDA DE AÇÃO */}
        {actionNotice && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b animate-slide-down ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
        )}

        {/* CARDS DE MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 bg-white border-b border-slate-100">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total de Usuários
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
              <span className="text-[11px] text-slate-500">cadastrados</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Conectados Agora
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-800">{metrics.conectados}</span>
              <span className="text-[11px] text-emerald-600">em terminais</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Usuários Ativos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-900">{metrics.ativos}</span>
              <span className="text-[11px] text-blue-600">autorizados</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Inativos / Bloqueados
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-700">{metrics.inativos}</span>
              <span className="text-[11px] text-slate-500">sem acesso</span>
            </div>
          </div>
        </div>

        {/* BARRA DE CONTROLE: ABAS, BUSCA E FILTROS */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Abas */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'todos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {metrics.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('conectados')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'conectados'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Conectados</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {metrics.conectados}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ativos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ativos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ativos ({metrics.ativos})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inativos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'inativos'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inativos ({metrics.inativos})
            </button>
          </div>

          {/* Busca e Filtro de Cargo */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, e-mail..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none bg-slate-50 hover:bg-white transition-all"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-medium focus:ring-2 focus:ring-[#1D4ED8] outline-none cursor-pointer"
            >
              <option value="todos">Todos os Cargos</option>
              <option value="admin">Administrador (Total)</option>
              <option value="gerente">Gerentes</option>
              <option value="supervisor">Supervisores</option>
              <option value="operador">Operadores</option>
            </select>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="sm:hidden flex items-center justify-center p-2 rounded-xl bg-[#1D4ED8] text-white"
              title="Novo Usuário"
            >
              <UserPlus size={16} />
            </button>
          </div>
        </div>

        {/* LISTA DE USUÁRIOS (TABELA COM CRUD E CONTROLE DE CONEXÃO) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <Users size={36} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Nenhum usuário encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Tente ajustar os termos da busca ou os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((user) => {
                const isCurrentLoggedIn =
                  currentSession?.operador.email.toLowerCase() === user.email.toLowerCase();

                return (
                  <div
                    key={user.id}
                    className={`bg-white rounded-xl border p-3.5 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 ${
                      user.estaConectado ? 'border-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    {/* Informações Principais do Usuário */}
                    <div className="flex items-center gap-3.5 min-w-[260px]">
                      <div className="relative">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs"
                          style={{ backgroundColor: user.avatarCor || '#1D4ED8' }}
                        >
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        {user.estaConectado && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs"
                            title="Conectado no sistema"
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {user.nome}
                          </h4>
                          {isCurrentLoggedIn && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              Você (Sessão Atual)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-mono text-slate-600">Matrícula: {user.matricula}</span>
                          <span>•</span>
                          <span className="text-slate-600">{user.email}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] capitalize border ${
                              user.cargo === 'admin'
                                ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                                : user.cargo === 'gerente'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold'
                                : user.cargo === 'supervisor'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                                : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                            }`}
                          >
                            {user.cargo === 'admin' ? 'Administrador (Total)' : user.cargo}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Cadastrado em: {new Date(user.criadoEm).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status de Conexão & Terminal */}
                    <div className="flex flex-col justify-center text-xs min-w-[180px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 mb-1">
                        {user.estaConectado ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Conectado Agora
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                            <span className="w-2 h-2 rounded-full bg-slate-300" />
                            Desconectado
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Monitor size={12} className="text-slate-400" />
                        <span>{user.terminalConectado || 'Sem terminal ativo'}</span>
                      </div>

                      {user.ultimoAcesso && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          <span>Último acesso: {new Date(user.ultimoAcesso).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Controles de Ação (Manter Ativo / Inativar, Desconectar, Editar, Remover) */}
                    <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
                      
                      {/* Botão de Manter Ativo / Desativar */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          user.status === 'ativo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                        title={user.status === 'ativo' ? 'Clique para inativar acesso' : 'Clique para reativar acesso'}
                      >
                        {user.status === 'ativo' ? (
                          <>
                            <ShieldCheck size={14} className="text-emerald-600" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} className="text-rose-600" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>

                      {/* Botão de Desconectar (se estiver conectado) */}
                      {user.estaConectado && (
                        <button
                          type="button"
                          onClick={() => handleDisconnectSession(user)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1.5"
                          title="Encerrar conexão deste operador"
                        >
                          <LogOut size={13} />
                          <span>Desconectar</span>
                        </button>
                      )}

                      {/* Botão Editar (CRUD - Update) */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 rounded-xl text-slate-600 hover:text-[#1D4ED8] hover:bg-blue-50 border border-slate-200 transition-all cursor-pointer"
                        title="Editar dados e senha"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Botão Remover (CRUD - Delete) */}
                      <button
                        type="button"
                        onClick={() => setDeletingUser(user)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                        title="Remover do sistema"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RODAPÉ INFORMATIVO */}
        <div className="p-4 sm:px-6 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Total de {users.length} usuários cadastrados</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE USUÁRIO (CRUD)                               */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] text-white flex items-center justify-center">
                  {editingUser ? <Edit2 size={16} /> : <UserPlus size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingUser ? 'Atualize as permissões ou senha' : 'Defina os dados de login e cargo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                    required
                  />
                </div>
              </div>

              {/* E-mail e Matrícula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail de Acesso *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={formMatricula}
                    onChange={(e) => setFormMatricula(e.target.value)}
                    placeholder="Ex: 1005"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
              </div>

              {/* Cargo e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cargo / Função
                  </label>
                  <select
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer"
                  >
                    <option value="admin">Administrador (Acesso Total)</option>
                    <option value="gerente">Gerente Geral</option>
                    <option value="supervisor">Supervisor de Loja</option>
                    <option value="operador">Operador de Caixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status no Sistema
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white cursor-pointer"
                  >
                    <option value="ativo">Ativo (Acesso Liberado)</option>
                    <option value="inativo">Inativo (Acesso Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha Inicial *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={formSenha}
                    onChange={(e) => setFormSenha(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Mínimo 4 dígitos'}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-[#1D4ED8] outline-none"
                  />
                </div>
              </div>

              {/* Cor do Avatar */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cor de Identificação
                </label>
                <div className="flex items-center gap-2">
                  {AVATAR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormAvatarCor(color)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        formAvatarCor === color ? 'scale-115 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formAvatarCor === color && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO (DELETE)                                  */}
      {/* ========================================================================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Remover Usuário?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Tem certeza que deseja remover <strong className="text-slate-900">{deletingUser.nome}</strong>{' '}
                do sistema? Esta ação revogará todo o histórico de acessos deste operador.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
