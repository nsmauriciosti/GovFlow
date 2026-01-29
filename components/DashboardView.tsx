
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Invoice, DashboardStats, Situacao } from '../types';
import { formatCurrency } from '../utils';

interface DashboardViewProps {
  invoices: Invoice[];
  theme: 'light' | 'dark';
}

const COLORS = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

const DashboardView: React.FC<DashboardViewProps> = ({ invoices, theme }) => {
  const stats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.situacao === Situacao.PAGO);
    const totalPago = paidInvoices.reduce((sum: number, i: Invoice) => sum + i.valor, 0);
    const countPago = paidInvoices.length;

    const totalAberto = invoices
      .filter(i => i.situacao === Situacao.NAO_PAGO)
      .reduce((sum: number, i: Invoice) => sum + i.valor, 0);

    const fornecedorMap = invoices.reduce((acc: Record<string, number>, i: Invoice) => {
      acc[i.fornecedor] = (acc[i.fornecedor] || 0) + i.valor;
      return acc;
    }, {} as Record<string, number>);

    const topFornecedores = Object.entries(fornecedorMap)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const totalGlobal = totalAberto + totalPago;
    const secretariaMap = invoices.reduce((acc: Record<string, number>, i: Invoice) => {
      acc[i.secretaria] = (acc[i.secretaria] || 0) + i.valor;
      return acc;
    }, {} as Record<string, number>);

    const distribuicaoSecretaria = Object.entries(secretariaMap).map(([name, value]) => {
      const val = value as number;
      return {
        name,
        value: val,
        percentage: totalGlobal > 0 ? (val / totalGlobal) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);

    return { totalAberto, totalPago, countPago, topFornecedores, distribuicaoSecretaria };
  }, [invoices]);

  const textColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';
  const tooltipBg = theme === 'dark' ? '#0f172a' : '#ffffff';

  return (
    <div className="space-y-6 mt-6">
      {/* Mini KPI Section for Specific Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-600 dark:bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-between transition-all hover:scale-[1.01]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Notas Liquidadas (PAGO)</p>
            <h4 className="text-3xl font-black">{stats.countPago} <span className="text-xs font-bold opacity-70">registros</span></h4>
            <p className="text-xs font-bold mt-2 bg-emerald-500/30 px-2 py-1 rounded-lg inline-block">
              Volume Financeiro: {formatCurrency(stats.totalPago)}
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between transition-colors">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Eficiência de Liquidação</p>
            <h4 className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {invoices.length > 0 ? ((stats.countPago / invoices.length) * 100).toFixed(1) : 0}%
            </h4>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
               <div 
                 className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                 style={{ width: `${invoices.length > 0 ? (stats.countPago / invoices.length) * 100 : 0}%` }}
               ></div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl transition-colors">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
            <h4 className="text-sm lg:text-base font-bold text-slate-800 dark:text-slate-100">Top 5 Fornecedores</h4>
          </div>
          <div className="h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topFornecedores} layout="vertical" margin={{ left: 0, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 9, fill: textColor, fontWeight: 700 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc' }}
                  formatter={(value: number) => [formatCurrency(value), 'Volume']}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    backgroundColor: tooltipBg,
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '8px',
                    fontSize: '11px',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            <h4 className="text-sm lg:text-base font-bold text-slate-800 dark:text-slate-100">Distribuição por Secretaria</h4>
          </div>
          <div className="h-[250px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.distribuicaoSecretaria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.distribuicaoSecretaria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    backgroundColor: tooltipBg,
                    border: 'none', 
                    fontSize: '11px',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats.distribuicaoSecretaria.slice(0, 4).map((sec, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px] lg:text-[10px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-600 dark:text-slate-400 font-bold truncate">{sec.name}</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-black ml-1">{sec.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
