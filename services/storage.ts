
import { Invoice, User, UserRole, Situacao } from '../types';
import { generateId } from '../utils';

const STORAGE_KEYS = {
  INVOICES: 'govflow_db_invoices',
  USERS: 'govflow_db_users',
};

export const storage = {
  // Operações de Notas Fiscais
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

  // Operações de Usuários
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

  // Inicialização do Banco de Dados (Seed)
  initDatabase: () => {
    const currentInvoices = storage.getInvoices();
    let currentUsers = storage.getUsers();

    // Se não houver faturas, cria as iniciais
    if (currentInvoices.length === 0) {
      const today = new Date();
      const date3 = new Date(today); date3.setDate(today.getDate() + 2);
      const date5 = new Date(today); date5.setDate(today.getDate() + 5);
      
      const seedInvoices: Invoice[] = [
        { id: generateId(), secretaria: 'SAÚDE', fornecedor: 'MED CORP', ne: '2023NE001', nf: '10293', valor: 25000.50, vcto: date3.toISOString().split('T')[0], pgto: null, situacao: Situacao.NAO_PAGO },
        { id: generateId(), secretaria: 'OBRAS', fornecedor: 'CONSTRUTORA S/A', ne: '2023NE105', nf: '887', valor: 150000.00, vcto: date5.toISOString().split('T')[0], pgto: null, situacao: Situacao.NAO_PAGO },
      ];
      storage.saveInvoices(seedInvoices);
    }

    // Lógica de recuperação/inicialização de usuários
    const masterAdmin = currentUsers.find(u => u.id === 'master-admin' || u.email === 'admin@gov.br');

    if (!masterAdmin) {
      // Cria se não existir
      const seedUsers: User[] = [
        { 
          id: 'master-admin', 
          name: 'Administrador Geral', 
          email: 'admin@gov.br', 
          password: 'admin123', 
          role: UserRole.ADMIN, 
          status: 'Ativo', 
          lastLogin: 'Aguardando primeiro acesso' 
        },
        { 
          id: generateId(), 
          name: 'Gestor de Finanças', 
          email: 'gestor@gov.br', 
          password: 'gestor123', 
          role: UserRole.GESTOR, 
          status: 'Ativo', 
          lastLogin: 'Nunca acessou' 
        }
      ];
      storage.saveUsers(seedUsers);
    } else if (masterAdmin.password !== 'admin123') {
      // FORÇA a atualização da senha caso ela esteja diferente da esperada (admin123)
      const updatedUsers = currentUsers.map(u => 
        u.email === 'admin@gov.br' ? { ...u, password: 'admin123' } : u
      );
      storage.saveUsers(updatedUsers);
    }
  }
};
