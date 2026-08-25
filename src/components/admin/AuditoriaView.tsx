import React from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { History, Shield, Clock, User, Download } from 'lucide-react';
import { RoleBadge } from '../layout/RoleBadge';
import { exportAuditoriaLogsPDF } from '../../lib/exportPdf';

export const AuditoriaView: React.FC = () => {
  const { auditoriaLogs, municipio } = usePNAE();

  const handleExportPDF = () => {
    exportAuditoriaLogsPDF(auditoriaLogs, municipio);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">
            Trilha de Auditoria e Logs de Conformidade
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro imutável de todas as operações sensíveis: emissão de AFs, homologação de cardápios, pareceres do CAE e recebimento de mercadorias.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório de Auditoria (PDF)</span>
        </button>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase text-[10px] font-semibold border-y border-stone-200">
              <tr>
                <th className="py-2.5 px-3">Data e Hora</th>
                <th className="py-2.5 px-3">Usuário</th>
                <th className="py-2.5 px-3">Perfil (Role)</th>
                <th className="py-2.5 px-3">Módulo</th>
                <th className="py-2.5 px-3">Ação</th>
                <th className="py-2.5 px-3">Detalhes do Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {auditoriaLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/50">
                  <td className="py-3 px-3 font-mono text-[11px] text-stone-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{log.dataHora}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-stone-900">{log.usuarioNome}</td>
                  <td className="py-3 px-3">
                    <RoleBadge role={log.usuarioRole} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-medium text-stone-800">{log.modulo}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded">
                      {log.acao}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-600 max-w-xs truncate">{log.detalhes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
