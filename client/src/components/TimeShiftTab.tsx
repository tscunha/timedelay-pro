import React, { useState } from 'react';

export default function TimeShiftTab({ cameras }: { cameras: any[] }) {
  const [shifts, setShifts] = useState<any[]>([
    { id: '1', name: '[CAM 1] ESTÚDIO A', delay: 3600, port: 9011, online: true }
  ]);
  const [selectedCam, setSelectedCam] = useState('');
  const [delay, setDelay] = useState(3600);

  const handleEngage = () => {
    if(!selectedCam) return alert('Selecione um Sinal');
    setShifts([...shifts, { 
      id: Date.now().toString(), 
      name: cameras.find(c => c.id === selectedCam)?.name, 
      delay, 
      port: 9015 + shifts.length, 
      online: true 
    }]);
  };

  return (
    <div className="wf-grid-3-1">
      {/* Coluna 1: Painel de Comando */}
      <div className="wf-box">
         <h2 className="wf-title">CRIAR NOVO ATRASO</h2>
         
         <label className="wf-label">[1] SELECIONAR SINAL DE ORIGEM</label>
         <select className="wf-input" value={selectedCam} onChange={e => setSelectedCam(e.target.value)}>
           <option value="">-- ESCOLHER ORIGEM --</option>
           {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         
         <label className="wf-label" style={{marginTop:'20px'}}>[2] ESPECIFICAR ATRASO (EM SEGUNDOS)</label>
         <input type="number" className="wf-input huge" value={delay} onChange={e => setDelay(Number(e.target.value))} />
         <p style={{textAlign: 'center', fontSize: '12px', marginTop: '-10px'}}>Ex: 1 hora = 3600</p>
         
         <button className="wf-btn wf-btn-dark" onClick={handleEngage} style={{marginTop:'20px'}}>
           [ ENVIAR COMANDO DE ENGATE (ENGAGE) ]
         </button>
      </div>
      
      {/* Coluna 2: Monitoramento */}
      <div className="wf-box" style={{backgroundColor: '#fafafa'}}>
         <h2 className="wf-title">MOTORES DE ATRASO EM EXECUÇÃO</h2>
         
         {shifts.length === 0 && (
           <div className="wf-box-dashed" style={{textAlign: 'center', margin: '40px'}}>
             <p>[ Nenhuma operação local ativa - Mesa Limpa ]</p>
           </div>
         )}

         <div className="wf-flex-col">
            {shifts.map(s => (
              <div key={s.id} className="wf-list-item">
                 <div style={{flex: 1}}>
                   <strong>{s.name}</strong><br/>
                   <span style={{fontSize: '14px'}}>Engrenagem configurada para {s.delay} Segundos</span><br/>
                   <span className="wf-badge" style={{marginTop: '5px', display: 'inline-block'}}>[ STATUS: NO AR ]</span>
                 </div>
                 
                 <div style={{flex: 2, display: 'flex', justifyContent: 'center'}}>
                    <div className="wf-link-box">
                       ACESSO AO SINAL: <br/> 
                       <span style={{fontSize:'1.2em'}}>srt://[ip-servidor]:{s.port}</span>
                    </div>
                 </div>
                 
                 <div style={{flex: 1, textAlign: 'right'}}>
                    <button className="wf-btn" style={{width: 'auto', padding: '10px 20px'}} onClick={() => setShifts(shifts.filter(x => x.id !== s.id))}>
                      [ MATAR (KILL) ]
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}
