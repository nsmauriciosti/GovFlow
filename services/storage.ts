
import { Invoice, User, UserRole, Situacao, HistoryEntry } from '../types';
import { generateId } from '../utils';

const STORAGE_KEYS = {
  INVOICES: 'govflow_db_invoices',
  USERS: 'govflow_db_users',
};

export const storage = {
  getInvoices: (): Invoice[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveInvoices: (invoices: Invoice[]) => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  },

  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  initDatabase: () => {
    const currentInvoices = storage.getInvoices();
    let currentUsers = storage.getUsers();

    if (currentInvoices.length === 0) {
      const today = new Date();
      const date3 = new Date(today); date3.setDate(today.getDate() + 2);
      const date5 = new Date(today); date5.setDate(today.getDate() + 5);
      
      const seedInvoices: Invoice[] = [
        { 
          id: generateId(), 
          secretaria: 'SAÚDE', 
          fornecedor: 'MED CORP', 
          ne: '2023NE001', 
          nf: '10293', 
          valor: 25000.50, 
          vcto: date3.toISOString().split('T')[0], 
          pgto: null, 
          situacao: Situacao.NAO_PAGO,
          history: [
            { id: generateId(), date: today.toISOString(), description: 'Nota Fiscal emitida e registrada no sistema.', user: 'Sistema GovFlow' },
            { id: generateId(), date: today.toISOString(), description: 'Empenho realizado pela Secretaria de Fazenda.', user: 'Admin' }
          ]
        },
        { 
          id: generateId(), 
          secretaria: 'OBRAS', 
          fornecedor: 'CONSTRUTORA S/A', 
          ne: '2023NE105', 
          nf: '887', 
          valor: 150000.00, 
          vcto: date5.toISOString().split('T')[0], 
          pgto: null, 
          situacao: Situacao.NAO_PAGO,
          history: [
            { id: generateId(), date: today.toISOString(), description: 'Aguardando liquidação física da obra.', user: 'Auditor Obras' }
          ]
        },
      ];
      storage.saveInvoices(seedInvoices);
    }

    const masterAdmin = currentUsers.find(u => u.id === 'master-admin' || u.email === 'admin@gov.br');
    if (!masterAdmin) {
      const seedUsers: User[] = [
        { id: 'master-admin', name: 'Administrador Geral', email: 'admin@gov.br', password: 'admin123', role: UserRole.ADMIN, status: 'Ativo', lastLogin: 'Aguardando primeiro acesso' },
        { id: generateId(), name: 'Gestor de Finanças', email: 'gestor@gov.br', password: 'gestor123', role: UserRole.GESTOR, status: 'Ativo', lastLogin: 'Nunca acessou' }
      ];
      storage.saveUsers(seedUsers);
    } else if (masterAdmin.password !== 'admin123') {
      const updatedUsers = currentUsers.map(u => u.email === 'admin@gov.br' ? { ...u, password: 'admin123' } : u);
      storage.saveUsers(updatedUsers);
    }
  }
};
