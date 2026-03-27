import { useState, useEffect, useCallback } from 'react';
import { shiftsApi, type Shift, type Channel } from '../api';

const STATUS_LABEL: Record<string, string> = {
  running: 'NO AR',
  stopped: 'PARADO',
  crashed: 'CRASHED',
};

export default function TimeShiftTab({ channels }: { channels: Channel[] }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [delay, setDelay] = useState(3600);
  const [outPort, setOutPort] = useState(9011);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShifts = useCallback(async () => {
    try {
      const res = await shiftsApi.list();
      setShifts(res.shifts);
    } catch { /* silently ignore poll errors */ }
  }, []);

  useEffect(() => {
    loadShifts();
    const timer = setInterval(loadShifts, 5_000);
    return () => clearInterval(timer);
  }, [loadShifts]);

  const handleEngage = async () => {
    if (!selectedChannel) { setError('Selecione um sinal de origem.'); return; }
    setLoading(true);
    setError(null);
    try {
      await shiftsApi.create({ channel_id: selectedChannel, delay_seconds: delay, out_port: outPort });
      await loadShifts();
      setOutPort(p => p + 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKill = async (id: string) => {
    try {
      await shiftsApi.destroy(id);
      setShifts(s => s.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const channelName = (id: string) => channels.find(c => c.id === id)?.name ?? id;

  return (
    <div className="wf-grid-3-1">
      <div className="wf-box">
        <h2 className="wf-title">CRIAR NOVO ATRASO</h2>

        <label className="wf-label">[1] SELECIONAR SINAL DE ORIGEM</label>
        <select className="wf-input" value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
          <option value="">-- ESCOLHER ORIGEM --</option>
          {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label className="wf-label" style={{ marginTop: '20px' }}>[2] ATRASO (SEGUNDOS)</label>
        <input type="number" className="wf-input huge" value={delay} onChange={e => setDelay(Number(e.target.value))} />
        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '-10px' }}>Ex: 1 hora = 3600</p>

        <label className="wf-label" style={{ marginTop: '15px' }}>[3] PORTA SRT DE SAÍDA</label>
        <input type="number" className="wf-input" value={outPort} onChange={e => setOutPort(Number(e.target.value))} />

        {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px' }}>⚠ {error}</p>}

        <button className="wf-btn wf-btn-dark" onClick={handleEngage} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? '[ ENGAJANDO... ]' : '[ ENGAGE ]'}
        </button>
      </div>

      <div className="wf-box" style={{ backgroundColor: '#fafafa' }}>
        <h2 className="wf-title">MOTORES DE ATRASO EM EXECUÇÃO</h2>

        {shifts.length === 0 && (
          <div className="wf-box-dashed" style={{ textAlign: 'center', margin: '40px' }}>
            <p>[ Mesa Limpa — Nenhum shift ativo ]</p>
          </div>
        )}

        <div className="wf-flex-col">
          {shifts.map(s => (
            <div key={s.id} className="wf-list-item">
              <div style={{ flex: 1 }}>
                <strong>{channelName(s.channel_id)}</strong><br />
                <span style={{ fontSize: '14px' }}>Atraso: {s.delay_seconds}s</span><br />
                <span
                  className="wf-badge"
                  style={{ marginTop: '5px', display: 'inline-block', background: s.status === 'running' ? '#000' : s.status === 'crashed' ? '#c00' : '#666' }}
                >
                  [ {STATUS_LABEL[s.status] ?? s.status} ]
                </span>
                {s.pid && <span style={{ fontSize: '11px', marginLeft: '8px' }}>PID: {s.pid}</span>}
              </div>

              <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                <div className="wf-link-box">
                  ACESSO AO SINAL:<br />
                  <span style={{ fontSize: '1.2em' }}>srt://[servidor]:{s.out_port}</span>
                </div>
              </div>

              <div style={{ flex: 1, textAlign: 'right' }}>
                <button className="wf-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => handleKill(s.id)}>
                  [ KILL ]
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

