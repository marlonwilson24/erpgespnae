import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { StatsCard } from '../common/StatsCard';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ChamadaPublica } from '../../types';
import { exportExtratoProdutorPDF } from '../../lib/exportPdf';
import { 
  Tractor, 
  DollarSign, 
  FileText, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Download,
  Calendar,
  Building2
} from 'lucide-react';
import { SubmeterPropostaModal } from './SubmeterPropostaModal';

export const FornecedorDashboard: React.FC = () => {
  const { 
    currentUser, 
    chamadasPublicas, 
    contratos, 
    autorizacoesFornecimento, 
    entregas,
    municipio 
  } = usePNAE();

  const [selectedChamadaModal, setSelectedChamadaModal] = useState<ChamadaPublica | null>(null);

  // Limite da DAP do agricultor (R$ 40.000 / ano)
  const LIMITE_DAP = 40000;
  const meusContratos = contratos.filter(c => c.fornecedorId === currentUser?.id || c.fornecedorDapCaf === currentUser?.fornecedorDapCaf);
  const totalContratado = meusContratos.reduce((acc, c) => acc + c.valorTotalContrato, 0);
  const saldoDAP = Math.max(0, LIMITE_DAP - totalContratado);
  const percentualDAPUsado = (totalContratado / LIMITE_DAP) * 100;

  // Minhas AFs e entregas
  const minhasAFs = autorizacoesFornecimento.filter(af => af.fornecedorId === currentUser?.id || af.fornecedorNome.includes('Agricultores'));
  const minhasEntregas = entregas.filter(e => e.fornecedorId === currentUser?.id || e.fornecedorNome.includes('Agricultores'));

  const handleExportExtrato = () => {
    if (currentUser) {
      exportExtratoProdutorPDF(
        currentUser,
        meusContratos,
        minhasAFs,
        minhasEntregas,
        municipio
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header do Produtor Rural */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900">
              Portal do Produtor Rural & Agricultura Familiar
            </h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold font-mono">
              DAP/CAF: {currentUser?.fornecedorDapCaf || 'CAF-RS-2026-881920'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Produtor / Entidade: <strong>{currentUser?.name}</strong> • Município: {municipio.nome} - {municipio.uf}
          </p>
        </div>

        <button
          onClick={handleExportExtrato}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4 text-stone-500" />
          <span>Exportar Extrato do Produtor (PDF)</span>
        </button>
      </div>

      {/* Card Especial de Controle de Limite de R$ 40 mil / ano da DAP/CAF */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Tractor className="w-4 h-4 text-emerald-700" />
              Controle de Limite Anual da DAP/CAF (Lei 11.947/2009)
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Limite individual máximo permitido por ano civil: <strong>{formatCurrency(LIMITE_DAP)}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-stone-500">Saldo Disponível para Vendas:</span>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(saldoDAP)}</p>
          </div>
        </div>

        {/* Barra de Progresso do Teto da DAP */}
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex border border-stone-200">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, percentualDAPUsado)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-stone-500 pt-1">
          <span>Contratado no Exercício: <strong>{formatCurrency(totalContratado)} ({percentualDAPUsado.toFixed(1)}%)</strong></span>
          <span>Teto Anual: <strong>{formatCurrency(LIMITE_DAP)}</strong></span>
        </div>
      </div>

      {/* Grid de KPIs do Produtor */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Contratos Vigentes"
          value={meusContratos.length}
          subtitle={`Total: ${formatCurrency(totalContratado)}`}
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          badgeText="Ativos"
          badgeColor="green"
        />

        <StatsCard
          title="Autorizações de Entrega (AF)"
          value={minhasAFs.length}
          subtitle="Ordens para entrega nas escolas"
          icon={<Truck className="w-5 h-5 text-blue-600" />}
        />

        <StatsCard
          title="Entregas Realizadas com Termo"
          value={minhasEntregas.length}
          subtitle="Atestadas pelas diretoras"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          badgeText="Concluídas"
          badgeColor="green"
        />
      </div>

      {/* Chamadas Públicas Abertas para Submissão de Proposta */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Chamadas Públicas Abertas para Envio de Projeto de Venda
            </h3>
            <p className="text-xs text-stone-500">
              Editais publicados pela Prefeitura de {municipio.nome} exclusivos para Agricultura Familiar.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {chamadasPublicas.map(cp => {
            const jaEnviou = cp.propostas.some(p => p.fornecedorId === currentUser?.id || p.fornecedorDapCaf === currentUser?.fornecedorDapCaf);
            return (
              <div key={cp.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Edital nº {cp.numeroEdital}
                    </span>
                    <span className="text-xs font-semibold text-stone-900">
                      {cp.titulo}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{cp.objeto}</p>
                  <p className="text-[11px] text-stone-500">
                    Prazo final: <strong>{formatDate(cp.dataEncerramento)}</strong> • Valor Estimado: {formatCurrency(cp.valorTotalEstimado)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {jaEnviou ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Projeto Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => setSelectedChamadaModal(cp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Submeter Projeto de Venda</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Minhas Autorizações de Fornecimento (AF) */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-stone-900">
          Minhas Ordens de Entrega / Autorizações de Fornecimento
        </h3>

        <div className="overflow-x-auto border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Nº AF</th>
                <th className="py-2.5 px-3">Escola Destino</th>
                <th className="py-2.5 px-3">Data Limite</th>
                <th className="py-2.5 px-3">Gêneros e Quantidades</th>
                <th className="py-2.5 px-3">Valor Total</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {minhasAFs.map(af => (
                <tr key={af.id} className="hover:bg-stone-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{af.numeroAF}</td>
                  <td className="py-2.5 px-3 font-semibold text-stone-800">{af.escolaNome}</td>
                  <td className="py-2.5 px-3 text-stone-500">{formatDate(af.dataLimiteEntrega)}</td>
                  <td className="py-2.5 px-3 text-stone-600">
                    {af.itens.map(it => `${it.alimentoNome} (${it.quantidadeAutorizada} ${it.unidadeMedida})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700">{formatCurrency(af.valorTotalAF)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      {af.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Submeter Proposta */}
      {selectedChamadaModal && (
        <SubmeterPropostaModal
          chamada={selectedChamadaModal}
          onClose={() => setSelectedChamadaModal(null)}
        />
      )}

    </div>
  );
};
