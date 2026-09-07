import { SystemUser, UserRole, UserStatus, RolePermissions } from '../types';

const STORAGE_KEY = 'pdv_system_users_v2';
const LEGACY_STORAGE_KEY = 'pdv_registered_users';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessAdmin: true,
    canManageUsers: true,
    canDeleteUsers: true,
    canManageProducts: true,
    canAuthorizeDiscounts: true,
    canCancelSales: true,
    canOperatePDV: true,
    canViewReports: true,
  },
  gerente: {
    canAccessAdmin: true,
    canManageUsers: true,
    canDeleteUsers: false,
    canManageProducts: true,
    canAuthorizeDiscounts: true,
    canCancelSales: true,
    canOperatePDV: true,
    canViewReports: true,
  },
  supervisor: {
    canAccessAdmin: false,
    canManageUsers: false,
    canDeleteUsers: false,
    canManageProducts: false,
    canAuthorizeDiscounts: true,
    canCancelSales: true,
    canOperatePDV: true,
    canViewReports: false,
  },
  operador: {
    canAccessAdmin: false,
    canManageUsers: false,
    canDeleteUsers: false,
    canManageProducts: false,
    canAuthorizeDiscounts: false,
    canCancelSales: false,
    canOperatePDV: true,
    canViewReports: false,
  },
};

const INITIAL_USERS: SystemUser[] = [
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
    ipOuDispositivo: 'Terminal 04 (Chrome / Linux)',
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
    ultimoAcesso: '2026-09-06T15:20:00.000Z',
    estaConectado: false,
    terminalConectado: undefined,
    ipOuDispositivo: 'Painel Admin Web (Chrome / Linux)',
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
    ultimoAcesso: '2026-09-06T16:10:00.000Z',
    estaConectado: true,
    terminalConectado: 'Caixa 01',
    ipOuDispositivo: 'Terminal 01 (Chrome / Linux)',
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
    ultimoAcesso: '2026-09-05T19:40:00.000Z',
    estaConectado: false,
    terminalConectado: undefined,
    ipOuDispositivo: 'Terminal Supervisor',
  },
];

const AVATAR_COLORS = [
  '#1D4ED8', // Azul PDV
  '#7C3AED', // Roxo
  '#059669', // Esmeralda
  '#D97706', // Âmbar
  '#DC2626', // Vermelho
  '#0284C7', // Ciano
  '#4F46E5', // Índigo
  '#0D9488', // Teal
];

// Gerenciamento de eventos para re-render reativo
type UsersChangeListener = () => void;
const listeners: Set<UsersChangeListener> = new Set();

export const subscribeUsersChange = (listener: UsersChangeListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyChange = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignora erro de listener
    }
  });
};

/**
 * Consulta o backend para sincronizar usuários do Supabase
 */
export const fetchRemoteUsers = async (): Promise<{
  source: 'supabase' | 'server_memory' | 'local';
  users: SystemUser[];
  supabaseTableMissing?: boolean;
  message?: string;
  sqlScript?: string;
}> => {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users) && data.users.length > 0) {
        const local = getSystemUsers();
        // Mescla com usuários locais preservando senhas
        const remoteList: SystemUser[] = data.users.map((ru: any) => ({
          id: String(ru.id),
          matricula: String(ru.matricula || ''),
          nome: String(ru.nome || ''),
          email: String(ru.email || '').toLowerCase().trim(),
          cargo: ru.cargo || 'operador',
          status: ru.status || 'ativo',
          avatarCor: ru.avatarCor || ru.avatar_cor || '#1D4ED8',
          criadoEm: ru.criadoEm || ru.created_at || new Date().toISOString(),
          ultimoAcesso: ru.ultimoAcesso || ru.ultimo_acesso || undefined,
          estaConectado: Boolean(ru.estaConectado ?? ru.esta_conectado ?? false),
          terminalConectado: ru.terminalConectado || ru.terminal_conectado || undefined,
        }));

        const merged = remoteList.map((ru) => {
          const matched = local.find((l) => l.email.toLowerCase() === ru.email.toLowerCase());
          return {
            ...ru,
            senha: matched?.senha || ru.senha || '1234',
          };
        });

        // Adiciona algum criado offline
        local.forEach((l) => {
          if (!merged.some((m) => m.email.toLowerCase() === l.email.toLowerCase())) {
            merged.push(l);
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        notifyChange();

        return {
          source: data.source || 'server_memory',
          users: merged,
          supabaseTableMissing: Boolean(data.supabaseTableMissing),
          message: data.message,
          sqlScript: data.sqlScript,
        };
      } else if (data.supabaseTableMissing) {
        return {
          source: 'server_memory',
          users: getSystemUsers(),
          supabaseTableMissing: true,
          message: data.message,
          sqlScript: data.sqlScript,
        };
      }
    }
  } catch {
    // Falha silenciosa de rede, mantém offline
  }

  return {
    source: 'local',
    users: getSystemUsers(),
    supabaseTableMissing: false,
  };
};

