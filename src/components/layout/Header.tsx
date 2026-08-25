import React, { useState, useRef, useEffect } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { NotificationCenter } from './NotificationCenter';
import { Bell, Building2 } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    municipio,
    alertas,
    markAlertaLido,
  } = usePNAE();

  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const alertsMenuRef = useRef<HTMLDivElement>(null);

  const unreadAlerts = alertas.filter(a => !a.lido);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsMenuRef.current && !alertsMenuRef.current.contains(event.target as Node)) {
        setShowAlertsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Ações */}
          <div className="flex items-center gap-3">

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

          </div>

        </div>
      </div>
    </header>
  );
};
