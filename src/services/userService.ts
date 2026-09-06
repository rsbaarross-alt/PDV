import { SystemUser, UserRole, UserStatus } from '../types';

const STORAGE_KEY = 'pdv_system_users_v2';
const LEGACY_STORAGE_KEY = 'pdv_registered_users';

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
    cargo: 'gerente',
    status: 'ativo',
    avatarCor: '#7C3AED',
    criadoEm: '2026-01-10T09:30:00.000Z',
    ultimoAcesso: '2026-09-06T15:20:00.000Z',
    estaConectado: false,
    terminalConectado: undefined,
    ipOuDispositivo: 'Gerência Web (Firefox / Windows)',
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
 * Obtém todos os usuários do sistema
 */
export const getSystemUsers = (): SystemUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
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
