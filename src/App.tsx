import React from 'react';
import { PNAEProvider, usePNAE } from './context/PNAEContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AuthView } from './components/auth/AuthView';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChamadasPublicasAdmin } from './components/admin/ChamadasPublicasAdmin';
import { EscolasManager } from './components/admin/EscolasManager';
import { UsuariosManager } from './components/admin/UsuariosManager';
import { PrestacaoContasAdmin } from './components/admin/PrestacaoContasAdmin';
import { RelatoriosAdmin } from './components/admin/RelatoriosAdmin';
import { SqlMigrationViewer } from './components/admin/SqlMigrationViewer';
import { AuditoriaView } from './components/admin/AuditoriaView';
import { ConfiguracoesOrgaoGestor } from './components/admin/ConfiguracoesOrgaoGestor';

// Nutricionista Components
import { NutriDashboard } from './components/nutricionista/NutriDashboard';
import { CardapiosView } from './components/nutricionista/CardapiosView';
import { CatalogoAlimentos } from './components/nutricionista/CatalogoAlimentos';
import { ProjecaoCompras } from './components/nutricionista/ProjecaoCompras';
import { AiCardapioGenerator } from './components/nutricionista/AiCardapioGenerator';

// Escola Components
import { EscolaDashboard } from './components/escola/EscolaDashboard';
import { EstoqueEscolaView } from './components/escola/EstoqueEscolaView';

// Fornecedor Components
import { FornecedorDashboard } from './components/fornecedor/FornecedorDashboard';

// CAE Components
import { CaeDashboard } from './components/cae/CaeDashboard';
import { CaeComprasAgricultura } from './components/cae/CaeComprasAgricultura';
import { CaeFiscalizacaoEscolas } from './components/cae/CaeFiscalizacaoEscolas';
import { CaeParecerConclusivo } from './components/cae/CaeParecerConclusivo';
import { CaeColegiadoAtas } from './components/cae/CaeColegiadoAtas';
import { CaeOuvidoriaSocial } from './components/cae/CaeOuvidoriaSocial';

import { NotificationToastContainer } from './components/common/NotificationToastContainer';

const AppContent: React.FC = () => {
  const { isAuthenticated, currentRole, activeTab } = usePNAE();

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const renderActiveView = () => {
    // Rotas do Admin
    if (currentRole === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'chamadas-publicas': return <ChamadasPublicasAdmin />;
        case 'escolas': return <EscolasManager />;
        case 'usuarios': return <UsuariosManager />;
        case 'prestacao-contas': return <PrestacaoContasAdmin />;
        case 'relatorios': return <RelatoriosAdmin />;
        case 'configuracoes': return <ConfiguracoesOrgaoGestor />;
        case 'cae': return <CaeDashboard />;
        case 'sql-migration': return <SqlMigrationViewer />;
        case 'auditoria': return <AuditoriaView />;
        default: return <AdminDashboard />;
      }
    }

    // Rotas da Nutricionista
    if (currentRole === 'NUTRICIONISTA') {
      switch (activeTab) {
        case 'dashboard': return <NutriDashboard />;
        case 'cardapios': return <CardapiosView />;
        case 'alimentos': return <CatalogoAlimentos />;
        case 'projecao-compras': return <ProjecaoCompras />;
        case 'ai-nutri-assist': return <AiCardapioGenerator />;
        case 'sql-migration': return <SqlMigrationViewer />;
        default: return <NutriDashboard />;
      }
    }

    // Rotas da Escola
    if (currentRole === 'ESCOLA') {
      switch (activeTab) {
        case 'dashboard': return <EscolaDashboard />;
        case 'estoque-escola': return <EstoqueEscolaView />;
        case 'relatorios': return <RelatoriosAdmin />;
        case 'sql-migration': return <SqlMigrationViewer />;
        default: return <EscolaDashboard />;
      }
    }

    // Rotas do Fornecedor / Produtor Rural
    if (currentRole === 'FORNECEDOR') {
      switch (activeTab) {
        case 'dashboard': return <FornecedorDashboard />;
        case 'chamadas-publicas': return <FornecedorDashboard />;
        case 'sql-migration': return <SqlMigrationViewer />;
        default: return <FornecedorDashboard />;
      }
    }

    // Rotas do Conselho CAE
    if (currentRole === 'CAE') {
      switch (activeTab) {
        case 'dashboard': return <CaeDashboard initialTab="geral" />;
        case 'compras-agricultura': return <CaeComprasAgricultura />;
        case 'fiscalizacao-escolas': return <CaeFiscalizacaoEscolas />;
        case 'colegiado-atas': return <CaeColegiadoAtas />;
        case 'parecer-conclusivo': return <CaeParecerConclusivo />;
        case 'ouvidoria-comunidade': return <CaeOuvidoriaSocial />;
        case 'prestacao-contas': return <PrestacaoContasAdmin />;
        case 'orgao-config': return <ConfiguracoesOrgaoGestor />;
        case 'relatorios': return <RelatoriosAdmin />;
        case 'sql-migration': return <SqlMigrationViewer />;
        default: return <CaeDashboard />;
      }
    }

    return <AdminDashboard />;
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col antialiased text-stone-900 font-sans">
      <Header />
      
      <div className="flex flex-1 w-full">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Real-time Toast Notifications */}
      <NotificationToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PNAEProvider>
      <AppContent />
    </PNAEProvider>
  );
}
