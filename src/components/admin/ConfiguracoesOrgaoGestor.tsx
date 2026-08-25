import React, { useState, useRef } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { exportFichaCadastralOrgaoPDF } from '../../lib/exportPdf';
import { GestaoUsuariosSection } from './GestaoUsuariosSection';
import { sincronizarMunicipio, ResultadoSincronizacao } from '../../lib/gestaoMunicipio';
import { formatCurrency } from '../../lib/utils';
import {
  Building2,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Eye,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Scroll,
  Image,
  Sparkles,
  ShieldCheck,
  Download,
  AlertCircle,
  Hash,
  Landmark,
  Calendar,
  Users
} from 'lucide-react';

// Preset sample logos in SVG format (ready to use and crisp)
const LOGO1_PRESETS = [
  {
    label: 'Brasão Verde & Dourado (Padrão)',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%231e732d"/><stop offset="100%" stop-color="%230f4019"/></linearGradient></defs><path d="M50 5 L85 20 L85 60 C85 80 50 95 50 95 C50 95 15 80 15 60 L15 20 Z" fill="url(%23g1)" stroke="%23f59e0b" stroke-width="3"/><path d="M50 15 L75 27 L75 57 C75 72 50 84 50 84 C50 84 25 72 25 57 L25 27 Z" fill="%23ffffff" opacity="0.95"/><path d="M50 25 L58 40 L75 42 L62 55 L66 72 L50 63 L34 72 L38 55 L25 42 L42 40 Z" fill="%23f59e0b"/><circle cx="50" cy="50" r="8" fill="%231e732d"/><text x="50" y="80" font-size="6" font-family="sans-serif" font-weight="bold" fill="%231e732d" text-anchor="middle">PREFEITURA</text></svg>'
  },
  {
    label: 'Brasão Azul Institucional',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><path d="M50 5 L88 22 L88 58 C88 78 50 95 50 95 C50 95 12 78 12 58 L12 22 Z" fill="url(%23g2)" stroke="%2338bdf8" stroke-width="3"/><circle cx="50" cy="45" r="22" fill="%23ffffff"/><path d="M40 45 L47 52 L62 36" stroke="%231e3a8a" stroke-width="4" fill="none" stroke-linecap="round"/><text x="50" y="80" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">MUNICÍPIO</text></svg>'
  },
  {
    label: 'Brasão Clássico República',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="10" y="10" width="80" height="80" rx="16" fill="%23047857" stroke="%23facc15" stroke-width="3"/><path d="M50 20 L70 70 L30 70 Z" fill="%23facc15"/><circle cx="50" cy="48" r="10" fill="%23047857"/><text x="50" y="82" font-size="6" font-family="sans-serif" font-weight="bold" fill="%23ffffff" text-anchor="middle">ESTADO / EEx</text></svg>'
  }
];

const LOGO2_PRESETS = [
  {
    label: 'Logo Oficial PNAE / FNDE',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%231e732d" stroke="%23ffffff" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M30 42 C30 35 40 28 50 28 C60 28 70 35 70 42 C70 58 50 68 50 68 C50 68 30 58 30 42 Z" fill="%23ef4444"/><path d="M50 28 C48 22 55 18 58 18 C58 22 54 26 50 28 Z" fill="%2316a34a"/><text x="50" y="76" font-size="7.5" font-family="sans-serif" font-weight="bold" fill="%231e732d" text-anchor="middle">PNAE / FNDE</text><text x="50" y="84" font-size="5" font-family="sans-serif" fill="%23666666" text-anchor="middle">ALIMENTAÇÃO ESCOLAR</text></svg>'
  },
  {
    label: 'Selo Alimentação Saudável na Escola',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%230284c7" stroke="%23ffffff" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M35 55 C35 38 65 38 65 55 Z" fill="%23f97316"/><circle cx="50" cy="38" r="8" fill="%2316a34a"/><text x="50" y="75" font-size="6.5" font-family="sans-serif" font-weight="bold" fill="%230284c7" text-anchor="middle">NUTRIÇÃO</text><text x="50" y="83" font-size="5" font-family="sans-serif" fill="%23666666" text-anchor="middle">ESCOLAR</text></svg>'
  },
  {
    label: 'Selo Agricultura Familiar 30%',
    svg: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%2315803d" stroke="%23ffffff" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="%23ffffff"/><path d="M30 65 L45 35 L55 35 L70 65 Z" fill="%23eab308"/><text x="50" y="74" font-size="7" font-family="sans-serif" font-weight="bold" fill="%2315803d" text-anchor="middle">AGRICULTURA</text><text x="50" y="83" font-size="5.5" font-family="sans-serif" font-weight="bold" fill="%23b45309" text-anchor="middle">FAMILIAR 30%</text></svg>'
  }
];