/**
 * Verifica o status do Schema no Supabase
 */
export const checkSupabaseUsersSchema = async () => {
  try {
    const res = await fetch('/api/supabase/schema-status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Ignora
  }
  return {
    configured: false,
    connected: false,
    usersTableMissing: true,
  };
};

/**
 * Envia todos os usuários locais para persistência no Supabase
 */
export const syncAllUsersToSupabase = async () => {
  const users = getSystemUsers();
  try {
    const res = await fetch('/api/users/sync-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
      },
      body: JSON.stringify({ users }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha na requisição' };
  }
};

/**
 * Dispara persistência assíncrona no backend / Supabase
 */
const syncUserToBackend = async (
  userData: {
    id?: string;
    matricula?: string;
    nome: string;
    email: string;
    senha?: string;
    cargo: UserRole;
    status: UserStatus;
    avatarCor?: string;
  },
  isUpdate: boolean
) => {
  try {
    const endpoint = isUpdate && userData.id ? `/api/users/${userData.id}` : '/api/users';
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin',
      },
      body: JSON.stringify(userData),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user && data.user.id) {
        const currentUsers = getSystemUsers();
        const target = currentUsers.find(
          (u) => u.email.toLowerCase() === userData.email.toLowerCase()
        );
        if (target && target.id !== data.user.id) {
          target.id = data.user.id;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUsers));
          notifyChange();
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('Falha ao sincronizar usuário com o backend:', err);
  }
  return null;
};

/**
 * Obtém todos os usuários do sistema
 */
