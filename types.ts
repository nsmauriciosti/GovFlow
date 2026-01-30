
export enum Situacao {
  PAGO = 'PAGO',
  NAO_PAGO = 'NÃO PAGO',
  CANCELADO = 'CANCELADO'
}

export enum UserRole {
  ADMIN = 'Administrador',
  FINANCEIRO = 'Financeiro',
  CONSULTA = 'Consulta',
  GESTOR = 'Gestor',
  AUDITOR = 'Auditor'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  lastLogin: string;
  avatar?: string; // URL ou Base64
  phone?: string;
  bio?: string;
}

export interface Supplier {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  status: 'Ativo' | 'Inativo';
  dataCadastro: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  description: string;
  user: string;
}

export interface ImportErrorLog {
  id: string;
  date: string;
  fileName: string;
  errorType: 'FORMATO_INVALIDO' | 'FALHA_IA' | 'SISTEMA' | 'DADOS_INCOMPLETOS';
  details: string;
  userEmail: string;
}

export interface Invoice {
  id: string;
  secretaria: string;
  fornecedor: string;
  ne: string;
  nf: string;
  valor: number;
  vcto: string; 
  pgto: string | null; 
  situacao: Situacao;
  history?: HistoryEntry[];
}

export interface DashboardStats {
  totalAberto: number;
  totalPago: number;
  topFornecedores: { name: string; value: number }[];
  distribuicaoSecretaria: { name: string; value: number; percentage: number }[];
}

export interface Filters {
  secretaria: string;
  fornecedor: string;
  situacao: string;
  startDate: string;
  endDate: string;
}

export interface SystemSetting {
  key: string;
  value: string;
}

export type ViewType = 'dashboard' | 'invoices' | 'users' | 'logs' | 'settings' | 'profile' | 'suppliers';
