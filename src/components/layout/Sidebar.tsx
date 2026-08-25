import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { SidebarQuickChat } from '../common/SidebarQuickChat';
import { 
  LayoutDashboard, 
  Utensils, 
  Carrot, 
  Calculator, 
  FileText, 
  Truck, 
  Package, 
  School, 
  Users, 
  FileCheck, 
  Sparkles,
  ClipboardList,
  Scale,
  Database,
  History,
  Tractor,
  DollarSign,
  Settings,
  Building2,
  MessageSquare,
  ExternalLink,
  Globe
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export const Sidebar: React.FC = () => {
  const { currentRole, activeTab, setActiveTab, chamadasPublicas, entregas, cardapios } = usePNAE();

  const openCallsCount = chamadasPublicas.filter(c => c.status === 'Publicada' || c.status === 'Em Análise de Propostas').length;
  const transitDeliveriesCount = entregas.length;
  const activeMenusCount = cardapios.length;

  const getMenuItems = (): MenuItem[] => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Painel Geral Gestor', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'chamadas-publicas', label: 'Chamadas Públicas (AF)', icon: <FileText className="w-4 h-4" />, badge: openCallsCount },
          { id: 'cardapios', label: 'Cardápios Homologados', icon: <Utensils className="w-4 h-4" />, badge: activeMenusCount },
          { id: 'escolas', label: 'Escolas e Município', icon: <School className="w-4 h-4" /> },
          { id: 'usuarios', label: 'Usuários e Perfis', icon: <Users className="w-4 h-4" /> },
          { id: 'prestacao-contas', label: 'Prestação de Contas', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'relatorios', label: 'Relatórios Físico-Financeiros', icon: <ClipboardList className="w-4 h-4" /> },
          { id: 'configuracoes', label: 'Configurações (Órgão Gestor)', icon: <Settings className="w-4 h-4" /> },
          { id: 'sql-migration', label: 'Schema SQL Supabase', icon: <Database className="w-4 h-4" /> },
          { id: 'auditoria', label: 'Logs de Auditoria', icon: <History className="w-4 h-4" /> },
        ];

      case 'NUTRICIONISTA':
        return [
          { id: 'dashboard', label: 'Painel Nutricional', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'cardapios', label: 'Gestão de Cardápios', icon: <Utensils className="w-4 h-4" />, badge: activeMenusCount },
          { id: 'alimentos', label: 'Catálogo de Alimentos (TACO)', icon: <Carrot className="w-4 h-4" /> },
          { id: 'projecao-compras', label: 'Projeção de Compras', icon: <Calculator className="w-4 h-4" /> },
          { id: 'ai-nutri-assist', label: 'Nutri Assistente IA', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'relatorios-nutricionais', label: 'Relatórios de Composição', icon: <ClipboardList className="w-4 h-4" /> },
        ];

      case 'ESCOLA':
        return [
          { id: 'dashboard', label: 'Painel da Unidade Escolar', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'cardapio-escola', label: 'Cardápio Programado', icon: <Utensils className="w-4 h-4" /> },
          { id: 'entregas-recebimento', label: 'Recebimento de Mercadorias', icon: <Truck className="w-4 h-4" />, badge: 'AF' },
          { id: 'estoque-despensa', label: 'Estoque e Despensa', icon: <Package className="w-4 h-4" /> },
          { id: 'relatorios-consumo', label: 'Consumo e Refeições', icon: <ClipboardList className="w-4 h-4" /> },
        ];

      case 'FORNECEDOR':
        return [
          { id: 'dashboard', label: 'Meu Painel de Agricultor', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'chamadas-abertas', label: 'Chamadas Públicas Abertas', icon: <FileText className="w-4 h-4" />, badge: openCallsCount },
          { id: 'meus-projetos', label: 'Meus Projetos e Propostas', icon: <Tractor className="w-4 h-4" /> },
          { id: 'meus-contratos', label: 'Contratos e AFs Emitidas', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'minhas-entregas', label: 'Entregas Agendadas', icon: <Truck className="w-4 h-4" /> },
        ];

      case 'CAE':
        return [
          { id: 'dashboard', label: 'Painel Geral do CAE', icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: 'compras-agricultura', label: 'Verificação dos 30% da AF', icon: <Tractor className="w-4 h-4" /> },
          { id: 'fiscalizacao-escolas', label: 'Vistorias nas Escolas', icon: <School className="w-4 h-4" /> },
          { id: 'colegiado-atas', label: 'Colegiado & Atas', icon: <Users className="w-4 h-4" /> },
          { id: 'parecer-conclusivo', label: 'Emissão de Parecer CAE', icon: <Scale className="w-4 h-4" /> },
          { id: 'ouvidoria-comunidade', label: 'Ouvidoria da Merenda', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'prestacao-contas', label: 'Prestação de Contas PNAE', icon: <FileCheck className="w-4 h-4" /> },
          { id: 'orgao-config', label: 'Dados do Órgão Gestor', icon: <Building2 className="w-4 h-4" /> },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-stone-50/80 border-r border-stone-200 min-h-[calc(100vh-4rem)] p-4 shrink-0 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-stone-400">
          Navegação Principal
        </div>
        {menuItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                  : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-stone-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div>
        {/* Box de Informações Legais PNAE */}
        <div className="mt-8 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
            <Scale className="w-3.5 h-3.5 text-emerald-700" />
            <span>Lei Federal 11.947/09</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-snug">
            Mínimo de <strong>30%</strong> dos recursos do FNDE destinados à Agricultura Familiar local. Limite de R$ 40 mil/ano por DAP/CAF.
          </p>
        </div>

        {/* Chat Rápido com IA */}
        <SidebarQuickChat />
      </div>
    </aside>
  );
};
