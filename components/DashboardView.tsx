
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Invoice, DashboardStats, Situacao } from '../types';
import { formatCurrency } from '../utils';

interface DashboardViewProps {
  invoices: Invoice[];
}

const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

const DashboardView: React.FC<DashboardViewProps> = ({ invoices }) => {
  const stats = useMemo((): DashboardStats => {
    // Explicitly type reduce accumulators to resolve arithmetic operation errors
    const totalAberto = invoices
      .filter(i => i.situacao === Situacao.NAO_PAGO)
      .reduce((sum: number, i: Invoice) => sum + i.valor, 0);

    const totalPago = invoices
      .filter(i => i.situacao === Situacao.PAGO)
      .reduce((sum: number, i: Invoice) => sum + i.valor, 0);

    // Top Fornecedores - Ensure record values are typed as number
    const fornecedorMap = invoices.reduce((acc: Record<string, number>, i: Invoice) => {
      acc[i.fornecedor] = (acc[i.fornecedor] || 0) + i.valor;
      return acc;
    }, {} as Record<string, number>);

    // Cast value as number to fix unknown type assignment errors
    const topFornecedores = Object.entries(fornecedorMap)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Distribuição por Secretaria
    const totalGlobal = totalAberto + totalPago;
    const secretariaMap = invoices.reduce((acc: Record<string, number>, i: Invoice) => {
      acc[i.secretaria] = (acc[i.secretaria] || 0) + i.valor;
      return acc;
    }, {} as Record<string, number>);

    // Fix for unknown type assignment by casting map value to number
    const distribuicaoSecretaria = Object.entries(secretariaMap).map(([name, value]) => {
      const val = value as number;
      return {
        name,
        value: val,
        percentage: totalGlobal > 0 ? (val / totalGlobal) * 100 : 0
      };
    });

    return { totalAberto, totalPago, topFornecedores, distribuicaoSecretaria };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-6">Top 5 Fornecedores (Volume Financeiro)</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topFornecedores} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fontSize: 12, fill: '#64748b' }} 
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h4 className="text-lg font-bold text-slate-800 mb-6">Distribuição por Secretaria</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.distribuicaoSecretaria}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.distribuicaoSecretaria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {stats.distribuicaoSecretaria.slice(0, 4).map((sec, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
              <span className="text-slate-600 font-medium truncate pr-2">{sec.name}</span>
              <span className="text-slate-900 font-bold">{sec.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
