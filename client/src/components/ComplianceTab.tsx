import React from 'react';
import { FileCheck2, ShieldCheck, Download, ExternalLink, Rss } from 'lucide-react';

export default function ComplianceTab() {
  return (
    <div className="grid grid-cols-1 gap-8 fade-in">
       <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-8">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                Auditoria e Compliance
              </h2>
              <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Geração passiva de VODs e Logs de Queda para análise MCR e I.A</p>
            </div>
            <button className="bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 px-6 py-3 rounded-lg flex items-center gap-2 font-bold hover:bg-emerald-900/60 transition-colors uppercase text-xs tracking-widest cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Download className="w-4 h-4"/> Baixar Master PDF
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800 text-xs text-gray-600 uppercase tracking-widest">
                  <th className="pb-3 px-4 font-black">Data/Hora (UTC)</th>
                  <th className="pb-3 px-4 font-black">Canal Gravado</th>
                  <th className="pb-3 px-4 font-black">Arquivo VOD</th>
                  <th className="pb-3 px-4 font-black">Status Inteligência (MCP)</th>
                  <th className="pb-3 px-4 text-right font-black">Ação Operador</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono-tech">
                <tr className="border-b border-gray-800/50 hover:bg-[#111] transition-colors group">
                   <td className="py-4 px-4 text-gray-400">2026-03-27 10:00:00</td>
                   <td className="py-4 px-4 font-bold text-white font-sans uppercase">Estúdio A</td>
                   <td className="py-4 px-4 text-emerald-500">compliance_ESTA_001.mp4</td>
                   <td className="py-4 px-4 text-gray-500">Limpo (0 drops)</td>
                   <td className="py-4 px-4 text-right"><ExternalLink className="w-4 h-4 inline-block text-gray-600 group-hover:text-white cursor-pointer"/></td>
                </tr>
                <tr className="border-b border-gray-800/50 bg-red-950/10 hover:bg-red-950/30 transition-colors group">
                   <td className="py-4 px-4 text-gray-400">2026-03-27 09:00:00</td>
                   <td className="py-4 px-4 font-bold text-white font-sans uppercase">Mochilink Maracanã</td>
                   <td className="py-4 px-4 text-red-400">compliance_MOC_001.mp4</td>
                   <td className="py-4 px-4 text-red-500 flex items-center gap-2"><Rss className="w-3 h-3"/> Evento de Perda P-Frame (12s)</td>
                   <td className="py-4 px-4 text-right"><ExternalLink className="w-4 h-4 inline-block text-gray-600 group-hover:text-red-400 cursor-pointer"/></td>
                </tr>
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}
