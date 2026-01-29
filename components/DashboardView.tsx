
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

// Paleta moderna e leve: Indigo, Emerald, Cyan, Violet, Amber, Pink
const COLORS = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899'];

const DashboardView: React.FC<DashboardViewProps> = ({ invoices }) => {
  const stats = useMemo((): DashboardStats => {
    const totalAberto = invoices
      .filter(i => i.situacao === Situacao.NAO_PAGO)
      .reduce((sum: number, i: Invoice) => sum + i.valor, 0);

    const totalPago = invoices
      .filter(i => i.situacao === Situacao.PAGO)
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
    });

    return { totalAberto, totalPago, topFornecedores, distribuicaoSecretaria };
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
          <h4 className="text-lg font-bold text-slate-800">Top 5 Fornecedores</h4>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topFornecedores} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: number) => [formatCurrency(value), 'Volume Total']}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#6366f1" 
                radius={[0, 12, 12, 0]} 
                barSize={20} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
          <h4 className="text-lg font-bold text-slate-800">Distribuição por Secretaria</h4>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.distribuicaoSecretaria}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {stats.distribuicaoSecretaria.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {stats.distribuicaoSecretaria.slice(0, 4).map((sec, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px] p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-slate-600 font-bold truncate">{sec.name}</span>
              </div>
              <span className="text-indigo-600 font-black ml-2">{sec.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
