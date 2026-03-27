import { useState, useEffect, useCallback } from 'react';
import { remiApi, type Remi, type Channel } from '../api';

const STATUS_LABEL: Record<string, string> = {
  running: 'ROTA ATIVA',
  stopped: 'PARADO',
  crashed: 'CRASHED',
};

export default function RemiTab({ channels }: { channels: Channel[] }) {
  const [routes, setRoutes] = useState<Remi[]>([]);
  const [serverHost, setServerHost] = useState('...');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [outPort, setOutPort] = useState(9050);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    try {
      const res = await remiApi.list();
      setRoutes(res.remi);
      setServerHost(res.server_host);
    } catch { /* silently ignore poll errors */ }
  }, []);

  useEffect(() => {
    loadRoutes();
    const timer = setInterval(loadRoutes, 5_000);
    return () => clearInterval(timer);
  }, [loadRoutes]);

  const handleEngage = async () => {
    if (!selectedChannel) { setError('Selecione um canal de origem.'); return; }
    setLoading(true);
    setError(null);
    try {
      await remiApi.create({ channel_id: selectedChannel, out_port: outPort });
      await loadRoutes();
      setOutPort(p => p + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async (id: string) => {
    try {
      await remiApi.destroy(id);
      setRoutes(r => r.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const channelName = (id: string) => channels.find(c => c.id === id)?.name ?? id;

  return (
    <div className="wf-grid-3-1">
      <div className="wf-box">
        <h2 className="wf-title">PATCH PANEL DE ROTEAMENTO</h2>

        <label className="wf-label">SINAL DE ORIGEM (MOCHILINK/CALLER)</label>
        <select className="wf-input" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
          <option value="">-- ESCOLHER ORIGEM --</option>
          {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="wf-label" style={{ marginTop: '15px' }}>PORTA SRT DE SAÍDA (REMI)</label>
        <input type="number" className="wf-input" value={outPort} onChange={e => setOutPort(Number(e.target.value))} />
        <p style={{ fontSize: '12px', marginTop: '-8px' }}>Latência: 200ms (ultra-low)</p>

        {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px' }}>⚠ {error}</p>}

        <button className="wf-btn wf-btn-dark" onClick={handleEngage} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? '[ ROTEANDO... ]' : '[ LIGAR ROTA DE BAIXA LATÊNCIA ]'}
        </button>
      </div>

      <div className="wf-box" style={{ backgroundColor: '#fafafa' }}>
        <h2 className="wf-title">ACOMPANHAMENTO DE ROTAS ATIVAS</h2>

        {routes.length === 0 && (
          <div className="wf-box-dashed" style={{ textAlign: 'center', margin: '40px' }}>
            <p>[ Nenhuma rota REMI ativa ]</p>
          </div>
        )}

        <div className="wf-flex-col">
          {routes.map(r => (
            <div key={r.id} className="wf-list-item" style={{ display: 'flex', padding: '20px' }}>

              <div style={{ flex: 1, borderRight: '1px dashed #000' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ORIGEM:</span><br />
                <strong>{channelName(r.channel_id)}</strong>
              </div>

              <div style={{ flex: 2, textAlign: 'center', padding: '0 20px', borderRight: '1px dashed #000' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ESTADO:</span><br />
                <span
                  className="wf-badge"
                  style={{ display: 'inline-block', marginTop: '5px', background: r.status === 'running' ? '#000' : r.status === 'crashed' ? '#c00' : '#666' }}
                >
                  [ {STATUS_LABEL[r.status] ?? r.status} ]
                </span>
                {r.pid && <span style={{ fontSize: '11px', display: 'block' }}>PID: {r.pid}</span>}
              </div>

              <div style={{ flex: 2, textAlign: 'right', display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>DESTINO:</span><br />
                  <strong style={{ fontFamily: 'monospace' }}>srt://{serverHost}:{r.out_port}</strong>
                  <br />
                  <button
                    className="wf-btn"
                    style={{ marginTop: '6px', width: 'auto', padding: '3px 8px', fontSize: '11px' }}
                    onClick={() => handleCopy(`srt://${serverHost}:${r.out_port}`)}
                  >
                    {copied === `srt://${serverHost}:${r.out_port}` ? '[ ✓ COPIADO ]' : '[ COPIAR ]'}
                  </button>
                </div>
                <button className="wf-btn" style={{ width: 'auto', height: '100%' }} onClick={() => handleKill(r.id)}>
                  [ X ]
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
