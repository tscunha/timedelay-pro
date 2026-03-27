import { useState, useEffect, useCallback } from 'react';
import { simulcastApi, type Simulcast, type Channel } from '../api';

const STATUS_LABEL: Record<string, string> = {
  running: 'ON AIR',
  stopped: 'OFF',
  crashed: 'CRASHED',
};

export default function SimulcastTab({ channels }: { channels: Channel[] }) {
  const [simulcasts, setSimulcasts] = useState<Simulcast[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [destName, setDestName] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await simulcastApi.list();
      setSimulcasts(res.simulcasts);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5_000);
    return () => clearInterval(timer);
  }, [load]);

  const handleCreate = async () => {
    if (!selectedChannel || !destName || !rtmpUrl) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await simulcastApi.create({ channel_id: selectedChannel, destination_name: destName, rtmp_url: rtmpUrl });
      await load();
      setDestName('');
      setRtmpUrl('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async (id: string) => {
    try {
      await simulcastApi.destroy(id);
      setSimulcasts(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const channelName = (id: string) => channels.find(c => c.id === id)?.name ?? id;

  return (
    <div className="wf-grid-3-1">
      <div className="wf-box">
        <h2 className="wf-title">PAINEL DE MULTIPLEXAÇÃO (SIMULCAST)</h2>

        <label className="wf-label">CANAL DE ORIGEM</label>
        <select className="wf-input" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
          <option value="">-- ESCOLHER ORIGEM --</option>
          {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="wf-label" style={{ marginTop: '15px' }}>NOME DO DESTINO</label>
        <input className="wf-input" value={destName} onChange={e => setDestName(e.target.value)} placeholder="Ex: YOUTUBE, FACEBOOK" />

        <label className="wf-label" style={{ marginTop: '15px' }}>URL RTMP</label>
        <input className="wf-input" value={rtmpUrl} onChange={e => setRtmpUrl(e.target.value)} placeholder="rtmp://a.rtmp.youtube.com/live2/KEY" />

        {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px' }}>⚠ {error}</p>}

        <button className="wf-btn wf-btn-dark" onClick={handleCreate} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? '[ ATIVANDO... ]' : '[ ATIVAR THREAD SIMULCAST ]'}
        </button>
      </div>

      <div className="wf-box" style={{ backgroundColor: '#fafafa' }}>
        <h2 className="wf-title">DESTINOS ATIVOS</h2>

        {simulcasts.length === 0 && (
          <div className="wf-box-dashed" style={{ textAlign: 'center', margin: '40px' }}>
            <p>[ Nenhum simulcast ativo ]</p>
          </div>
        )}

        <div className="wf-grid-3cols" style={{ marginTop: '20px' }}>
          {simulcasts.map(s => (
            <div key={s.id} className="wf-box-dashed" style={{ backgroundColor: s.status === 'running' ? '#fff' : '#eaeaea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{s.destination_name}</h3>
                <span
                  className="wf-badge"
                  style={{ background: s.status === 'running' ? '#000' : s.status === 'crashed' ? '#c00' : '#666' }}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>&gt; {s.rtmp_url}</p>
              <p style={{ fontSize: '11px' }}>{channelName(s.channel_id)}</p>
              <hr style={{ borderTop: '1px dashed #ccc', borderBottom: 'none', margin: '10px 0' }} />
              <button className="wf-btn" onClick={() => handleKill(s.id)}>
                [ DESLIGAR TRANSMISSÃO ]
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
