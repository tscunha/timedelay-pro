import React, { useState } from 'react';
import { Power, ShieldAlert, Square } from 'lucide-react';

export default function TimeShiftTab({ cameras }: { cameras: any[] }) {
  const [shifts, setShifts] = useState<any[]>([
    { id: 'shift-1', name: 'ESTÚDIO A (Mestre)', delay: 3600, port: 9011, status: 'online' },
    { id: 'shift-2', name: 'MOCHILINK (Maracanã)', delay: 300, port: 9012, status: 'offline' }
  ]);
  
  const [selectedCam, setSelectedCam] = useState('');
  const [delaySec, setDelaySec] = useState(3600);

  const handleEngage = () => {
    if(!selectedCam) return alert('Selecione um Sinal!');
    const camName = cameras.find(c => c.id === selectedCam)?.name || 'Desconhecido';
    
    setShifts([...shifts, {
      id: `shift-${Date.now()}`,
      name: camName,
      delay: delaySec,
      port: 9000 + shifts.length + 15, // Porta mockada crescente
      status: 'online'
    }]);
  };

  const killShift = (id: string) => {
    setShifts(shifts.filter(s => s.id !== id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 fade-in">
      <div className="xl:col-span-1 space-y-8">
        <div className="glass-panel rounded-xl overflow-hidden border border-red-900/50 shadow-2xl">
          <div className="bg-red-950/30 border-b border-red-900/50 p-4">
             <h2 className="text-xl font-black uppercase tracking-widest text-white text-center">Criar Atraso SRT</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs text-red-300 font-bold mb-2 uppercase tracking-widest bg-red-950/20 px-2 py-1 inline-block rounded">Passo 1: Qual o Sinal?</label>
              <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)} className="w-full bg-[#111] border-2 border-slate-700 rounded-lg p-4 text-white font-bold text-[1.1rem] focus:border-red-500 transition-colors cursor-pointer">
                <option value="">-- SELECIONAR --</option>
                {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="pt-2">
              <label className="block text-xs text-red-300 font-bold mb-2 uppercase tracking-widest bg-red-950/20 px-2 py-1 inline-block rounded">Passo 2: Atraso (Segundos)</label>
              <input type="number" value={delaySec} onChange={e => setDelaySec(Number(e.target.value))} className="w-full bg-[#050505] border-2 border-slate-800 rounded-lg p-4 text-4xl font-black text-center font-mono-tech text-white focus:border-red-500 focus:outline-none transition-colors shadow-inner" />
              <p className="text-[10px] text-center text-gray-500 mt-2 font-mono-tech uppercase tracking-widest">1 Hora = 3600 | 5 Mins = 300</p>
            </div>
            <button onClick={handleEngage} className="w-full btn-engage rounded-xl py-6 flex flex-col items-center justify-center mt-6 cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="flex items-center gap-3">
                <Power className="w-8 h-8"/>
                <span className="text-3xl font-black tracking-widest textShadow">ENGAGE</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      <div className="xl:col-span-3 space-y-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">Visor de Motores TimeShift em Execução</h2>
        
        {shifts.length === 0 && (
           <div className="h-[40vh] flex flex-col justify-center items-center border-2 border-dashed border-gray-800 rounded-xl bg-black/20">
              <p className="text-gray-600 font-black uppercase tracking-widest text-2xl">Mesa Limpa</p>
           </div>
        )}

        <div className="space-y-6">
          {shifts.map(shift => {
            const isOnline = shift.status === 'online';
            return (
              <div key={shift.id} className="fade-in">
                <div className="bg-[#111] border border-gray-800 rounded-t-lg px-4 py-2 inline-block">
                  <h3 className="text-xl font-black text-gray-300 tracking-wider uppercase">{shift.name}</h3>
                </div>
                <div className="grid grid-cols-1 gap-2 border border-gray-800 rounded-tr-lg rounded-b-lg p-2 bg-[#080808]">
                  <div className={`rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 border-l-[6px] ${isOnline ? 'status-silent-green border-l-green-500 hover:bg-[#002800]' : 'glass-panel-danger animate-strobe-red border-l-white'}`}>
                    
                    <div className="flex-shrink-0 w-24 text-center border-r border-white/10 pr-4">
                      {isOnline ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-500 mb-2 shadow-[0_0_20px_#00ff00]"></div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-green-500">NO AR</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <ShieldAlert className="w-10 h-10 text-white mb-2"/>
                          <span className="text-[10px] uppercase font-black tracking-widest text-white">SINAL CAIU</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow flex flex-col text-center md:text-left px-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Atraso Em Processamento</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-black font-mono-tech ${isOnline ? 'text-green-400' : 'text-white'}`}>{shift.delay}</span>
                        <span className="text-xl opacity-60 font-black">SEG</span>
                      </div>
                    </div>
                    
                    <div className="flex-grow flex flex-col items-center border-x md:border-x-0 md:border-l border-white/10 px-8">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Configure o Destino com esta URL:</span>
                      <div className={`rounded-lg px-8 py-4 flex items-center justify-center relative w-full ${isOnline ? 'bg-black/80' : 'bg-red-950'}`}>
                        <span className={`text-3xl font-black font-mono-tech tracking-wider whitespace-nowrap ${isOnline ? 'text-green-300' : 'text-white'}`}>srt://72.60.142.3:{shift.port}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 pl-4 border-l border-white/10">
                      <button onClick={() => killShift(shift.id)} className="w-16 h-16 rounded-md bg-black/50 border border-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer group">
                        <Square className="w-6 h-6 text-gray-600 group-hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
