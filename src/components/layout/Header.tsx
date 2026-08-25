import React, { useState, useRef, useEffect } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { RoleBadge } from './RoleBadge';
import { UserRole } from '../../types';
import { NotificationCenter } from './NotificationCenter';
import { 
  Bell, 
  RotateCcw, 
  LogOut, 
  ChevronDown, 
  Building2, 
  Layers,
  Database,
  Volume2,
  VolumeX,
  Settings,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    currentRole, 
    municipio, 
    alertas, 
    markAlertaLido, 
    switchRole, 
    logout, 
    resetToMockData,
    setActiveTab,
  } = usePNAE();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const alertsMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const unreadAlerts = alertas.filter(a => !a.lido);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(event.target as Node)) {
        setShowAlertsMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const rolesList: { role: UserRole; title: string; desc: string }[] = [
    { role: 'ADMIN', title: '1. Gestor Municipal / ADMIN', desc: 'KPIs gerais, aprovações, gestão de contratos e escolas' },
    { role: 'NUTRICIONISTA', title: '2. Nutricionista RT', desc: 'Cardápios, cálculo nutricional, projeção de compras' },
    { role: 'ESCOLA', title: '3. Diretora da Escola', desc: 'Recebimento de entregas (AF), despensa e estoque' },
    { role: 'FORNECEDOR', title: '4. Agricultor Familiar', desc: 'DAP/CAF R$ 40k, chamadas abertas e propostas de venda' },
    { role: 'CAE', title: '5. Conselho CAE', desc: 'Fiscalização, controle social e emissão de parecer' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Município */}
          <div className="flex items-center gap-3">
            {municipio.logo1 ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-stone-200 p-1 shadow-xs shrink-0 overflow-hidden">
                <img src={municipio.logo1} alt="Logo Oficial" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-xs font-bold text-lg">
                PN
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900 tracking-tight">ERP PNAE</h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">Lei 11.947/09</span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-stone-400" />
                <span>{municipio.nome} - {municipio.uf}</span>
                <span className="text-stone-300">•</span>
                <span>Exercício {municipio.anoExercicio}</span>
              </p>
            </div>
          </div>

          {/* Quick Role Switcher Bar */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-stone-500 font-medium px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Perfil:
            </span>
            {(['ADMIN', 'NUTRICIONISTA', 'ESCOLA', 'FORNECEDOR', 'CAE'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  currentRole === role
                    ? 'bg-white text-emerald-800 shadow-xs font-semibold border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {role === 'ADMIN' ? 'Gestor' : role === 'NUTRICIONISTA' ? 'Nutricionista' : role === 'ESCOLA' ? 'Escola' : role === 'FORNECEDOR' ? 'Produtor' : 'CAE'}
              </button>
            ))}
          </div>

          {/* Actions & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Botão Schema Supabase */}
            <button
              onClick={() => setActiveTab('sql-migration')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition"
              title="Visualizar Schema SQL e Migrações do Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQL Supabase</span>
            </button>

            {/* Notificações em Tempo Real */}
            <div className="relative" ref={alertsMenuRef}>
              <button
                onClick={() => setShowAlertsMenu(!showAlertsMenu)}
                className={`relative p-2 rounded-xl border transition ${
                  showAlertsMenu
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
                aria-label="Notificações em tempo real"
                title="Central de Notificações em Tempo Real"
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadAlerts.length > 9 ? '9+' : unreadAlerts.length}
                  </span>
                )}
              </button>

              {showAlertsMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-[420px] z-50">
                  <NotificationCenter onClose={() => setShowAlertsMenu(false)} />
                </div>
              )}
            </div>

            {/* Menu Usuário / Role Selector Mobile */}
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-stone-100 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-semibold flex items-center justify-center text-xs">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-stone-900 leading-tight truncate max-w-[140px]">
                    {currentUser?.name}
                  </p>
                  <p className="text-[10px] text-stone-500">{currentUser?.cargo || currentUser?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-stone-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 p-3 z-50">
                  <div className="pb-2 mb-2 border-b border-stone-100">
                    <p className="text-xs font-bold text-stone-900">{currentUser?.name}</p>
                    <p className="text-[11px] text-stone-500">{currentUser?.email}</p>
                    <div className="mt-2">
                      <RoleBadge role={currentRole} />
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">
                    Simular outro Perfil
                  </p>

                  <div className="space-y-1">
                    {rolesList.map(r => (
                      <button
                        key={r.role}
                        onClick={() => {
                          switchRole(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition flex flex-col ${
                          currentRole === r.role
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span>{r.title}</span>
                        <span className="text-[10px] text-stone-500 font-normal">{r.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 mt-2 border-t border-stone-100 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('configuracoes');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Configurações do Órgão Gestor</span>
                    </button>
                    <button
                      onClick={() => {
                        resetToMockData();
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-stone-600 hover:bg-stone-100 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Dados Padrão</span>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair do Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
