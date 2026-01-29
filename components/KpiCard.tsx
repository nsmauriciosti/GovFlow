
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
    <div className="bg-white dark:bg-slate-900 rounded-[1.2rem] lg:rounded-xl shadow-sm p-4 lg:p-6 border border-slate-100 dark:border-slate-800 flex items-start justify-between transition-colors">
      <div className="min-w-0">
        <p className="text-[10px] lg:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">{title}</p>
        <h3 className="text-lg lg:text-2xl font-black mt-1 lg:mt-2 text-slate-900 dark:text-slate-100 truncate">{value}</h3>
        {trend && (
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {trend}
          </p>
        )}
      </div>
      <div className={`p-2 lg:p-3 rounded-xl shrink-0 ${colorClass} transition-colors ml-2`}>
        {icon}
      </div>
    </div>
  );
};

export default KpiCard;
