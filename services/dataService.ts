
import { supabase, isSupabaseConfigured } from './supabase';
import { Invoice, User, UserRole, Situacao, ImportErrorLog } from '../types';
import { generateId } from '../utils';

const LOCAL_STORAGE_KEYS = {
  INVOICES: 'govflow_local_invoices',
  USERS: 'govflow_local_users',
  ERROR_LOGS: 'govflow_local_error_logs',
};

const DEFAULT_ADMIN: User = {
  id: 'master-admin-001',
  name: 'Administrador do Sistema',
  email: 'admin@gov.br',
  password: 'admin123',
  role: UserRole.ADMIN,
  status: 'Ativo',
  lastLogin: 'Aguardando primeiro acesso'
};

const localDb = {
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  saveInvoices: (invoices: Invoice[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    const users = data ? JSON.parse(data) : [];
    if (users.length === 0 || !users.find((u: User) => u.email === DEFAULT_ADMIN.email)) {
      const newUsers = [DEFAULT_ADMIN, ...users.filter((u: User) => u.email !== DEFAULT_ADMIN.email)];
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      return newUsers;
    }
    return users;
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getErrorLogs: (): ImportErrorLog[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.ERROR_LOGS);
    return data ? JSON.parse(data) : [];
  },
  saveErrorLogs: (logs: ImportErrorLog[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ERROR_LOGS, JSON.stringify(logs));
  }
};

export const dataService = {
  async seedDatabase(): Promise<void> {
    localDb.getUsers();
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: adminExists, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', DEFAULT_ADMIN.email)
        .maybeSingle();
      if (!checkError && !adminExists) {
        await supabase.from('users').insert({
          id: DEFAULT_ADMIN.id,
          name: DEFAULT_ADMIN.name,
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          role: DEFAULT_ADMIN.role,
          status: DEFAULT_ADMIN.status,
          last_login: DEFAULT_ADMIN.lastLogin
        });
      }
    } catch (err) {}
  },

  async getInvoices(): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('invoices').select('*').order('vcto', { ascending: true });
        if (error) throw error;
        return (data || []).map(inv => ({ ...inv, history: typeof inv.history === 'string' ? JSON.parse(inv.history) : inv.history })) as Invoice[];
      } catch (err) { return localDb.getInvoices(); }
    }
    return localDb.getInvoices();
  },

  async saveInvoice(invoice: Invoice): Promise<void> {
    const currentLocal = localDb.getInvoices();
    const idx = currentLocal.findIndex(i => i.id === invoice.id);
    if (idx >= 0) currentLocal[idx] = invoice; else currentLocal.unshift(invoice);
    localDb.saveInvoices(currentLocal);
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = { ...invoice, history: JSON.stringify(invoice.history || []) };
        await supabase.from('invoices').upsert(payload);
      } catch (err) {}
    }
  },

  async deleteInvoice(id: string): Promise<void> {
    localDb.saveInvoices(localDb.getInvoices().filter(i => i.id !== id));
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('invoices').delete().eq('id', id); } catch (err) {}
    }
  },

  async getUsers(): Promise<User[]> {
    const localUsers = localDb.getUsers();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        const remoteUsers = (data || []).map(u => ({ ...u, lastLogin: u.last_login })) as User[];
        return remoteUsers.length > 0 ? remoteUsers : localUsers;
      } catch (err) { return localUsers; }
    }
    return localUsers;
  },

  async saveUser(user: User): Promise<void> {
    const currentLocal = localDb.getUsers();
    const idx = currentLocal.findIndex(u => u.id === user.id);
    if (idx >= 0) currentLocal[idx] = user; else currentLocal.push(user);
    localDb.saveUsers(currentLocal);
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUser = { id: user.id, name: user.name, email: user.email, password: user.password, role: user.role, status: user.status, last_login: user.lastLogin };
        await supabase.from('users').upsert(dbUser);
      } catch (err) {}
    }
  },

  async deleteUser(id: string): Promise<void> {
    localDb.saveUsers(localDb.getUsers().filter(u => u.id !== id));
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('users').delete().eq('id', id); } catch (err) {}
    }
  },

  // Novos métodos para Logs de Erro
  async getErrorLogs(): Promise<ImportErrorLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('import_errors').select('*').order('date', { ascending: false });
        if (error) throw error;
        return (data || []) as ImportErrorLog[];
      } catch (err) { return localDb.getErrorLogs(); }
    }
    return localDb.getErrorLogs();
  },

  async saveImportError(log: ImportErrorLog): Promise<void> {
    const current = localDb.getErrorLogs();
    current.unshift(log);
    localDb.saveErrorLogs(current.slice(0, 100)); // Mantém últimos 100 localmente

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('import_errors').insert(log);
      } catch (err) {}
    }
  },

  async clearErrorLogs(): Promise<void> {
    localDb.saveErrorLogs([]);
    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('import_errors').delete().neq('id', 'null'); } catch (err) {}
    }
  }
};