export const getSystemUsers = (): SystemUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: SystemUser[] = JSON.parse(raw);
      // Garante que o administrador padrão exista com role admin
      if (Array.isArray(parsed) && !parsed.some((u) => u.cargo === 'admin')) {
        const adminUser = parsed.find((u) => u.email.toLowerCase() === 'admin@supermercado.com');
        if (adminUser) {
          adminUser.cargo = 'admin';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      return parsed;
    }

    // Tenta migrar da chave legada se existir
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyList = JSON.parse(legacyRaw);
      if (Array.isArray(legacyList) && legacyList.length > 0) {
        const migrated: SystemUser[] = legacyList.map((item: any, idx: number) => ({
          id: `user-migrated-${idx + 1}`,
          matricula: (1005 + idx).toString(),
          nome: item.nome || 'Usuário',
          email: item.email || '',
          senha: item.senha || '1234',
          cargo: item.cargo || 'operador',
          status: 'ativo',
          avatarCor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          criadoEm: new Date().toISOString(),
          ultimoAcesso: new Date().toISOString(),
          estaConectado: false,
        }));

        // Adiciona os padrões caso não estejam presentes
        const merged = [...INITIAL_USERS];
        migrated.forEach((m) => {
          if (!merged.some((u) => u.email.toLowerCase() === m.email.toLowerCase())) {
            merged.push(m);
          }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }

    // Inicializa com padrões
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
};

/**
 * Salva a lista de usuários no armazenamento local
 */
export const setSystemUsers = (users: SystemUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    notifyChange();
  } catch {
    // LocalStorage indisponível
  }
};

/**
 * Cadastra ou atualiza um usuário (CRUD - Create/Update)
 */
export const saveSystemUser = (
  userData: {
    id?: string;
    matricula?: string;
    nome: string;
    email: string;
    senha?: string;
    cargo: UserRole;
    status: UserStatus;
    avatarCor?: string;
  }
): { success: boolean; message?: string; user?: SystemUser } => {
  const users = getSystemUsers();
  const cleanEmail = userData.email.trim().toLowerCase();

  // Verifica duplicação de e-mail em outro usuário
  const duplicate = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.id !== userData.id
  );

  if (duplicate) {
    return {
      success: false,
      message: 'Já existe um usuário cadastrado com este e-mail.',
    };
  }

  if (userData.id) {
    // ATUALIZAÇÃO (UPDATE)
    const index = users.findIndex((u) => u.id === userData.id);
    if (index === -1) {
      return { success: false, message: 'Usuário não encontrado para edição.' };
    }

    const current = users[index];
    const updated: SystemUser = {
      ...current,
      nome: userData.nome.trim(),
      email: cleanEmail,
      matricula: userData.matricula?.trim() || current.matricula,
      cargo: userData.cargo,
      status: userData.status,
      avatarCor: userData.avatarCor || current.avatarCor,
      senha: userData.senha && userData.senha.trim() ? userData.senha.trim() : current.senha,
    };

    // Se foi inativado, desconecta automaticamente
    if (userData.status === 'inativo' && updated.estaConectado) {
      updated.estaConectado = false;
      updated.terminalConectado = undefined;
    }

    users[index] = updated;
    setSystemUsers(users);
    syncUserToBackend({ ...userData, id: updated.id }, true);
    return { success: true, user: updated };
  } else {
    // CRIAÇÃO (CREATE)
    const newId = `user-${Date.now()}`;
    const nextMatricula = (1000 + users.length + 1).toString();
    const chosenColor =
      userData.avatarCor || AVATAR_COLORS[users.length % AVATAR_COLORS.length];

    const newUser: SystemUser = {
      id: newId,
      matricula: userData.matricula?.trim() || nextMatricula,
      nome: userData.nome.trim(),
      email: cleanEmail,
      senha: userData.senha?.trim() || '1234',
      cargo: userData.cargo || 'operador',
      status: userData.status || 'ativo',
      avatarCor: chosenColor,
      criadoEm: new Date().toISOString(),
      ultimoAcesso: undefined,
      estaConectado: false,
    };

    users.unshift(newUser);
    setSystemUsers(users);
    syncUserToBackend({ ...userData, matricula: newUser.matricula, avatarCor: chosenColor }, false);
    return { success: true, user: newUser };
  }
};

/**
 * Remove um usuário do sistema (CRUD - Delete)
 */
export const deleteSystemUser = (id: string): { success: boolean; message?: string } => {
  const users = getSystemUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return { success: false, message: 'Usuário não encontrado.' };
  }

  // Não permite excluir se for o único usuário ativo
  if (users.length <= 1) {
    return {
      success: false,
      message: 'Não é permitido excluir o único usuário do sistema.',
    };
  }

  users.splice(index, 1);
  setSystemUsers(users);

  fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-role': 'admin' },
  }).catch(() => {});

  return { success: true };
};

/**
 * Altera status do usuário entre 'ativo' e 'inativo'
 */
