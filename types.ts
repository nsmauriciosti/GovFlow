
export enum Situacao {
  PAGO = 'PAGO',
  NAO_PAGO = 'NÃO PAGO'
}

export enum UserRole {
  ADMIN = 'Administrador',
  GESTOR = 'Gestor',
  AUDITOR = 'Auditor'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Campo opcional na interface mas obrigatório na criação
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  lastLogin: string;
}

export interface Invoice {
  id: string;
  secretaria: string;
  fornecedor: string;
  ne: string;
  nf: string;
  valor: number;
  vcto: string; // ISO date string or YYYY-MM-DD
  pgto: string | null; // ISO date string or YYYY-MM-DD
  situacao: Situacao;
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
  mesVcto: string;
}
