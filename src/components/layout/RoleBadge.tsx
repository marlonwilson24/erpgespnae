import React from 'react';
import { UserRole } from '../../types';
import { Shield, Apple, School, Tractor, Scale } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true, size = 'md' }) => {
  const configs: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
    ADMIN: {
      label: 'Gestor Municipal (ADMIN)',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      icon: <Shield className="w-3.5 h-3.5" />,
    },
    NUTRICIONISTA: {
      label: 'Nutricionista RT',
      color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
      icon: <Apple className="w-3.5 h-3.5" />,
    },
    ESCOLA: {
      label: 'Unidade Escolar',
      color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      icon: <School className="w-3.5 h-3.5" />,
    },
    FORNECEDOR: {
      label: 'Agricultor Familiar (DAP/CAF)',
      color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      icon: <Tractor className="w-3.5 h-3.5" />,
    },
    CAE: {
      label: 'Conselho CAE (Fiscalizador)',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
      icon: <Scale className="w-3.5 h-3.5" />,
    },
  };

  const config = configs[role] || configs.ADMIN;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses[size]} transition-all`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
