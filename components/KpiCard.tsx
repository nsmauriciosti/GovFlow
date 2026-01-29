
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  colorClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend, colorClass }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">{value}</h3>
        {trend && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} transition-colors`}>
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
