import { useState, useEffect, useCallback } from 'react';
import TimeShiftTab from './components/TimeShiftTab';
import RemiTab from './components/RemiTab';
import SimulcastTab from './components/SimulcastTab';
import ComplianceTab from './components/ComplianceTab';
import { channelsApi, type Channel } from './api';

import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'timeshift' | 'remi' | 'simulcast' | 'compliance'>('timeshift');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStreamId, setNewStreamId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    try {
      const res = await channelsApi.list();
      setChannels(res.channels);
      setChannelError(null);
    } catch (e: any) {
      setChannelError(e.message);
    }
  }, []);

  // Load on mount + poll every 10s
  useEffect(() => {
    loadChannels();
    const timer = setInterval(loadChannels, 10_000);
    return () => clearInterval(timer);
  }, [loadChannels]);

  const handleCreateChannel = async () => {
    if (!newName.trim() || !newStreamId.trim()) {
      setCreateError('Nome e StreamID são obrigatórios.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await channelsApi.create({ name: newName.trim(), streamid: newStreamId.trim() });
      await loadChannels();
      setShowModal(false);
      setNewName('');
      setNewStreamId('');
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="wf-container">

      <header className="wf-header">
        <div>
          <h1 style={{ margin: 0 }}>SUÍTE TIME SHIFT PRO</h1>
          <p style={{ margin: '5px 0 0 0' }}>
            {channelError
              ? `⚠ ERRO AO CARREGAR CANAIS: ${channelError}`
              : `${channels.length} canal(is) configurado(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="wf-btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setShowModal(true)}>
            [ + NOVO CANAL ]
          </button>
          <div className="wf-box-dashed" style={{ padding: '10px' }}>
            [LOGOTIPO]
          </div>
        </div>
      </header>

      {/* Create Channel Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="wf-box" style={{ width: '420px', maxWidth: '90vw' }}>
            <h2 className="wf-title">CADASTRAR NOVO SINAL INGEST</h2>
            <label className="wf-label">NOME DO CANAL</label>
            <input className="wf-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: [CAM 1] ESTÚDIO A" />
            <label className="wf-label" style={{ marginTop: '15px' }}>STREAM ID (Nimble)</label>
            <input className="wf-input" value={newStreamId} onChange={e => setNewStreamId(e.target.value)} placeholder="Ex: canal1" />
            {createError && <p style={{ color: 'red', fontSize: '13px', marginTop: '8px' }}>⚠ {createError}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="wf-btn wf-btn-dark" onClick={handleCreateChannel} disabled={creating}>
                {creating ? '[ CRIANDO... ]' : '[ CONFIRMAR CADASTRO ]'}
              </button>
              <button className="wf-btn" onClick={() => { setShowModal(false); setCreateError(null); }}>
                [ CANCELAR ]
              </button>
            </div>
          </div>
        </div>
      )}

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
        {activeTab === 'timeshift' && <TimeShiftTab channels={channels} />}
        {activeTab === 'remi' && <RemiTab channels={channels} />}
        {activeTab === 'simulcast' && <SimulcastTab channels={channels} />}
        {activeTab === 'compliance' && <ComplianceTab channels={channels} />}
      </main>

      <footer style={{ marginTop: '40px', borderTop: '1px solid #000', paddingTop: '10px' }}>
        <p>SUÍTE TIME SHIFT PRO — {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
}

export default App;

