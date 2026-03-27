import { useState, useEffect, useCallback } from 'react';
import { complianceApi, type Compliance, type Channel } from '../api';

const STATUS_LABEL: Record<string, string> = {
  running: 'GRAVANDO',
  stopped: 'PARADO',
  crashed: 'CRASHED',
};

export default function ComplianceTab({ channels }: { channels: Channel[] }) {
  const [sessions, setSessions] = useState<Compliance[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [outputPath, setOutputPath] = useState('/data/compliance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await complianceApi.list();
      setSessions(res.compliance);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 5_000);
    return () => clearInterval(timer);
  }, [load]);

  const handleStart = async () => {
    if (!selectedChannel || !outputPath) {
      setError('Selecione um canal e defina o caminho de saída.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await complianceApi.create({ channel_id: selectedChannel, output_path: outputPath });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await complianceApi.destroy(id);
      setSessions(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const channelName = (id: string) => channels.find(c => c.id === id)?.name ?? id;

  return (
    <div className="wf-box">
      <div className="wf-flex-row" style={{ borderBottom: '2px dashed #000', paddingBottom: '20px', alignItems: 'center' }}>
        <div>
          <h2 className="wf-title" style={{ border: 'none', margin: 0 }}>TERMINAL DE RECORDING (COMPLIANCE)</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>GRAVAÇÃO PASSIVA: FFmpeg segmenta em chunks de 1 hora no disco.</p>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px', padding: '20px', border: '1px dashed #ccc' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="wf-label">CANAL DE ORIGEM</label>
          <select className="wf-input" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
            <option value="">-- ESCOLHER CANAL --</option>
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 2, minWidth: '280px' }}>
          <label className="wf-label">DIRETÓRIO DE SAÍDA (VPS)</label>
          <input className="wf-input" value={outputPath} onChange={e => setOutputPath(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="wf-btn wf-btn-dark" onClick={handleStart} disabled={loading}>
            {loading ? '[ INICIANDO... ]' : '[ INICIAR GRABAÇÃO ]'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px' }}>⚠ {error}</p>}

      <table className="wf-table" style={{ marginTop: '30px' }}>
        <thead>
          <tr>
            <th>DATA / HORA</th>
            <th>CÂMERA</th>
            <th>DIRETÓRIO DE DESTINO</th>
            <th>STATUS</th>
            <th>AÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>[ Nenhuma sessão de compliance ativa ]</td>
            </tr>
          )}
          {sessions.map(s => (
            <tr key={s.id}>
              <td>{new Date(s.created_at).toLocaleString('pt-BR')}</td>
              <td>{channelName(s.channel_id)}</td>
              <td style={{ fontSize: '12px', wordBreak: 'break-all' }}>{s.output_path}</td>
              <td>
                <span
                  className="wf-badge"
                  style={{ background: s.status === 'running' ? '#000' : s.status === 'crashed' ? '#c00' : '#666' }}
                >
                  [ {STATUS_LABEL[s.status] ?? s.status} ]
                </span>
                {s.pid && <span style={{ fontSize: '11px', marginLeft: '8px' }}>PID: {s.pid}</span>}
              </td>
              <td>
                <button className="wf-btn" style={{ padding: '5px 10px' }} onClick={() => handleStop(s.id)}>
                  [ PARAR ]
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
