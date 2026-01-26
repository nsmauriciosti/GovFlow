
import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, Situacao, Filters, User, UserRole } from './types';
import { formatCurrency, generateId } from './utils';
import { storage } from './services/storage';
import KpiCard from './components/KpiCard';
import DashboardView from './components/DashboardView';
import InvoiceTable from './components/InvoiceTable';
import ImportModal from './components/ImportModal';
import ManualEntryModal from './components/ManualEntryModal';
import ReminderSection from './components/ReminderSection';
import Sidebar from './components/Sidebar';
import UserManagementView from './components/UserManagementView';
import UserModal from './components/UserModal';
import LoginView from './components/LoginView';
import { getFinancialInsights } from './services/geminiService';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // App State
  const [currentView, setCurrentView] = useState<'dashboard' | 'users'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Modals States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    secretaria: '',
    fornecedor: '',
    situacao: '',
    mesVcto: ''
  });

  // 1. Initial Load: Run seed and load to state
  useEffect(() => {
    storage.initDatabase();
    const loadedInvoices = storage.getInvoices();
    const loadedUsers = storage.getUsers();
    
    setInvoices(loadedInvoices);
    setUsers(loadedUsers);
  }, []);

  // 2. Persistent Login: Simple check in all current users
  const handleLogin = (email: string, pass: string) => {
    setIsAuthLoading(true);
    setAuthError(undefined);
    
    // Pequeno delay para UX de segurança
    setTimeout(() => {
      // Sempre ler direto do storage no login para garantir dados mais frescos
      const currentUsersInDb = storage.getUsers();
      const foundUser = currentUsersInDb.find(u => u.email === email && u.password === pass);

      if (foundUser) {
        if (foundUser.status === 'Inativo') {
          setAuthError('Esta conta está desativada. Entre em contato com o administrador.');
        } else {
          const updatedUser = { ...foundUser, lastLogin: new Date().toLocaleString('pt-BR') };
          const updatedUsersList = currentUsersInDb.map(u => u.id === foundUser.id ? updatedUser : u);
          
          setUsers(updatedUsersList);
          storage.saveUsers(updatedUsersList);
          
          setCurrentUser(updatedUser);
          setIsAuthenticated(true);
        }
      } else {
        setAuthError('E-mail ou senha incorretos. Verifique suas credenciais (admin@gov.br / admin123).');
      }
      setIsAuthLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSec = !filters.secretaria || inv.secretaria.toLowerCase().includes(filters.secretaria.toLowerCase());
      const matchForn = !filters.fornecedor || inv.fornecedor.toLowerCase().includes(filters.fornecedor.toLowerCase());
      const matchSit = !filters.situacao || inv.situacao === filters.situacao;
      const matchMes = !filters.mesVcto || inv.vcto.split('-')[1] === filters.mesVcto;
      return matchSec && matchForn && matchSit && matchMes;
    });
  }, [invoices, filters]);

  const stats = useMemo(() => {
    const totalAberto = filteredInvoices.filter(i => i.situacao === Situacao.NAO_PAGO).reduce((s, i) => s + i.valor, 0);
    const totalPago = filteredInvoices.filter(i => i.situacao === Situacao.PAGO).reduce((s, i) => s + i.valor, 0);
    return { totalAberto, totalPago };
  }, [filteredInvoices]);

  // Handlers with auto-sync to storage
  const handleSaveManual = (newInvoice: Invoice) => {
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    storage.saveInvoices(updated);
  };

  const handleImport = (newInvoices: Invoice[]) => {
    const updated = [...newInvoices, ...invoices];
    setInvoices(updated);
    storage.saveInvoices(updated);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm("Deseja realmente excluir esta nota fiscal permanentemente?")) {
      const updated = invoices.filter(i => i.id !== id);
      setInvoices(updated);
      storage.saveInvoices(updated);
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === id) {
        const isNowPago = inv.situacao === Situacao.NAO_PAGO;
        return {
          ...inv,
          situacao: isNowPago ? Situacao.PAGO : Situacao.NAO_PAGO,
          pgto: isNowPago ? new Date().toISOString().split('T')[0] : null
        };
      }
      return inv;
    });
    setInvoices(updated);
    storage.saveInvoices(updated);
  };

  const handleSaveUser = (user: User) => {
    let updatedUsers;
    const exists = users.some(u => u.id === user.id);
    if (exists) {
      updatedUsers = users.map(u => u.id === user.id ? user : u);
    } else {
      updatedUsers = [user, ...users];
    }
    setUsers(updatedUsers);
    storage.saveUsers(updatedUsers);
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleEditUser = (user: User) => { setEditingUser(user); setIsUserModalOpen(true); };
  
  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert("Operação negada: Você não pode remover sua própria conta logada.");
      return;
    }
    if (confirm("Deseja realmente remover este usuário e revogar todos os seus acessos?")) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      storage.saveUsers(updated);
    }
  };

  const generateReport = async () => {
    setIsAiLoading(true);
    const insight = await getFinancialInsights(filteredInvoices);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} error={authError} isLoading={isAuthLoading} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-8 sticky top-0 z-40 no-print flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
             <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
               {currentView === 'dashboard' ? 'Painel de Gestão Financeira' : 'Administração de Sistema'}
             </h2>
          </div>
          
          {currentView === 'dashboard' && (
            <div className="flex gap-2">
              <button onClick={() => setIsManualModalOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Novo Registro
              </button>
              <button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
                Importar IA
              </button>
            </div>
          )}
        </header>

        <main className="p-8">
          {currentView === 'dashboard' ? (
            <>
              <ReminderSection invoices={invoices} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <KpiCard title="Aberto" value={formatCurrency(stats.totalAberto)} icon={<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-rose-50" />
                <KpiCard title="Pago" value={formatCurrency(stats.totalPago)} icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-emerald-50" />
                <KpiCard title="Total NF" value={filteredInvoices.length.toString()} icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5" /></svg>} colorClass="bg-blue-50" />
                <KpiCard title="Pendentes" value={filteredInvoices.filter(i => i.situacao === Situacao.NAO_PAGO && !i.pgto).length.toString()} icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" /></svg>} colorClass="bg-amber-50" />
              </div>

              <section className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input placeholder="Secretaria..." className="p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 bg-white" value={filters.secretaria} onChange={(e) => setFilters({...filters, secretaria: e.target.value})} />
                  <input placeholder="Fornecedor..." className="p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 bg-white" value={filters.fornecedor} onChange={(e) => setFilters({...filters, fornecedor: e.target.value})} />
                  <select className="p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 bg-white" value={filters.situacao} onChange={(e) => setFilters({...filters, situacao: e.target.value as Situacao || ''})}>
                    <option value="">Todas as situações</option>
                    <option value={Situacao.PAGO}>PAGO</option>
                    <option value={Situacao.NAO_PAGO}>NÃO PAGO</option>
                  </select>
                  <select className="p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 bg-white" value={filters.mesVcto} onChange={(e) => setFilters({...filters, mesVcto: e.target.value})}>
                    <option value="">Todos os meses</option>
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </section>

              <DashboardView invoices={filteredInvoices} />

              <section className="mt-8 bg-indigo-50 border border-indigo-100 p-6 rounded-2xl no-print">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-indigo-900 font-bold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" /></svg>
                    Parecer da Inteligência Artificial
                  </h4>
                  <button onClick={generateReport} disabled={isAiLoading} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors">
                    {isAiLoading ? 'Analisando dados financeiros...' : 'Gerar Novo Insight'}
                  </button>
                </div>
                {aiInsight ? (
                  <div className="prose prose-sm max-w-none text-indigo-800 leading-relaxed whitespace-pre-line animate-in fade-in duration-700">
                    {aiInsight}
                  </div>
                ) : (
                  <p className="text-indigo-300 text-xs italic">Aguardando solicitação de análise financeira automatizada...</p>
                )}
              </section>

              <div className="mt-8">
                <InvoiceTable invoices={filteredInvoices} onDelete={handleDeleteInvoice} onToggleStatus={handleToggleStatus} />
              </div>
            </>
          ) : (
            <UserManagementView 
              users={users} 
              onAddUser={() => { setEditingUser(null); setIsUserModalOpen(true); }} 
              onEditUser={handleEditUser} 
              onDeleteUser={handleDeleteUser} 
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleImport} />}
      {isManualModalOpen && <ManualEntryModal onClose={() => setIsManualModalOpen(false)} onSave={handleSaveManual} />}
      {isUserModalOpen && <UserModal user={editingUser} onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} />}
    </div>
  );
};

export default App;
