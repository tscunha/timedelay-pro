import React, { useState } from 'react';

export default function RemiTab({ cameras }: { cameras: any[] }) {
  const [routes, setRoutes] = useState<any[]>([
    { id: '1', origin: '[CAM 2] MOCHILINK', dest: 'srt://[decoder]:9050', latency: '200ms', loss: '0%' }
  ]);
  const [selectedCam, setSelectedCam] = useState('');

  const handleEngage = () => {
    if(!selectedCam) return alert('Selecione Origem!');
    setRoutes([{
      id: Date.now().toString(),
      origin: cameras.find(c => c.id === selectedCam)?.name,
      dest: `srt://192.168.1.10:${9050 + routes.length}`,
      latency: '200ms',
      loss: '0%'
    }, ...routes]);
  };

  return (
    <div className="wf-grid-3-1">
      <div className="wf-box">
         <h2 className="wf-title">PATCH PANEL DE ROTEAMENTO</h2>
         
         <label className="wf-label">SINAL DE ORIGEM (MOCHILINK/CALLER)</label>
         <select className="wf-input" value={selectedCam} onChange={e => setSelectedCam(e.target.value)}>
           <option value="">-- ESCOLHER ORIGEM --</option>
           {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         
         <label className="wf-label" style={{marginTop:'15px'}}>MODO DE MATRIZ</label>
         <select className="wf-input">
           <option>SRT LISTENER (Aguardar Caller)</option>
           <option>SRT CALLER (Empurrar sinal)</option>
         </select>
         
         <button className="wf-btn wf-btn-dark" onClick={handleEngage} style={{marginTop:'20px'}}>
           [ LIGAR ROTA DE BAIXA LATÊNCIA ]
         </button>
      </div>
      
      <div className="wf-box" style={{backgroundColor: '#fafafa'}}>
         <h2 className="wf-title">ACOMPANHAMENTO DE ROTAS ATIVAS</h2>
         
         <div className="wf-flex-col">
            {routes.map(r => (
              <div key={r.id} className="wf-list-item" style={{display: 'flex', padding:'20px'}}>
                 
                 <div style={{flex: 1, borderRight: '1px dashed #000'}}>
                    <span style={{fontSize: '12px', fontWeight: 'bold'}}>ORIGEM:</span><br/>
                    <strong>{r.origin}</strong>
                 </div>
                 
                 <div style={{flex: 2, textAlign: 'center', padding: '0 20px', borderRight: '1px dashed #000'}}>
                    <span style={{fontSize: '12px', fontWeight: 'bold'}}>MÉTRICAS DA REDE (SIMULADA):</span><br/>
                    <span>Loss: {r.loss} | Buffer: {r.latency}</span>
                 </div>
                 
                 <div style={{flex: 2, textAlign: 'right', display: 'flex', justifyContent: 'space-between', paddingLeft:'20px'}}>
                    <div>
                      <span style={{fontSize: '12px', fontWeight: 'bold'}}>DESTINO:</span><br/>
                      <strong>{r.dest}</strong>
                    </div>
                    <button className="wf-btn" style={{width: 'auto', height: '100%'}} onClick={() => setRoutes(routes.filter(x => x.id !== r.id))}>
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
