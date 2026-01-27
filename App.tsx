
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, Situacao, Filters, User, UserRole, HistoryEntry } from './types';
import { formatCurrency, generateId } from './utils';
import { dataService } from './services/dataService';
import KpiCard from './components/KpiCard';
import DashboardView from './components/DashboardView';
import InvoiceTable from './components/InvoiceTable';
import ImportModal from './components/ImportModal';
import ManualEntryModal from './components/ManualEntryModal';
import Sidebar from './components/Sidebar';
import UserManagementView from './components/UserManagementView';
import ErrorLogsView from './components/ErrorLogsView';
import UserModal from './components/UserModal';
import LoginView from './components/LoginView';
import InvoiceDetailsPanel from './components/InvoiceDetailsPanel';
import NotificationDropdown from './components/NotificationDropdown';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import { getFinancialInsights } from './services/geminiService';
import { isSupabaseConfigured } from './services/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [currentView, setCurrentView] = useState<'dashboard' | 'invoices' | 'users' | 'logs'>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    secretaria: '', fornecedor: '', situacao: '', startDate: '', endDate: ''
  });

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (currentView === 'dashboard' && invoices.length > 0 && !aiInsight) generateInsights();
  }, [currentView, invoices]);

  const generateInsights = async () => {
    setIsAiLoading(true);
    try {
      const insight = await getFinancialInsights(invoices);
      setAiInsight(insight);
      addToast('Insights financeiros atualizados.', 'success');
    } catch (e) {
      setAiInsight('Não foi possível gerar insights no momento.');
      addToast('Falha na IA.', 'warning');
    } finally { setIsAiLoading(false); }
  };

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      await dataService.seedDatabase();
      const [fetchedInvoices, fetchedUsers] = await Promise.all([
        dataService.getInvoices(),
        dataService.getUsers()
      ]);
      setInvoices(fetchedInvoices);
      setUsers(fetchedUsers);
    } catch (error) {
      addToast('Erro ao sincronizar dados.', 'error');
    } finally { setIsLoadingData(false); }
  };

  const handleLogin = async (email: string, pass: string) => {
    setIsAuthLoading(true); setAuthError(undefined);
    try {
      const currentUsersInDb = await dataService.getUsers();
      const foundUser = currentUsersInDb.find(u => u.email === email && u.password === pass);
      if (foundUser) {
        if (foundUser.status === 'Inativo') setAuthError('Conta desativada.');
        else {
          const updatedUser = { ...foundUser, lastLogin: new Date().toLocaleString('pt-BR') };
          await dataService.saveUser(updatedUser);
          setCurrentUser(updatedUser); setIsAuthenticated(true);
          const refreshedUsers = await dataService.getUsers(); setUsers(refreshedUsers);
          addToast(`Olá, ${foundUser.name}!`, 'success');
        }
      } else setAuthError('E-mail ou senha incorretos.');
    } catch (err) { setAuthError('Erro ao conectar ao banco.'); }
    finally { setIsAuthLoading(false); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setCurrentUser(null); setCurrentView('dashboard');
    setSelectedInvoice(null); setAiInsight(''); addToast('Sessão encerrada.', 'info');
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSec = !filters.secretaria || inv.secretaria.toLowerCase().includes(filters.secretaria.toLowerCase());
      const matchForn = !filters.fornecedor || inv.fornecedor.toLowerCase().includes(filters.fornecedor.toLowerCase());
      const matchSit = !filters.situacao || inv.situacao === filters.situacao;
      const invoiceDate = inv.vcto;
      const matchStart = !filters.startDate || invoiceDate >= filters.startDate;
      const matchEnd = !filters.endDate || invoiceDate <= filters.endDate;
      return matchSec && matchForn && matchSit && matchStart && matchEnd;
    });
  }, [invoices, filters]);

  const stats = useMemo(() => {
    const totalAberto = invoices.filter(i => i.situacao === Situacao.NAO_PAGO).reduce((s, i) => s + i.valor, 0);
    const totalPago = invoices.filter(i => i.situacao === Situacao.PAGO).reduce((s, i) => s + i.valor, 0);
    return { totalAberto, totalPago };
  }, [invoices]);

  const handleSaveManual = async (invoiceData: Invoice) => {
    const isEdit = invoices.some(i => i.id === invoiceData.id);
    const history: HistoryEntry = {
      id: generateId(), date: new Date().toISOString(),
      description: isEdit ? 'Registro atualizado.' : 'Nota registrada no sistema.',
      user: currentUser?.name || 'Sistema'
    };
    const invoiceToSave = { ...invoiceData, history: [...(invoiceData.history || []), history] };
    try {
      await dataService.saveInvoice(invoiceToSave);
      if (isEdit) setInvoices(prev => prev.map(i => i.id === invoiceToSave.id ? invoiceToSave : i));
      else setInvoices(prev => [invoiceToSave, ...prev]);
      setEditingInvoice(null); setAiInsight('');
      addToast('Salvo com sucesso.', 'success');
    } catch (err) { addToast('Erro ao salvar.', 'error'); }
  };

  const handleImport = async (newInvoices: Invoice[]) => {
    const updatedWithHistory = newInvoices.map(inv => ({
      ...inv, history: [{ id: generateId(), date: new Date().toISOString(), description: 'Importado via IA.', user: currentUser?.name || 'Sistema' }]
    }));
    try {
      for (const inv of updatedWithHistory) await dataService.saveInvoice(inv);
      setInvoices(prev => [...updatedWithHistory, ...prev]);
      setAiInsight(''); addToast('Importação concluída.', 'success');
    } catch (err) { addToast('Erro na importação.', 'error'); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("Excluir permanentemente?")) {
      try {
        await dataService.deleteInvoice(id);
        setInvoices(prev => prev.filter(i => i.id !== id));
        if (selectedInvoice?.id === id) setSelectedInvoice(null);
        setAiInsight(''); addToast('Removido.', 'success');
      } catch (err) { addToast('Erro ao deletar.', 'error'); }
    }
  };

  const handleToggleStatus = async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const isNowPago = inv.situacao === Situacao.NAO_PAGO;
    const historyEntry: HistoryEntry = {
      id: generateId(), date: new Date().toISOString(),
      description: `Alteração para ${isNowPago ? 'PAGO' : 'NÃO PAGO'}.`,
      user: currentUser?.name || 'Sistema'
    };
    const updatedInv = { ...inv, situacao: isNowPago ? Situacao.PAGO : Situacao.NAO_PAGO, pgto: isNowPago ? new Date().toISOString().split('T')[0] : null, history: [...(inv.history || []), historyEntry] };
    try {
      await dataService.saveInvoice(updatedInv);
      setInvoices(prev => prev.map(i => i.id === id ? updatedInv : i));
      if (selectedInvoice?.id === id) setSelectedInvoice(updatedInv);
      setAiInsight(''); addToast('Status atualizado.', 'info');
    } catch (err) { addToast('Erro ao atualizar status.', 'error'); }
  };

  const handleSaveUser = async (user: User) => {
    try {
      await dataService.saveUser(user);
      const refreshedUsers = await dataService.getUsers(); setUsers(refreshedUsers);
      setIsUserModalOpen(false); setEditingUser(null);
      addToast('Usuário salvo.', 'success');
    } catch (err) { addToast('Erro ao salvar usuário.', 'error'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) { addToast('Você não pode se remover.', 'warning'); return; }
    if (confirm("Remover usuário?")) {
      try {
        await dataService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        addToast('Usuário removido.', 'success');
      } catch (err) { addToast('Erro ao remover.', 'error'); }
    }
  };

  if (!isAuthenticated) return <LoginView onLogin={handleLogin} error={authError} isLoading={isAuthLoading} />;
  if (isLoadingData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-slate-600 font-bold">Sincronizando Dados...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-8 sticky top-0 z-40 no-print flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
             <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
               {currentView === 'dashboard' ? 'Analytics' : currentView === 'invoices' ? 'Notas Fiscais' : currentView === 'users' ? 'Usuários' : 'Logs de Sistema'}
               {isSupabaseConfigured && <span className="ml-2 bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-black border border-emerald-200">CONECTADO</span>}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown invoices={invoices} onSelectInvoice={setSelectedInvoice} />
            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>
            <div className="flex gap-2">
              {currentView === 'invoices' && (
                <>
                  <button onClick={() => { setEditingInvoice(null); setIsManualModalOpen(true); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2">Novo Registro</button>
                  <button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">Importar IA</button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-8">
          {currentView === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total em Aberto" value={formatCurrency(stats.totalAberto)} icon={<svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-rose-50" />
                <KpiCard title="Total Liquidado" value={formatCurrency(stats.totalPago)} icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-emerald-50" />
                <KpiCard title="Total de Registros" value={invoices.length.toString()} icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5" /></svg>} colorClass="bg-blue-50" />
                <KpiCard title="Pendências Críticas" value={invoices.filter(i => i.situacao === Situacao.NAO_PAGO && !i.pgto).length.toString()} icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" /></svg>} colorClass="bg-amber-50" />
              </div>
              <div className="mt-8 bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span className="bg-indigo-500 px-2 py-1 rounded text-[10px]">IA</span> Resumo Executivo</h3>
                  <div className="prose prose-invert max-w-none text-indigo-100 text-sm leading-relaxed whitespace-pre-wrap">{aiInsight || "Aguardando análise de dados..."}</div>
                </div>
              </div>
              <DashboardView invoices={invoices} />
            </div>
          )}
          {currentView === 'invoices' && (
            <div className="animate-in fade-in duration-500">
              <section className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 no-print">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input placeholder="Secretaria..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" value={filters.secretaria} onChange={(e) => setFilters({...filters, secretaria: e.target.value})} />
                  <input placeholder="Fornecedor..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" value={filters.fornecedor} onChange={(e) => setFilters({...filters, fornecedor: e.target.value})} />
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" value={filters.situacao} onChange={(e) => setFilters({...filters, situacao: e.target.value})}>
                    <option value="">Todas</option><option value={Situacao.PAGO}>PAGO</option><option value={Situacao.NAO_PAGO}>NÃO PAGO</option>
                  </select>
                  <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
                  <input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
                </div>
              </section>
              <InvoiceTable invoices={filteredInvoices} onDelete={handleDeleteInvoice} onToggleStatus={handleToggleStatus} onSelectInvoice={setSelectedInvoice} onEditInvoice={(inv) => { setEditingInvoice(inv); setIsManualModalOpen(true); }} />
            </div>
          )}
          {currentView === 'users' && <UserManagementView users={users} onAddUser={() => { setEditingUser(null); setIsUserModalOpen(true); }} onEditUser={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} onDeleteUser={handleDeleteUser} currentUser={currentUser} />}
          {currentView === 'logs' && <ErrorLogsView />}
        </main>
      </div>
      <Toast toasts={toasts} onRemove={removeToast} />
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleImport} onToast={addToast} userEmail={currentUser?.email || 'Sistema'} />}
      {isManualModalOpen && <ManualEntryModal invoice={editingInvoice} onClose={() => { setIsManualModalOpen(false); setEditingInvoice(null); }} onSave={handleSaveManual} onToast={addToast} />}
      {isUserModalOpen && <UserModal user={editingUser} onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} onToast={addToast} />}
      <InvoiceDetailsPanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
};

export default App;
