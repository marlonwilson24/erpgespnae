import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  badgeText?: string;
  badgeColor?: 'green' | 'blue' | 'amber' | 'purple' | 'red';
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badgeText,
  badgeColor = 'green',
  onClick,
}) => {
  const badgeClasses = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-stone-700">
          {icon}
        </div>
      </div>

      {(subtitle || trend || badgeText) && (
        <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
          {subtitle && <p className="text-stone-500 truncate">{subtitle}</p>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {trend.value} <span className="text-stone-400 font-normal">{trend.label}</span>
            </span>
          )}
          {badgeText && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClasses[badgeColor]}`}>
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
