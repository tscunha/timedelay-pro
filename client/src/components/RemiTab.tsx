import React, { useState } from 'react';
import { Square } from 'lucide-react';

export default function RemiTab({ cameras }: { cameras: any[] }) {
  const [routes, setRoutes] = useState<any[]>([
    { id: 'remi-1', dest: 'srt://...:9050', name: 'Mochilink Maracanã', loss: '0%', latency: '200ms', status: 'online' }
  ]);
  const [selectedCam, setSelectedCam] = useState('');

  const handleEngage = () => {
    if(!selectedCam) return alert('Selecione uma Origem');
    const camName = cameras.find(c => c.id === selectedCam)?.name || 'Desconhecido';
    setRoutes([{
      id: `remi-${Date.now()}`,
      name: camName,
      dest: `srt://192.168.1.10:${9050 + routes.length}`,
      loss: '0%', 
      latency: '200ms',
      status: 'online'
    }, ...routes]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 fade-in">
       {/* Controle */}
       <div className="xl:col-span-1 space-y-8">
          <div className="glass-panel rounded-xl overflow-hidden border border-blue-900/50 shadow-2xl">
              <div className="bg-blue-950/30 border-b border-blue-900/50 p-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-blue-400 text-center">Patch Panel SRT</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs text-blue-300 font-bold mb-2 uppercase tracking-widest bg-blue-950/20 px-2 py-1 rounded inline-block">Mochilink (Origem)</label>
                  <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)} className="w-full bg-[#111] border-2 border-slate-700 rounded-lg p-4 text-white font-bold text-lg focus:border-blue-500 cursor-pointer">
                    <option value="">-- SELECIONAR --</option>
                    {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-blue-300 font-bold mb-2 uppercase tracking-widest bg-blue-950/20 px-2 py-1 rounded inline-block">Modo de Operação</label>
                  <select className="w-full bg-[#111] border-2 border-slate-700 rounded-lg p-4 text-white font-bold text-lg focus:border-blue-500 cursor-pointer">
                    <option>SRT Listener (Aguardar Caller)</option>
                    <option>SRT Caller (Empurrar pro Switch)</option>
                  </select>
                </div>
                <button onClick={handleEngage} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-black tracking-widest uppercase rounded-xl py-6 flex items-center justify-center mt-6 transition-all shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  Ligar Rota (0-Delay)
                </button>
              </div>
          </div>
       </div>
       
       {/* Monitor */}
       <div className="xl:col-span-3 space-y-6">
         <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">Matriz Ponto-a-Ponto (Ultra Low Latency)</h2>
         
         <div className="bg-[#080808] border border-gray-800 rounded-lg overflow-hidden">
             {routes.map(route => (
               <div key={route.id} className="p-4 md:p-6 border-b border-gray-800 flex flex-col md:flex-row items-center gap-8 hover:bg-[#111] transition-colors fade-in">
                  <div className="flex items-center gap-4 w-full md:w-1/3">
                     <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_#00ff00]"></div>
                     <div>
                       <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Input SRT</p>
                       <p className="text-xl font-black text-white">{route.name}</p>
                     </div>
                  </div>

                  <div className="hidden md:flex flex-col items-center flex-grow">
                     <div className="h-px bg-green-500/50 w-full relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#080808] px-2 text-[10px] text-green-500 font-mono-tech border border-green-900 rounded-full cursor-help" title="Loss simulado do Node">
                           LOSS: {route.loss} | LAT: {route.latency}
                        </div>
                     </div>
                  </div>

                  <div className="w-full md:w-1/3 flex items-center justify-between">
                     <div className="text-right">
                       <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Output Decoder</p>
                       <p className="text-2xl font-black font-mono-tech text-blue-400">{route.dest}</p>
                     </div>
                     <button onClick={() => setRoutes(routes.filter(r => r.id !== route.id))} className="bg-red-900/40 border border-red-900 text-red-500 p-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors cursor-pointer" title="Kill Route">
                       <Square className="w-5 h-5"/>
                     </button>
                  </div>
               </div>
             ))}
             {routes.length === 0 && <div className="p-8 text-center text-gray-600 font-bold uppercase tracking-widest">Nenhuma Rota Ativa</div>}
         </div>
       </div>
    </div>
  );
}
