
import { getSupabaseClient } from './supabase';
import { Invoice, User, UserRole, Situacao, ImportErrorLog, SystemSetting, Supplier } from '../types';
import { generateId } from '../utils';

const LOCAL_STORAGE_KEYS = {
  INVOICES: 'govflow_local_invoices',
  USERS: 'govflow_local_users',
  SUPPLIERS: 'govflow_local_suppliers',
  ERROR_LOGS: 'govflow_local_error_logs',
  SETTINGS: 'govflow_local_settings',
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

const DEFAULT_SETTINGS: SystemSetting[] = [
  { key: 'system_name', value: 'GovFlow Pro' },
  { key: 'system_slogan', value: 'Portal de Gestão de Finanças Públicas' },
  { key: 'favicon_url', value: '' },
  { key: 'footer_text', value: 'Sistema restrito para servidores autorizados.' },
  { key: 'supabase_url', value: 'https://qiafgsigctmizdrgrdls.supabase.co' },
  { key: 'supabase_key', value: 'sb_publishable_PUkC5A7ZPTKRhqRQsPEddA_1UQ26Jt8' }
];

const localDb = {
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  saveInvoices: (invoices: Invoice[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },
  getSuppliers: (): Supplier[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.SUPPLIERS);
    return data ? JSON.parse(data) : [];
  },
  saveSuppliers: (suppliers: Supplier[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
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
  },
  getSettings: (): SystemSetting[] => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  },
  saveSettings: (settings: SystemSetting[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
};

export const dataService = {
  async seedDatabase(): Promise<void> {
    localDb.getUsers();
    const sb = getSupabaseClient();
    if (!sb) return;
    try {
      const { data: adminExists, error } = await sb.from('users').select('id').eq('email', DEFAULT_ADMIN.email).maybeSingle();
      if (error) throw error;
      
      if (!adminExists) {
        const dbAdmin = {
          id: DEFAULT_ADMIN.id,
          name: DEFAULT_ADMIN.name,
          email: DEFAULT_ADMIN.email,
          password: DEFAULT_ADMIN.password,
          role: DEFAULT_ADMIN.role,
          status: DEFAULT_ADMIN.status,
          last_login: null
        };
        await sb.from('users').insert(dbAdmin);
      }
      
      const { data: settingsExist } = await sb.from('system_settings').select('key').limit(1);
      if (!settingsExist || settingsExist.length === 0) {
        for (const s of DEFAULT_SETTINGS) {
          await sb.from('system_settings').upsert(s);
        }
      }
    } catch (err) {
      console.warn("Supabase Offline ou Erro de Conexão. Usando LocalDB.");
    }
  },

  async getInvoices(): Promise<Invoice[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('invoices').select('*').order('vcto', { ascending: true });
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
    
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const payload = { ...invoice, history: JSON.stringify(invoice.history || []) };
        await sb.from('invoices').upsert(payload);
      } catch (err) {}
    }
  },

  async deleteInvoice(id: string): Promise<void> {
    localDb.saveInvoices(localDb.getInvoices().filter(i => i.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('invoices').delete().eq('id', id); } catch (err) {}
    }
  },

  async deleteAllInvoices(): Promise<void> {
    localDb.saveInvoices([]);
    const sb = getSupabaseClient();
    if (sb) {
      try {
        // Supabase requer um filtro para o delete; usamos neq('id', 'null') como filtro global
        const { error } = await sb.from('invoices').delete().neq('id', 'null');
        if (error) throw error;
      } catch (err) {
        console.error("Erro ao deletar em massa no Supabase:", err);
      }
    }
  },

  // Supplier Methods
  async getSuppliers(): Promise<Supplier[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('suppliers').select('*').order('razaoSocial', { ascending: true });
        if (error) throw error;
        return (data || []) as Supplier[];
      } catch (err) { return localDb.getSuppliers(); }
    }
    return localDb.getSuppliers();
  },

  async saveSupplier(supplier: Supplier): Promise<void> {
    const currentLocal = localDb.getSuppliers();
    const idx = currentLocal.findIndex(s => s.id === supplier.id);
    if (idx >= 0) currentLocal[idx] = supplier; else currentLocal.unshift(supplier);
    localDb.saveSuppliers(currentLocal);
    
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('suppliers').upsert(supplier); } catch (err) {}
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    localDb.saveSuppliers(localDb.getSuppliers().filter(s => s.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('suppliers').delete().eq('id', id); } catch (err) {}
    }
  },

  async getUsers(): Promise<User[]> {
    const localUsers = localDb.getUsers();
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*');
        if (error) throw error;
        return (data || []).map(u => ({ 
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role as UserRole,
          status: u.status as 'Ativo' | 'Inativo',
          lastLogin: u.last_login ? u.last_login : 'Nunca acessou',
          avatar: u.avatar,
          phone: u.phone,
          bio: u.bio
        })) as User[];
      } catch (err) { return localUsers; }
    }
    return localUsers;
  },

  async saveUser(user: User): Promise<void> {
    const currentLocal = localDb.getUsers();
    const idx = currentLocal.findIndex(u => u.id === user.id);
    if (idx >= 0) currentLocal[idx] = user; else currentLocal.push(user);
    localDb.saveUsers(currentLocal);
    
    const sb = getSupabaseClient();
    if (sb) {
      try {
        // Validação de data segura para evitar RangeError: Invalid time value
        let lastLoginIso: string | null = null;
        if (user.lastLogin && !user.lastLogin.includes('Nunca') && !user.lastLogin.includes('Aguardando')) {
          const dateObj = new Date(user.lastLogin);
          if (!isNaN(dateObj.getTime())) {
            lastLoginIso = dateObj.toISOString();
          }
        }

        const dbUser = { 
          id: user.id, 
          name: user.name, 
          email: user.email, 
          password: user.password, 
          role: user.role, 
          status: user.status, 
          last_login: lastLoginIso,
          avatar: user.avatar,
          phone: user.phone,
          bio: user.bio
        };
        const { error } = await sb.from('users').upsert(dbUser);
        if (error) throw error;
      } catch (err) {
        console.error("Falha na sincronização Supabase:", err);
      }
    }
  },

  async deleteUser(id: string): Promise<void> {
    localDb.saveUsers(localDb.getUsers().filter(u => u.id !== id));
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('users').delete().eq('id', id); } catch (err) {}
    }
  },

  async getErrorLogs(): Promise<ImportErrorLog[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('import_errors').select('*').order('date', { ascending: false });
        if (error) throw error;
        return (data || []) as ImportErrorLog[];
      } catch (err) { return localDb.getErrorLogs(); }
    }
    return localDb.getErrorLogs();
  },

  async saveImportError(log: ImportErrorLog): Promise<void> {
    const current = localDb.getErrorLogs();
    current.unshift(log);
    localDb.saveErrorLogs(current.slice(0, 100));
    
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('import_errors').insert(log); } catch (err) {}
    }
  },

  async clearErrorLogs(): Promise<void> {
    localDb.saveErrorLogs([]);
    const sb = getSupabaseClient();
    if (sb) {
      try { await sb.from('import_errors').delete().neq('id', 'null'); } catch (err) {}
    }
  },

  async getSystemSettings(): Promise<SystemSetting[]> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        const { data, error } = await sb.from('system_settings').select('*');
        if (error) throw error;
        return data.length > 0 ? (data as SystemSetting[]) : localDb.getSettings();
      } catch (err) { return localDb.getSettings(); }
    }
    return localDb.getSettings();
  },

  async saveSystemSettings(settings: SystemSetting[]): Promise<void> {
    localDb.saveSettings(settings);
    const sb = getSupabaseClient();
    if (sb) {
      try {
        for (const s of settings) {
          await sb.from('system_settings').upsert(s);
        }
      } catch (err) {}
    }
  }
};
