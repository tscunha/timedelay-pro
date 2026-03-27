import React, { useState } from 'react';
import TimeShiftTab from './components/TimeShiftTab';
import RemiTab from './components/RemiTab';
import SimulcastTab from './components/SimulcastTab';
import ComplianceTab from './components/ComplianceTab';

// Import CSS puro do wireframe
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'timeshift' | 'remi' | 'simulcast' | 'compliance'>('timeshift');

  const mockCameras = [
    { id: '1', name: '[CAM 1] ESTÚDIO A' },
    { id: '2', name: '[CAM 2] MOCHILINK' }
  ];

  return (
    <div className="wf-container">
      
      <header className="wf-header">
        <div>
          <h1 style={{ margin: 0 }}>SUÍTE TIME SHIFT PRO</h1>
          <p style={{ margin: '5px 0 0 0' }}>WIREFRAME ESTRUTURAL (SEM DESIGN)</p>
        </div>
        <div className="wf-box-dashed" style={{ padding: '10px' }}>
          [LOGOTIPO DA EMPRESA]
        </div>
      </header>

      <div className="wf-nav">
         <button onClick={() => setActiveTab('timeshift')} className={`wf-nav-item ${activeTab === 'timeshift' ? 'active' : ''}`}>
           [1] TIMESHIFT (ATRASO)
         </button>
         <button onClick={() => setActiveTab('remi')} className={`wf-nav-item ${activeTab === 'remi' ? 'active' : ''}`}>
           [2] REMI (ROTEAMENTO)
         </button>
         <button onClick={() => setActiveTab('simulcast')} className={`wf-nav-item ${activeTab === 'simulcast' ? 'active' : ''}`}>
           [3] SIMULCAST (REDES SOCIAIS)
         </button>
         <button onClick={() => setActiveTab('compliance')} className={`wf-nav-item ${activeTab === 'compliance' ? 'active' : ''}`}>
           [4] COMPLIANCE (AUDITORIA)
         </button>
      </div>

      <main>
         {activeTab === 'timeshift' && <TimeShiftTab cameras={mockCameras} />}
         {activeTab === 'remi' && <RemiTab cameras={mockCameras} />}
         {activeTab === 'simulcast' && <SimulcastTab />}
         {activeTab === 'compliance' && <ComplianceTab />}
      </main>
      
      <footer style={{ marginTop: '40px', borderTop: '1px solid #000', paddingTop: '10px' }}>
         <p>RODAPÉ DA APLICAÇÃO - ÁREA DE MENSAGENS E ALERTAS DE SISTEMA.</p>
      </footer>

    </div>
  );
}

export default App;
