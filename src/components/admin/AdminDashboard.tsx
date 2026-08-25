import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatsCard } from '../common/StatsCard';
import { PNAEProgressBar } from '../common/PNAEProgressBar';
import { formatCurrency, formatDate } from '../../lib/utils';
import { exportPrestacaoContasPDF } from '../../lib/exportPdf';
import { 
  Users, 
  DollarSign, 
  Tractor, 
  Truck, 
  FileText, 
  Download, 
  ArrowUpRight,
  School,
  CheckCircle2,
  AlertCircle,
  Settings,
  Building2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { 
    municipio, 
    escolas, 
    prestacaoContas, 
    entregas, 
    chamadasPublicas, 
    autorizacoesFornecimento,
    pareceresCae,
    setActiveTab 
  } = usePNAE();

  const activeParecer = pareceresCae[0];

  // Dados para gráficos
  const chartGastosMensais = [
    { mes: 'Fev', fnde: 58000, contrapartida: 22000, agriculturaFamiliar: 31000 },
    { mes: 'Mar', fnde: 72000, contrapartida: 28000, agriculturaFamiliar: 42000 },
    { mes: 'Abr', fnde: 75000, contrapartida: 29000, agriculturaFamiliar: 46000 },
    { mes: 'Mai', fnde: 78000, contrapartida: 31000, agriculturaFamiliar: 49000 },
    { mes: 'Jun', fnde: 80000, contrapartida: 32000, agriculturaFamiliar: 52000 },
    { mes: 'Ago', fnde: 82000, contrapartida: 34000, agriculturaFamiliar: 55000 },
  ];

  const chartCategorias = [
    { name: 'Hortifrúti e Frutas (AF)', value: 145000, color: '#16a34a' },
    { name: 'Legumes e Verduras (AF)', value: 98000, color: '#22c55e' },
    { name: 'Ovos e Lácteos (AF)', value: 69000, color: '#84cc16' },
    { name: 'Carnes e Proteínas', value: 185000, color: '#f97316' },
    { name: 'Grãos e Mercearia', value: 188400, color: '#0ea5e9' },
  ];

  const handleExportPDF = () => {
    exportPrestacaoContasPDF(prestacaoContas, municipio, activeParecer);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header do Dashboard com Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Painel Geral do Gestor Municipal (PNAE)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Visão consolidada da alimentação escolar de {municipio.nome} - {municipio.uf} • Exercício {municipio.anoExercicio}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('configuracoes')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-xs font-semibold shadow-2xs transition"
            title="Configurações do Órgão Gestor e Logomarcas"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Configurações do Órgão</span>
          </button>

          <button
            onClick={() => setActiveTab('chamadas-publicas')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nova Chamada Pública</span>
          </button>
          
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Exportar Prestação de Contas (PDF)</span>
          </button>
        </div>
      </div>

      {/* Barra de Cumprimento Legal dos 30% da Agricultura Familiar */}
      <PNAEProgressBar
        recursoFNDERecebido={prestacaoContas.recursoTotalFNDERecebido}
        gastoAgriculturaFamiliar={prestacaoContas.gastoAgriculturaFamiliar}
        metaLegalPercentual={30}
      />

      {/* Grid de KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Alunos PNAE"
          value={municipio.totalAlunosPNAE.toLocaleString('pt-BR')}
          subtitle={`${escolas.length} unidades escolares ativas`}
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          badgeText="100% Atendidos"
          badgeColor="green"
          onClick={() => setActiveTab('escolas')}
        />

        <StatsCard
          title="Gasto Total Executado"
          value={formatCurrency(prestacaoContas.gastoTotalAlimentacao)}
          subtitle={`Orçamento: ${formatCurrency(municipio.orcamentoAnualFNDE + municipio.orcamentoContrapartida)}`}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          trend={{ value: '74%', isPositive: true, label: 'executado' }}
          onClick={() => setActiveTab('prestacao-contas')}
        />

        <StatsCard
          title="% Agricultura Familiar"
          value={`${prestacaoContas.percentualAgriculturaFamiliarAtingido.toFixed(1)}%`}
          subtitle={`Total: ${formatCurrency(prestacaoContas.gastoAgriculturaFamiliar)}`}
          icon={<Tractor className="w-5 h-5 text-emerald-700" />}
          badgeText="Meta Legal: >=30%"
          badgeColor="green"
          onClick={() => setActiveTab('chamadas-publicas')}
        />

        <StatsCard
          title="Entregas & AFs Ativas"
          value={autorizacoesFornecimento.length}
          subtitle={`${entregas.length} entregas recebidas com termo`}
          icon={<Truck className="w-5 h-5 text-amber-600" />}
          badgeText="Em Trânsito"
          badgeColor="amber"
          onClick={() => setActiveTab('relatorios')}
        />
      </div>

      {/* Seção de Gráficos de Gestão Financeira */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Evolução de Gastos Mensais */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Evolução dos Gastos da Alimentação Escolar</h3>
              <p className="text-xs text-stone-500">Repasse FNDE vs Contrapartida vs Agricultura Familiar (R$)</p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              Exercício {municipio.anoExercicio}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartGastosMensais} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `R$${val / 1000}k`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="fnde" name="Repasse FNDE" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="agriculturaFamiliar" name="Agricultura Familiar" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contrapartida" name="Contrapartida Municipal" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Composição dos Gastos por Categoria */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Composição por Categoria</h3>
            <p className="text-xs text-stone-500 mb-2">Destinação dos recursos em gêneros</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartCategorias}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartCategorias.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs">
            {chartCategorias.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-stone-600 truncate max-w-[140px]">{item.name}</span>
                </div>
                <span className="font-semibold text-stone-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Tabela de Entregas Recentes & Status de Conferência */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Últimas Entregas e Termos de Recebimento</h3>
            <p className="text-xs text-stone-500">Conferência de AFs nas escolas municipais</p>
          </div>
          <button
            onClick={() => setActiveTab('relatorios')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Ver todas as entregas</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-y border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Nº AF</th>
                <th className="py-2.5 px-3">Escola</th>
                <th className="py-2.5 px-3">Fornecedor / Produtor</th>
                <th className="py-2.5 px-3">Data Entrega</th>
                <th className="py-2.5 px-3">Doc / NF</th>
                <th className="py-2.5 px-3">Conferência</th>
                <th className="py-2.5 px-3">Qualidade</th>
                <th className="py-2.5 px-3 text-right">Termo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {entregas.map(ent => (
                <tr key={ent.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-3 font-bold text-stone-900">{ent.numeroAF}</td>
                  <td className="py-3 px-3 font-medium">{ent.escolaNome}</td>
                  <td className="py-3 px-3">{ent.fornecedorNome}</td>
                  <td className="py-3 px-3 text-stone-500">{formatDate(ent.dataEntrega)}</td>
                  <td className="py-3 px-3 font-mono text-[11px]">{ent.notaFiscalOuComprovante}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      {ent.statusConferencia}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] font-medium text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                      {ent.parecerQualidade}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[11px] text-emerald-700 font-semibold cursor-pointer hover:underline">
                      Gerado ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
