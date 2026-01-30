
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, Situacao, Filters, User, UserRole, HistoryEntry, ViewType, SystemSetting, Supplier } from './types';
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
import SettingsView from './components/SettingsView';
import UserModal from './components/UserModal';
import LoginView from './components/LoginView';
import InvoiceDetailsPanel from './components/InvoiceDetailsPanel';
import NotificationDropdown from './components/NotificationDropdown';
import ProfileDropdown from './components/ProfileDropdown';
import SupplierManagementView from './components/SupplierManagementView';
import SupplierModal from './components/SupplierModal';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import ProfileView from './components/ProfileView';
import ReminderSection from './components/ReminderSection';
import { getFinancialInsights } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | undefined>();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('govflow_theme') as 'light' | 'dark') || 'light';
  });

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('govflow_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [aiInsight, setAiInsight] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    secretaria: '', fornecedor: '', situacao: '', startDate: '', endDate: ''
  });

  const systemName = settings.find(s => s.key === 'system_name')?.value || 'GovFlow Pro';
  const systemSlogan = settings.find(s => s.key === 'system_slogan')?.value || 'Portal de Gestão de Finanças Públicas';
  const footerText = settings.find(s => s.key === 'footer_text')?.value || 'Sistema restrito para servidores autorizados.';
  const faviconUrl = settings.find(s => s.key === 'favicon_url')?.value;
  const isAiEnabled = settings.find(s => s.key === 'ai_enabled')?.value !== 'false';

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    document.title = systemName;
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [systemName, faviconUrl]);

  useEffect(() => {
    if (currentView === 'dashboard' && invoices.length > 0 && !aiInsight && isAiEnabled) generateInsights();
    else if (!isAiEnabled) setAiInsight('As funcionalidades de Inteligência Artificial estão temporariamente desativadas pelo administrador.');
  }, [currentView, invoices, aiInsight, isAiEnabled]);

  const generateInsights = async () => {
    if (!isAiEnabled) return;
    try {
      const insight = await getFinancialInsights(invoices);
      setAiInsight(insight);
      addToast('Resumo executivo atualizado.', 'success');
    } catch (e) {
      setAiInsight('Não foi possível gerar insights no momento.');
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      await dataService.seedDatabase();
      const [fetchedInvoices, fetchedUsers, fetchedSettings, fetchedSuppliers] = await Promise.all([
        dataService.getInvoices(),
        dataService.getUsers(),
        dataService.getSystemSettings(),
        dataService.getSuppliers()
      ]);
      setInvoices(fetchedInvoices);
      setUsers(fetchedUsers);
      setSettings(fetchedSettings);
      setSuppliers(fetchedSuppliers);
    } catch (error) {
      addToast('Erro ao sincronizar dados.', 'error');
    } finally { setIsLoadingData(false); }
  };

  const handleLogin = useCallback(async (email: string, pass: string) => {
    setIsAuthLoading(true); setAuthError(undefined);
    try {
      const currentUsersInDb = await dataService.getUsers();
      const foundUser = currentUsersInDb.find(u => u.email === email && u.password === pass);
      if (foundUser) {
        if (foundUser.status === 'Inativo') setAuthError('Conta desativada.');
        else {
          const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
          await dataService.saveUser(updatedUser);
          setCurrentUser(updatedUser); setIsAuthenticated(true);
          const refreshedUsers = await dataService.getUsers(); setUsers(refreshedUsers);
          addToast(`Olá, ${foundUser.name}!`, 'success');
        }
      } else setAuthError('E-mail ou senha incorretos.');
    } catch (err) { setAuthError('Erro ao conectar ao banco.'); }
    finally { setIsAuthLoading(false); }
  }, [addToast]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false); setCurrentUser(null); setCurrentView('dashboard');
    setSelectedInvoice(null); setAiInsight(''); addToast('Sessão encerrada.', 'info');
  }, [addToast]);

  const handleSaveSettings = async (newSettings: SystemSetting[]) => {
    try {
      await dataService.saveSystemSettings(newSettings);
      setSettings(newSettings);
      addToast('Configurações aplicadas com sucesso.', 'success');
    } catch (err) {
      addToast('Erro ao salvar configurações.', 'error');
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const filterSec = filters.secretaria.trim().toLowerCase();
      const invoiceSec = inv.secretaria.trim().toLowerCase();
      const matchSec = !filters.secretaria || invoiceSec === filterSec;
      const matchForn = !filters.fornecedor || inv.fornecedor.toLowerCase().includes(filters.fornecedor.toLowerCase());
      const matchSit = !filters.situacao || inv.situacao === filters.situacao;
      const invoiceDate = inv.vcto;
      const matchStart = !filters.startDate || invoiceDate >= filters.startDate;
      const matchEnd = !filters.endDate || invoiceDate <= filters.endDate;
      return matchSec && matchForn && matchSit && matchStart && matchEnd;
    });
  }, [invoices, filters]);

  const stats = useMemo(() => {
    const activeInvoices = invoices.filter(i => i.situacao !== Situacao.CANCELADO);
    const totalAberto = activeInvoices.filter(i => i.situacao === Situacao.NAO_PAGO).reduce((s, i) => s + i.valor, 0);
    const totalPago = activeInvoices.filter(i => i.situacao === Situacao.PAGO).reduce((s, i) => s + i.valor, 0);
    return { totalAberto, totalPago };
  }, [invoices]);

  const handleSaveManual = useCallback(async (invoiceData: Invoice) => {
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
  }, [invoices, currentUser, addToast]);

  const handleSaveSupplier = useCallback(async (supplierData: Supplier) => {
    try {
      await dataService.saveSupplier(supplierData);
      setSuppliers(prev => {
        const exists = prev.some(s => s.id === supplierData.id);
        if (exists) return prev.map(s => s.id === supplierData.id ? supplierData : s);
        return [supplierData, ...prev];
      });
      setIsSupplierModalOpen(false); setEditingSupplier(null);
      addToast('Fornecedor salvo com sucesso.', 'success');
    } catch (err) { addToast('Erro ao salvar fornecedor.', 'error'); }
  }, [addToast]);

  const handleDeleteSupplier = useCallback(async (id: string) => {
    if (confirm("Excluir este fornecedor permanentemente?")) {
      try {
        await dataService.deleteSupplier(id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
        addToast('Fornecedor removido.', 'success');
      } catch (err) { addToast('Erro ao deletar fornecedor.', 'error'); }
    }
  }, [addToast]);

  const handleImport = useCallback(async (data: { invoices: Invoice[], supplierMetadata: (Partial<Supplier> & { forName: string })[] }) => {
    const { invoices: newInvoices, supplierMetadata } = data;
    try {
      const updatedInvoicesWithHistory = newInvoices.map(inv => ({
        ...inv, 
        history: [{ 
          id: generateId(), 
          date: new Date().toISOString(), 
          description: 'Importado via Inteligência Artificial.', 
          user: currentUser?.name || 'Sistema' 
        }]
      }));
      for (const inv of updatedInvoicesWithHistory) {
        await dataService.saveInvoice(inv);
      }
      setInvoices(prev => [...updatedInvoicesWithHistory, ...prev]);
      let suppliersSyncCount = 0;
      const currentSuppliers = await dataService.getSuppliers();
      const finalSuppliers = [...currentSuppliers];
      for (const meta of supplierMetadata) {
        if (!meta.cnpj) continue;
        const existingIdx = finalSuppliers.findIndex(s => s.cnpj.replace(/\D/g, '') === meta.cnpj?.replace(/\D/g, ''));
        if (existingIdx === -1) {
          const newSupplier: Supplier = {
            id: generateId(),
            razaoSocial: meta.razaoSocial || meta.forName || 'Razão não informada',
            nomeFantasia: meta.nomeFantasia || meta.forName || '',
            cnpj: meta.cnpj,
            email: meta.email || '',
            telefone: meta.telefone || '',
            endereco: meta.endereco || '',
            cidade: meta.cidade || '',
            estado: meta.estado || '',
            status: 'Ativo',
            dataCadastro: new Date().toISOString()
          };
          await dataService.saveSupplier(newSupplier);
          finalSuppliers.unshift(newSupplier);
          suppliersSyncCount++;
        }
      }
      if (suppliersSyncCount > 0) {
        setSuppliers(finalSuppliers);
        addToast(`${suppliersSyncCount} novos fornecedores cadastrados.`, 'success');
      }
      setAiInsight('');
      addToast(`Importação de ${newInvoices.length} notas finalizada com sucesso.`, 'success');
    } catch (err) { 
      addToast('Erro ao processar importação.', 'error'); 
      console.error(err);
    }
  }, [currentUser, addToast]);

  const handleDeleteInvoice = useCallback(async (id: string) => {
    if (confirm("Excluir permanentemente?")) {
      try {
        await dataService.deleteInvoice(id);
        setInvoices(prev => prev.filter(i => i.id !== id));
        if (selectedInvoice?.id === id) setSelectedInvoice(null);
        setAiInsight(''); addToast('Removido.', 'success');
      } catch (err) { addToast('Erro ao deletar.', 'error'); }
    }
  }, [selectedInvoice, addToast]);

  const handleDeleteAllInvoices = useCallback(async () => {
    if (currentUser?.role !== UserRole.ADMIN) {
      addToast('Apenas administradores podem limpar a base.', 'warning');
      return;
    }
    if (confirm("🚨 ATENÇÃO: Deseja deletar TODAS as notas fiscais permanentemente? Esta ação não pode ser desfeita.")) {
      try {
        await dataService.deleteAllInvoices();
        setInvoices([]);
        setAiInsight('');
        if (selectedInvoice) setSelectedInvoice(null);
        addToast('Base de notas fiscais limpa com sucesso.', 'success');
      } catch (err) {
        addToast('Erro ao tentar limpar a base.', 'error');
      }
    }
  }, [currentUser, addToast, selectedInvoice]);

  const handleSaveUser = useCallback(async (userData: User) => {
    try {
      await dataService.saveUser(userData);
      setUsers(prev => {
        const exists = prev.some(u => u.id === userData.id);
        if (exists) return prev.map(u => u.id === userData.id ? userData : u);
        return [...prev, userData];
      });
      if (userData.id === currentUser?.id) setCurrentUser(userData);
      setIsUserModalOpen(false); setEditingUser(null);
      addToast('Usuário salvo com sucesso.', 'success');
    } catch (err) { addToast('Erro ao salvar usuário.', 'error'); }
  }, [currentUser, addToast]);

  const handleDeleteUser = useCallback(async (id: string) => {
    if (id === currentUser?.id) {
      addToast('Você não pode excluir seu próprio usuário.', 'warning');
      return;
    }
    if (confirm("Excluir este usuário permanentemente?")) {
      try {
        await dataService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        addToast('Usuário removido.', 'success');
      } catch (err) { addToast('Erro ao deletar usuário.', 'error'); }
    }
  }, [currentUser, addToast]);

  const handleToggleStatus = useCallback(async (id: string) => {
    setInvoices(prevInvoices => {
      const inv = prevInvoices.find(i => i.id === id);
      if (!inv || inv.situacao === Situacao.CANCELADO) return prevInvoices;
      const isNowPago = inv.situacao === Situacao.NAO_PAGO;
      const historyEntry: HistoryEntry = {
        id: generateId(), date: new Date().toISOString(),
        description: `Alteração para ${isNowPago ? 'PAGO' : 'NÃO PAGO'}.`,
        user: currentUser?.name || 'Sistema'
      };
      const updatedInv = { ...inv, situacao: isNowPago ? Situacao.PAGO : Situacao.NAO_PAGO, pgto: isNowPago ? new Date().toISOString().split('T')[0] : null, history: [...(inv.history || []), historyEntry] };
      dataService.saveInvoice(updatedInv).catch(() => addToast('Erro ao sincronizar status.', 'error'));
      return prevInvoices.map(i => i.id === id ? updatedInv : i);
    });
    setAiInsight('');
  }, [currentUser, addToast]);

  const canWrite = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.FINANCEIRO || currentUser?.role === UserRole.GESTOR;

  if (!isAuthenticated) return <LoginView onLogin={handleLogin} error={authError} isLoading={isAuthLoading} systemName={systemName} systemSlogan={systemSlogan} footerText={footerText} theme={theme} />;
  
  if (isLoadingData) return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex items-center justify-center transition-colors duration-300`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
        <p className="font-bold text-sm">Sincronizando Dados...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        systemName={systemName}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3 px-4 lg:px-8 sticky top-0 z-40 no-print flex justify-between items-center shadow-sm transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
             <div className="h-4 w-1 bg-indigo-600 rounded-full hidden sm:block shrink-0"></div>
             <h2 className="text-[11px] sm:text-xs lg:text-sm font-bold tracking-tight uppercase truncate max-w-[120px] sm:max-w-none">
               {currentView === 'dashboard' ? 'Analytics' : currentView === 'invoices' ? 'Notas Fiscais' : currentView === 'suppliers' ? 'Fornecedores' : currentView === 'users' ? 'Usuários' : currentView === 'settings' ? 'Configurações' : currentView === 'profile' ? 'Meu Cadastro' : 'Logs de Sistema'}
             </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationDropdown invoices={invoices} onSelectInvoice={setSelectedInvoice} theme={theme} />
              <ProfileDropdown currentUser={currentUser} onNavigate={setCurrentView} onLogout={handleLogout} theme={theme} />
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1">
          {currentView === 'dashboard' && (
            <div className="animate-in fade-in duration-500 space-y-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <KpiCard title="Total em Aberto" value={formatCurrency(stats.totalAberto)} icon={<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-rose-50 dark:bg-rose-950/30" />
                <KpiCard title="Total Liquidado" value={formatCurrency(stats.totalPago)} icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-emerald-50 dark:bg-emerald-950/30" />
                <KpiCard title="Total Registros" value={invoices.length.toString()} icon={<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5" /></svg>} colorClass="bg-blue-50 dark:bg-blue-950/30" />
                <KpiCard title="Pendências" value={invoices.filter(i => i.situacao === Situacao.NAO_PAGO && !i.pgto).length.toString()} icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" /></svg>} colorClass="bg-amber-50 dark:bg-amber-950/30" />
              </div>
              <ReminderSection invoices={invoices} />
              <DashboardView invoices={invoices.filter(i => i.situacao !== Situacao.CANCELADO)} theme={theme} />
              <div className="bg-indigo-900 rounded-[1.2rem] lg:rounded-[2rem] p-6 lg:p-10 text-white relative overflow-hidden shadow-2xl transition-all hover:shadow-indigo-500/10">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v5.59l-2.71 2.7a1 1 0 0 0 1.42 1.42l3-3A1 1 0 0 0 13 13V7a1 1 0 0 0-1-1z"/></svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-indigo-500 p-2.5 rounded-2xl shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <div>
                      <h3 className="text-lg lg:text-2xl font-black tracking-tight">Resumo Executivo & Governança</h3>
                      <p className="text-indigo-300 text-[10px] lg:text-xs font-bold uppercase tracking-widest">Análise de Inteligência Artificial Gemini</p>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none text-indigo-100 text-xs sm:text-sm lg:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {aiInsight || "Aguardando análise de dados em tempo real..."}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentView === 'invoices' && (
            <div className="animate-in fade-in duration-500 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Gestão de Notas</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Controle Financeiro de Recebíveis</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {currentUser?.role === UserRole.ADMIN && (
                    <button 
                      onClick={handleDeleteAllInvoices} 
                      className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Limpar Base
                    </button>
                  )}
                  {canWrite && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingInvoice(null); setIsManualModalOpen(true); }} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        Novo Lançamento
                      </button>
                      {isAiEnabled && (
                        <button onClick={() => setIsImportModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          Importar IA
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <section className="bg-white dark:bg-slate-900 p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 no-print space-y-4 transition-colors">
                <div className="flex justify-between items-center gap-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Filtros Avançados</h3>
                  <button onClick={() => setFilters({ secretaria: '', fornecedor: '', situacao: '', startDate: '', endDate: '' })} className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase hover:underline">Limpar</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Secretaria</label>
                    <input placeholder="Busca..." className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" value={filters.secretaria} onChange={(e) => setFilters(prev => ({...prev, secretaria: e.target.value}))} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Fornecedor</label>
                    <input placeholder="Busca..." className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" value={filters.fornecedor} onChange={(e) => setFilters(prev => ({...prev, fornecedor: e.target.value}))} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Situação</label>
                    <select className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all" value={filters.situacao} onChange={(e) => setFilters(prev => ({...prev, situacao: e.target.value}))}>
                      <option value="">Todas</option>
                      <option value={Situacao.PAGO}>PAGO</option>
                      <option value={Situacao.NAO_PAGO}>NÃO PAGO</option>
                      <option value={Situacao.CANCELADO}>CANCELADO</option>
                    </select>
                  </div>
                </div>
              </section>
              
              <InvoiceTable 
                invoices={filteredInvoices} 
                onDelete={handleDeleteInvoice} 
                onToggleStatus={handleToggleStatus} 
                onSelectInvoice={setSelectedInvoice} 
                onEditInvoice={(inv) => { setEditingInvoice(inv); setIsManualModalOpen(true); }}
                currentUser={currentUser}
                theme={theme}
              />
            </div>
          )}

          {currentView === 'suppliers' && (
            <div className="max-w-7xl mx-auto">
              <SupplierManagementView 
                suppliers={suppliers} 
                onAddSupplier={() => { setEditingSupplier(null); setIsSupplierModalOpen(true); }}
                onEditSupplier={(s) => { setEditingSupplier(s); setIsSupplierModalOpen(true); }}
                onDeleteSupplier={handleDeleteSupplier}
                currentUser={currentUser}
                theme={theme}
              />
            </div>
          )}
          
          {currentView === 'users' && <div className="max-w-7xl mx-auto"><UserManagementView users={users} onAddUser={() => { setEditingUser(null); setIsUserModalOpen(true); }} onEditUser={(u) => { setEditingUser(u); setIsUserModalOpen(true); }} onDeleteUser={handleDeleteUser} currentUser={currentUser} theme={theme} /></div>}
          {currentView === 'logs' && <div className="max-w-7xl mx-auto"><ErrorLogsView theme={theme} /></div>}
          {currentView === 'settings' && <div className="max-w-4xl mx-auto"><SettingsView settings={settings} onSave={handleSaveSettings} theme={theme} /></div>}
          {currentView === 'profile' && currentUser && <div className="max-w-4xl mx-auto"><ProfileView user={currentUser} onSave={handleSaveUser} onToast={addToast} theme={theme} /></div>}
        </main>
      </div>

      {/* Floating Action Button (FAB) for Invoices View */}
      {currentView === 'invoices' && canWrite && (
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-3 no-print">
          {isFabOpen && (
            <div className="flex flex-col items-end gap-3 mb-3 animate-in slide-in-from-bottom-5 duration-300">
              <button 
                onClick={() => { setEditingInvoice(null); setIsManualModalOpen(true); setIsFabOpen(false); }}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 group"
              >
                <span className="text-xs font-black uppercase tracking-widest">Manual</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                </div>
              </button>
              {isAiEnabled && (
                <button 
                  onClick={() => { setIsImportModalOpen(true); setIsFabOpen(false); }}
                  className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all hover:scale-105 active:scale-95 group"
                >
                  <span className="text-xs font-black uppercase tracking-widest">Importar IA</span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                </button>
              )}
            </div>
          )}
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isFabOpen ? 'rotate-45 bg-slate-900 dark:bg-slate-800' : ''}`}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      )}
      
      <Toast toasts={toasts} onRemove={removeToast} />
      {isImportModalOpen && <ImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleImport} onToast={addToast} userEmail={currentUser?.email || 'Sistema'} theme={theme} isAiEnabled={isAiEnabled} />}
      {isManualModalOpen && <ManualEntryModal invoice={editingInvoice} onClose={() => { setIsManualModalOpen(false); setEditingInvoice(null); }} onSave={handleSaveManual} onToast={addToast} theme={theme} />}
      {isUserModalOpen && <UserModal user={editingUser} onClose={() => { setIsUserModalOpen(false); setEditingUser(null); }} onSave={handleSaveUser} onToast={addToast} theme={theme} />}
      {isSupplierModalOpen && <SupplierModal supplier={editingSupplier} onClose={() => { setIsSupplierModalOpen(false); setEditingSupplier(null); }} onSave={handleSaveSupplier} theme={theme} />}
      <InvoiceDetailsPanel invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} theme={theme} />
    </div>
  );
};

export default App;
