import React, { useState } from 'react';
import { Rocket, Clock, Network, Share2, FileCheck2, Cpu, Settings } from 'lucide-react';

import TimeShiftTab from './components/TimeShiftTab';
import RemiTab from './components/RemiTab';
import SimulcastTab from './components/SimulcastTab';
import ComplianceTab from './components/ComplianceTab';

function App() {
  const [activeTab, setActiveTab] = useState<'timeshift' | 'remi' | 'simulcast' | 'compliance'>('timeshift');

  // MOCK DATA CENTRAL
  const mockCameras = [
    { id: '1', name: 'ESTÚDIO A (Mestre)' },
    { id: '2', name: 'ESTÚDIO B (Jornalismo)' },
    { id: '3', name: 'MOCHILINK (Maracanã)' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      {/* HEADER MASTER COCKPIT */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-white/10 gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 p-2 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.4)]">
             <Rocket className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              TIME SHIFT <span className="text-red-500">PRO</span>
            </h1>
            <p className="text-xs text-gray-400 font-mono-tech uppercase tracking-widest mt-1">
              SUÍTE ESTRATÉGICA DE ROTEAMENTO (WIREFRAME INTERATIVO)
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO MILITAR DE MÓDULOS */}
        <div className="flex bg-[#0a0a0a] border-2 border-gray-800 p-1 rounded-xl shadow-inner">
           <button onClick={() => setActiveTab('timeshift')} className={`px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'timeshift' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
             <Clock className="w-4 h-4" /> Delay/Shift
           </button>
           <button onClick={() => setActiveTab('remi')} className={`px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'remi' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
             <Network className="w-4 h-4" /> REMI Routing
           </button>
           <button onClick={() => setActiveTab('simulcast')} className={`px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'simulcast' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
             <Share2 className="w-4 h-4" /> Simulcast
           </button>
           <button onClick={() => setActiveTab('compliance')} className={`px-6 py-3 rounded-lg text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'compliance' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}>
             <FileCheck2 className="w-4 h-4" /> Dumper/Auditoria
           </button>
        </div>
      </header>

      {/* RENDERIZAÇÃO ESTÁTICA DO MÓDULO */}
      <main className="flex-grow fade-in">
         {activeTab === 'timeshift' && <TimeShiftTab cameras={mockCameras} />}
         {activeTab === 'remi' && <RemiTab cameras={mockCameras} />}
         {activeTab === 'simulcast' && <SimulcastTab />}
         {activeTab === 'compliance' && <ComplianceTab />}
      </main>
      
      {/* FOOTER NODE STATUS */}
      <footer className="mt-8 border-t border-white/5 pt-4 flex justify-between text-[10px] text-gray-600 uppercase tracking-widest font-mono-tech">
         <span className="flex items-center gap-2"><Cpu className="w-3 h-3 text-green-500"/> SYSTEM RESOURCES: OPTIMAL (12%)</span>
         <span className="flex items-center gap-2">FFMPEG DAEMONS ACTIVE: 8 <Settings className="w-3 h-3 mx-1"/> V1.1 - COMPONENT MOCK MODE</span>
      </footer>
    </div>
  );
}

export default App;