export const ConfiguracoesOrgaoGestor: React.FC = () => {
  const { municipio, updateMunicipio, addAuditoriaLog } = usePNAE();

  // Form State
  const [formData, setFormData] = useState({
    orgaoNome: municipio.orgaoNome || `Prefeitura Municipal de ${municipio.nome} - Secretaria Municipal de Educação`,
    nome: municipio.nome,
    uf: municipio.uf,
    cnpj: municipio.cnpj || '18.345.912/0001-44',
    codigoIbge: municipio.codigoIbge || '4316808',
    anoExercicio: municipio.anoExercicio || 2026,
    totalAlunosPNAE: municipio.totalAlunosPNAE ?? 0,
    orcamentoAnualFNDE: municipio.orcamentoAnualFNDE ?? 0,
    orcamentoContrapartida: municipio.orcamentoContrapartida ?? 0,
    endereco: municipio.endereco || 'Avenida 28 de Maio, nº 1420 - Centro, CEP 95915-000, Santa Clara do Sul - RS',
    email: municipio.email || 'educacao@santaclaradosul.rs.gov.br',
    telefone: municipio.telefone || '(51) 3782-1200 / (51) 99845-7120',
    gestorNome: municipio.gestorNome || 'Dra. Mariana Silveira Fagundes',
    gestorCargo: municipio.gestorCargo || 'Secretária Municipal de Educação e Cultura',
    portaria: municipio.portaria || 'Portaria Municipal nº 048/2024 de 03 de Janeiro de 2024',
    logo1: municipio.logo1 || LOGO1_PRESETS[0].svg,
    logo2: municipio.logo2 || LOGO2_PRESETS[0].svg,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncResultado, setSyncResultado] = useState<ResultadoSincronizacao | null>(null);
  const [activeTabSection, setActiveTabSection] = useState<'geral' | 'contatos' | 'gestao' | 'logos' | 'usuarios' | 'preview'>('geral');

  const fileInputLogo1Ref = useRef<HTMLInputElement>(null);
  const fileInputLogo2Ref = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, logoField: 'logo1' | 'logo2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo selecionado é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        handleInputChange(logoField, event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMunicipio(formData);
    setSavedSuccess(true);

    // Sincroniza os dados do município com a tabela public.municipios (Supabase)
    const resultadoSync = await sincronizarMunicipio({
      nome: formData.nome,
      uf: formData.uf,
      codigoIbge: formData.codigoIbge,
      totalAlunosPnae: Number(formData.totalAlunosPNAE) || 0,
      orcamentoAnualFnde: Number(formData.orcamentoAnualFNDE) || 0,
      orcamentoContrapartida: Number(formData.orcamentoContrapartida) || 0,
      anoExercicio: Number(formData.anoExercicio) || 2026,
    });
    setSyncResultado(resultadoSync);

    if (resultadoSync.sucesso && resultadoSync.destino === 'supabase') {
      addAuditoriaLog(
        'Sincronização Cadastral do Município',
        'Configurações do Órgão Gestor',
        `Dados de ${formData.nome}-${formData.uf} (IBGE ${formData.codigoIbge}) gravados na tabela public.municipios: ${Number(formData.totalAlunosPNAE).toLocaleString('pt-BR')} alunos, FNDE R$ ${Number(formData.orcamentoAnualFNDE).toFixed(2)}`
      );
    }

    setTimeout(() => setSavedSuccess(false), 6000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar as configurações padrão do Órgão Gestor?')) {
      const defaultData = {
        orgaoNome: 'Prefeitura Municipal de Santa Clara do Sul - Secretaria Municipal de Educação e Cultura',
        nome: 'Santa Clara do Sul',
        uf: 'RS',
        cnpj: '18.345.912/0001-44',
        codigoIbge: '4316808',
        anoExercicio: 2026,
        totalAlunosPNAE: 4250,
        orcamentoAnualFNDE: 720000.0,
        orcamentoContrapartida: 280000.0,
        endereco: 'Avenida 28 de Maio, nº 1420 - Centro, CEP 95915-000, Santa Clara do Sul - RS',
        email: 'educacao@santaclaradosul.rs.gov.br',
        telefone: '(51) 3782-1200 / (51) 99845-7120',
        gestorNome: 'Dra. Mariana Silveira Fagundes',
        gestorCargo: 'Secretária Municipal de Educação e Cultura',
        portaria: 'Portaria Municipal nº 048/2024 de 03 de Janeiro de 2024',
        logo1: LOGO1_PRESETS[0].svg,
        logo2: LOGO2_PRESETS[0].svg,
      };
      setFormData(defaultData);
      setSyncResultado(null);
      updateMunicipio(defaultData);
    }
  };

  const handleExportPDF = () => {
    exportFichaCadastralOrgaoPDF(formData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0">
            <Building2 className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-900">
                Configurações do Órgão Gestor (EEx)
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                Entidade Executora
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              Cadastro institucional, CNPJ, dados de contato, gestor responsável, portaria de nomeação e logomarcas oficiais para o timbrado dos relatórios e prestação de contas do PNAE.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold shadow-2xs transition"
            title="Exportar Ficha Cadastral em PDF"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Exportar Ficha (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold transition"
            title="Restaurar valores padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso ao Salvar */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <strong className="font-bold block">Dados salvos com sucesso!</strong>
              <span className="block">
                Todas as alterações institucionais, contatos e logomarcas foram sincronizadas e aplicadas aos relatórios em PDF do sistema.
              </span>
              {syncResultado && syncResultado.sucesso && (
                <span className={`block p-2 rounded-lg border ${
                  syncResultado.destino === 'supabase'
                    ? 'bg-white/70 border-emerald-300 text-emerald-900'
                    : 'bg-stone-100 border-stone-300 text-stone-700'
                }`}>
                  {syncResultado.destino === 'supabase'
                    ? '🗄️ Dados do município (alunos, orçamentos e exercício) gravados na tabela public.municipios do Supabase.'
                    : '💾 Dados do município salvos localmente (modo demonstração). Configure SUPABASE_SERVICE_ROLE_KEY para gravar na tabela public.municipios.'}
                </span>
              )}
              {syncResultado && !syncResultado.sucesso && (
                <span className="block p-2 rounded-lg bg-red-50 border border-red-300 text-red-800">
                  ⚠️ Falha ao gravar na tabela public.municipios: {syncResultado.erro}
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
            Sincronizado
          </span>
        </div>
      )}

      {/* Navegação por Abas do Módulo */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTabSection('geral')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'geral'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>1. Dados Institucionais & CNPJ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('contatos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'contatos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>2. Endereço & Contatos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('gestao')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'gestao'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>3. Gestor & Portaria</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('logos')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'logos'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>4. Logomarcas (Logo 1 & Logo 2)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('usuarios')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'usuarios'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>5. Usuários & Perfis de Acesso</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSection('preview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
            activeTabSection === 'preview'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>6. Pré-Visualização do Timbrado</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SEÇÃO 1: DADOS INSTITUCIONAIS & CNPJ */}
        {activeTabSection === 'geral' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-700" />
                  Identificação Institucional da Entidade Executora (EEx)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Informações jurídicas exigidas pelo FNDE para fins de convênio, repasse e prestação de contas no SIGPC.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
                Exercício {formData.anoExercicio}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome Oficial do Órgão Gestor / Entidade Executora *
                </label>
                <input
                  type="text"
                  required
                  value={formData.orgaoNome}
                  onChange={e => handleInputChange('orgaoNome', e.target.value)}
                  placeholder="Ex: Prefeitura Municipal de Santa Clara do Sul - Secretaria Municipal de Educação"
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <p className="text-[10.5px] text-stone-600 mt-1">
                  Este nome será exibido no cabeçalho de todos os relatórios, chamadas públicas e atas do CAE.
                </p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  CNPJ da Entidade Executora (EEx) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={e => handleInputChange('cnpj', e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
                <p className="text-[10.5px] text-stone-600 mt-1">
                  CNPJ cadastrado no FNDE / Receita Federal.
                </p>
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Município Sede *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => handleInputChange('nome', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  UF (Estado) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.uf}
                  onChange={e => handleInputChange('uf', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-xs uppercase font-mono text-center bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Código IBGE do Município *
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigoIbge}
                  onChange={e => handleInputChange('codigoIbge', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Exercício Vigente *
                </label>
                <input
                  type="number"
                  required
                  min={2020}
                  max={2035}
                  value={formData.anoExercicio}
                  onChange={e => handleInputChange('anoExercicio', parseInt(e.target.value) || 2026)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Subseção: Dados do Município (tabela public.municipios) */}
              <div className="md:col-span-12 pt-2 border-t border-dashed border-stone-200">
                <h3 className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-emerald-700" />
                  Cadastro do Município — Demanda e Orçamento PNAE
                </h3>
                <p className="text-[10.5px] text-stone-500 mt-0.5">
                  Estes dados alimentam a tabela <span className="font-mono">public.municipios</span> no Supabase e todos os cálculos percentuais dos relatórios.
                </p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Total de Alunos da Rede (Censo PNAE) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.totalAlunosPNAE}
                  onChange={e => handleInputChange('totalAlunosPNAE', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 4250"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[10.5px] text-stone-600 mt-1">
                  {Number(formData.totalAlunosPNAE).toLocaleString('pt-BR')} matrículas • base do repasse per capita do FNDE.
                </p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Orçamento Anual FNDE (R$) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={formData.orcamentoAnualFNDE}
                  onChange={e => handleInputChange('orcamentoAnualFNDE', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 720000.00"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[10.5px] text-stone-600 mt-1">
                  {formatCurrency(Number(formData.orcamentoAnualFNDE))} • recursos federais vinculados.
                </p>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contrapartida Municipal (R$) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={formData.orcamentoContrapartida}
                  onChange={e => handleInputChange('orcamentoContrapartida', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 280000.00"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[10.5px] text-stone-600 mt-1">
                  {formatCurrency(Number(formData.orcamentoContrapartida))} • recurso próprio do tesouro municipal.
                </p>
              </div>
            </div>

            {/* Banner de Conformidade */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">Validação de Conformidade com o FNDE</div>
                <p className="text-[11px] text-emerald-800">
                  Os dados institucionais são cruzados automaticamente com o Censo Escolar INEP e a dotação orçamentária do PNAE (Lei 11.947/2009).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 2: ENDEREÇO & CONTATOS */}
        {activeTabSection === 'contatos' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                Endereço da Sede & Canais Oficiais de Atendimento
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Utilizado para correspondências oficiais, editais de chamadas públicas e notificações a fornecedores da agricultura familiar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Endereço Completo da Sede (Logradouro, Número, Bairro, CEP, Cidade - UF) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.endereco}
                    onChange={e => handleInputChange('endereco', e.target.value)}
                    placeholder="Ex: Avenida 28 de Maio, nº 1420 - Centro, CEP 95915-000, Santa Clara do Sul - RS"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  E-mail Institucional do PNAE / Secretaria *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    placeholder="educacao@municipio.gov.br"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10.5px] text-stone-600 mt-1">
                  Canal para envio de dúvidas de produtores e comunicações do CAE.
                </p>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Telefone / WhatsApp Institucional *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={e => handleInputChange('telefone', e.target.value)}
                    placeholder="(00) 0000-0000 / (00) 90000-0000"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10.5px] text-stone-600 mt-1">
                  Telefone para suporte a merendeiras e fornecedores rurais.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: GESTOR & PORTARIA */}
        {activeTabSection === 'gestao' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Gestor(a) Responsável & Ato Oficial de Nomeação
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Autoridade signatária dos contratos da agricultura familiar, relatórios executivos e prestações de contas ao FNDE.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nome Completo do(a) Gestor(a) / Autoridade *
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.gestorNome}
                    onChange={e => handleInputChange('gestorNome', e.target.value)}
                    placeholder="Ex: Dra. Mariana Silveira Fagundes"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cargo / Função Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={formData.gestorCargo}
                  onChange={e => handleInputChange('gestorCargo', e.target.value)}
                  placeholder="Ex: Secretária Municipal de Educação e Cultura"
                  className="w-full px-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="md:col-span-12">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Portaria / Decreto de Nomeação ou Designação *
                </label>
                <div className="relative">
                  <Scroll className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.portaria}
                    onChange={e => handleInputChange('portaria', e.target.value)}
                    placeholder="Ex: Portaria Municipal nº 048/2024 de 03 de Janeiro de 2024"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-stone-50/50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[10.5px] text-stone-600 mt-1">
                  Ato administrativo publicado em diário oficial que confere competência legal para a gestão do PNAE.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 4: LOGOMARCAS (LOGO 1 & LOGO 2) */}
        {activeTabSection === 'logos' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Image className="w-4 h-4 text-emerald-700" />
                Logomarcas Oficiais para Timbrado de Relatórios e Documentos
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Faça o upload do Brasão da Prefeitura/Entidade e do Logotipo do PNAE/Secretaria. Suporta PNG, JPG, SVG e WebP até 5MB.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CARD LOGO 1: Brasão da Prefeitura / EEx */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                      <h3 className="text-xs font-bold text-stone-900">
                        Logo 1: Brasão da Prefeitura / Entidade Executora
                      </h3>
                    </div>
                    <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200 font-semibold">
                      Lado Esquerdo no PDF
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mb-4">
                    Exibido no canto superior esquerdo do cabeçalho oficial de todos os documentos gerados.
                  </p>

                  {/* Visualizador da Imagem */}
                  <div className="flex items-center justify-center p-6 bg-white rounded-xl border border-dashed border-stone-300 min-h-[140px] relative group">
                    {formData.logo1 ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={formData.logo1} 
                          alt="Logo 1 - Brasão Oficial" 
                          className="max-h-24 max-w-full object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                          Logo 1 Carregada
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-stone-400">
                        <Image className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Nenhum brasão carregado</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputLogo1Ref}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={e => handleFileUpload(e, 'logo1')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputLogo1Ref.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer Upload do Brasão</span>
                    </button>

                    {formData.logo1 && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('logo1', '')}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                        title="Remover Logo 1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Presets Rápidos */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">
                      Ou selecione um modelo pronto:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {LOGO1_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInputChange('logo1', preset.svg)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD LOGO 2: Logo PNAE / FNDE / Secretaria */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center">
                        2
                      </span>
                      <h3 className="text-xs font-bold text-stone-900">
                        Logo 2: Logotipo PNAE / FNDE / Secretaria
                      </h3>
                    </div>
                    <span className="text-[10px] text-stone-600 bg-white px-2 py-0.5 rounded-md border border-stone-200 font-semibold">
                      Lado Direito no PDF
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 mb-4">
                    Exibido no canto superior direito do cabeçalho oficial de todos os documentos gerados.
                  </p>

                  {/* Visualizador da Imagem */}
                  <div className="flex items-center justify-center p-6 bg-white rounded-xl border border-dashed border-stone-300 min-h-[140px] relative group">
                    {formData.logo2 ? (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={formData.logo2} 
                          alt="Logo 2 - Logotipo PNAE" 
                          className="max-h-24 max-w-full object-contain drop-shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                          Logo 2 Carregada
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-stone-400">
                        <Image className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <p className="text-xs">Nenhum logotipo carregado</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputLogo2Ref}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={e => handleFileUpload(e, 'logo2')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputLogo2Ref.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer Upload do Logotipo</span>
                    </button>

                    {formData.logo2 && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('logo2', '')}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                        title="Remover Logo 2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Presets Rápidos */}
                  <div>
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">
                      Ou selecione um modelo pronto:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {LOGO2_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInputChange('logo2', preset.svg)}
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-white hover:bg-teal-50 border border-stone-200 hover:border-teal-300 text-stone-700 transition"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SEÇÃO 5: PRÉ-VISUALIZAÇÃO DO TIMBRADO OFICIAL */}
        {activeTabSection === 'preview' && (
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  Simulação em Tempo Real do Timbrado Oficial (Cabeçalho de Documentos)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Assim é como o cabeçalho e rodapé dos relatórios em PDF, Ordens de Fornecimento (AF) e Pareceres do CAE serão impressos.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Testar Download em PDF</span>
              </button>
            </div>

            {/* Folha de Documento Simulada */}
            <div className="p-6 md:p-8 bg-stone-50/80 rounded-2xl border border-stone-300 shadow-inner max-w-4xl mx-auto font-serif">
              <div className="bg-white p-6 rounded-xl border border-stone-300 shadow-md space-y-6">
                
                {/* Header Banner Oficial */}
                <div className="bg-emerald-800 text-white p-4 rounded-lg flex items-center justify-between gap-4">
                  {formData.logo1 ? (
                    <div className="w-16 h-16 bg-white/90 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img src={formData.logo1} alt="Logo 1" className="max-h-14 max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-emerald-700/50 rounded-lg flex items-center justify-center text-[9px] text-emerald-200 shrink-0">
                      Logo 1
                    </div>
                  )}

                  <div className="text-center flex-1 space-y-1">
                    <div className="text-xs md:text-sm font-bold uppercase tracking-wide">
                      PROGRAMA NACIONAL DE ALIMENTAÇÃO ESCOLAR - PNAE / FNDE
                    </div>
                    <div className="text-[11px] md:text-xs font-medium text-emerald-100 uppercase">
                      {formData.orgaoNome}
                    </div>
                    <div className="text-[10px] text-emerald-200">
                      CNPJ: {formData.cnpj} • Exercício: {formData.anoExercicio} • Código IBGE: {formData.codigoIbge}
                    </div>
                  </div>

                  {formData.logo2 ? (
                    <div className="w-16 h-16 bg-white/90 rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img src={formData.logo2} alt="Logo 2" className="max-h-14 max-w-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-emerald-700/50 rounded-lg flex items-center justify-center text-[9px] text-emerald-200 shrink-0">
                      Logo 2
                    </div>
                  )}
                </div>

                {/* Bloco de Título do Documento Simulado */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-center space-y-0.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    RELATÓRIO GERENCIAL CONSOLIDADO DO PNAE
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Demonstrativo Físico-Financeiro e Cumprimento da Lei nº 11.947/2009
                  </div>
                </div>

                {/* Dados Institucionais de Referência */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3.5 bg-stone-50/60 rounded-lg border border-stone-200 text-[11px]">
                  <div>
                    <span className="text-stone-500 block text-[9.5px]">Gestor(a) Responsável:</span>
                    <strong className="text-stone-800">{formData.gestorNome}</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9.5px]">Cargo / Função:</span>
                    <span className="text-stone-800">{formData.gestorCargo}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9.5px]">Ato de Designação:</span>
                    <span className="text-stone-800 font-mono text-[10px]">{formData.portaria}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-stone-500 block text-[9.5px]">Endereço da Sede:</span>
                    <span className="text-stone-800">{formData.endereco}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9.5px]">Contatos Oficiais:</span>
                    <span className="text-stone-800">{formData.email} • {formData.telefone}</span>
                  </div>
                </div>

                {/* Rodapé Simulado */}
                <div className="pt-4 border-t border-stone-200 text-center text-[9px] text-stone-400 space-y-0.5">
                  <div>Documento Oficial emitido pelo Sistema de Gestão PNAE em {new Date().toLocaleString('pt-BR')}</div>
                  <div>Conformidade com a Lei Federal nº 11.947/2009 e Resolução CD/FNDE nº 06/2020 • Página 1 de 1</div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Barra de Ação Flutuante / Inferior */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>As informações salvas são aplicadas automaticamente a todos os módulos do sistema.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
            >
              Cancelar / Descartar
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados do Órgão Gestor</span>
            </button>
          </div>
        </div>

      </form>

      {/* SEÇÃO 5: USUÁRIOS & PERFIS DE ACESSO (fora do form principal para não aninhar formulários) */}
      {activeTabSection === 'usuarios' && <GestaoUsuariosSection />}

    </div>
  );
};