export const toggleSystemUserStatus = (
  id: string,
  newStatus?: UserStatus
): { success: boolean; user?: SystemUser } => {
  const users = getSystemUsers();
  const user = users.find((u) => u.id === id);

  if (!user) {
    return { success: false };
  }

  const targetStatus: UserStatus =
    newStatus !== undefined
      ? newStatus
      : user.status === 'ativo'
      ? 'inativo'
      : 'ativo';

  user.status = targetStatus;

  // Se inativado, desconecta
  if (targetStatus === 'inativo') {
    user.estaConectado = false;
    user.terminalConectado = undefined;
  }

  setSystemUsers(users);

  fetch(`/api/users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    body: JSON.stringify({ status: targetStatus }),
  }).catch(() => {});

  return { success: true, user };
};

/**
 * Desconecta a sessão ativa de um usuário
 */
export const disconnectUserSession = (id: string): boolean => {
  const users = getSystemUsers();
  const user = users.find((u) => u.id === id);

  if (!user) return false;

  user.estaConectado = false;
  user.terminalConectado = undefined;
  setSystemUsers(users);

  fetch(`/api/users/${id}/connect`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estaConectado: false, terminalConectado: null }),
  }).catch(() => {});

  return true;
};

/**
 * Conecta e ativa a sessão de um usuário ao fazer login
 */
export const registerUserLogin = (
  emailOrMatricula: string,
  terminal: string
): { success: boolean; user?: SystemUser; message?: string } => {
  const users = getSystemUsers();
  const term = emailOrMatricula.trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === term || u.matricula.toLowerCase() === term
  );

  if (!user) {
    return { success: false, message: 'Usuário não encontrado.' };
  }

  if (user.status === 'inativo') {
    return {
      success: false,
      message: 'Usuário desativado pelo administrador. Acesso bloqueado.',
    };
  }

  user.estaConectado = true;
  user.terminalConectado = terminal || 'Caixa 04';
  user.ultimoAcesso = new Date().toISOString();
  user.ipOuDispositivo = `${terminal} (Navegador Ativo)`;

  setSystemUsers(users);

  fetch(`/api/users/${user.id}/connect`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estaConectado: true, terminalConectado: terminal }),
  }).catch(() => {});

  return { success: true, user };
};

/**
 * Desconecta ao fazer logout
 */
export const registerUserLogout = (userIdOrEmail: string): void => {
  const users = getSystemUsers();
  const term = userIdOrEmail.trim().toLowerCase();

  const user = users.find(
    (u) => u.id === userIdOrEmail || u.email.toLowerCase() === term
  );

  if (user) {
    user.estaConectado = false;
    user.terminalConectado = undefined;
    setSystemUsers(users);

    fetch(`/api/users/${user.id}/connect`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estaConectado: false, terminalConectado: null }),
    }).catch(() => {});
  }
};

/**
 * Retorna contadores gerais (total, conectados, ativos)
 */
export const getUserMetrics = () => {
  const users = getSystemUsers();
  const total = users.length;
  const conectados = users.filter((u) => u.estaConectado).length;
  const ativos = users.filter((u) => u.status === 'ativo').length;
  const inativos = users.filter((u) => u.status === 'inativo').length;

  return { total, conectados, ativos, inativos };
};

/**
 * Retorna todos os usuários com status 'ativo' no sistema
 */
export const getActiveUsers = (): SystemUser[] => {
  return getSystemUsers().filter((u) => u.status === 'ativo');
};

/**
 * Retorna todos os usuários atualmente conectados
 */
export const getConnectedUsers = (): SystemUser[] => {
  return getSystemUsers().filter((u) => u.estaConectado);
};

/**
 * Verifica se a role possui privilégio de Administrador Total
 */
export const isAdminRole = (role?: UserRole): boolean => {
  return role === 'admin';
};

/**
 * Verifica se o usuário tem permissão para acessar o painel de usuários
 */
export const canAccessUserManagement = (role?: UserRole): boolean => {
  return role === 'admin' || role === 'gerente';
};

/**
 * Verifica se o usuário autenticado tem permissão para deletar outro usuário
 */
export const canDeleteUser = (actorRole?: UserRole, targetUser?: SystemUser): boolean => {
  if (actorRole !== 'admin') return false;
  if (!targetUser) return true;
  // Não permitir auto-exclusão do único admin
  const allAdmins = getSystemUsers().filter((u) => u.cargo === 'admin' && u.status === 'ativo');
  if (targetUser.cargo === 'admin' && allAdmins.length <= 1) {
    return false;
  }
  return true;
};

