import { useState, useEffect, useCallback } from 'react';
import TimeShiftTab from './components/TimeShiftTab';
import RemiTab from './components/RemiTab';
import SimulcastTab from './components/SimulcastTab';
import ComplianceTab from './components/ComplianceTab';
import { channelsApi, type Channel, getApiKey, setApiKey } from './api';

import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'timeshift' | 'remi' | 'simulcast' | 'compliance'>('timeshift');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Modal state — New Channel
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStreamId, setNewStreamId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal state — API Key settings
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());

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
          <button
            className="wf-btn"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '12px', opacity: 0.8 }}
            onClick={() => { setApiKeyInput(getApiKey()); setShowApiModal(true); }}
            title="Configurar API Key de acesso"
          >
            [ ⚙ API KEY ]
          </button>
          <div className="wf-box-dashed" style={{ padding: '10px' }}>
            [LOGOTIPO]
          </div>
        </div>
      </header>

      {/* API Key Settings Modal */}
      {showApiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div className="wf-box" style={{ width: '400px', maxWidth: '90vw' }}>
            <h2 className="wf-title">⚙ CONFIGURAR API KEY</h2>
            <p style={{ fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
              Digite a chave de acesso fornecida pelo administrador.<br />
              Ela será salva no seu navegador e enviada automaticamente em todas as requisições.
            </p>
            <label className="wf-label">X-API-KEY</label>
            <input
              className="wf-input"
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Ex: minha-chave-secreta-123"
            />
            {!getApiKey() && (
              <p style={{ color: '#c00', fontSize: '12px', marginTop: '8px' }}>⚠ Nenhuma chave configurada. A API pode retornar 401.</p>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="wf-btn wf-btn-dark" onClick={() => { setApiKey(apiKeyInput.trim()); setShowApiModal(false); loadChannels(); }}>
                [ SALVAR E RECONECTAR ]
              </button>
              <button className="wf-btn" onClick={() => setShowApiModal(false)}>
                [ CANCELAR ]
              </button>
            </div>
          </div>
        </div>
      )}

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

