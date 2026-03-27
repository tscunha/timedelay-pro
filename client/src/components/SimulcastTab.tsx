import React, { useState } from 'react';

export default function SimulcastTab() {
  const [destinations, setDestinations] = useState([
    { id: 'yt', name: 'YOUTUBE', url: 'rtmp://a.rtmp.youtube.com/live2/XXXX', status: 'ON' },
    { id: 'fb', name: 'FACEBOOK', url: 'rtmps://live-api-s.facebook.com:443', status: 'OFF' },
    { id: 'tw', name: 'TWITCH', url: 'Chave Ausente', status: 'N/A' }
  ]);

  const toggle = (id: string, currentStatus: string) => {
    if(currentStatus === 'N/A') return;
    setDestinations(destinations.map(d => {
      if(d.id === id) {
        return { ...d, status: currentStatus === 'ON' ? 'OFF' : 'ON' };
      }
      return d;
    }));
  };

  return (
    <div className="wf-box" style={{minHeight: '400px'}}>
      <h2 className="wf-title">PAINEL DE MULTIPLEXAÇÃO DE MÍDIAS (SIMULCAST)</h2>
      
      <div className="wf-grid-3cols" style={{marginTop: '30px'}}>
         {destinations.map(dest => {
           const isOn = dest.status === 'ON';
           const isNA = dest.status === 'N/A';
           
           return (
             <div key={dest.id} className="wf-box-dashed" style={{backgroundColor: isOn ? '#fff' : '#eaeaea', borderColor: isOn ? '#000' : '#999'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                   <h3 style={{margin:0}}>{dest.name}</h3>
                   <span className="wf-badge">{dest.status}</span>
                </div>
                
                <p style={{fontSize: '12px', wordBreak: 'break-all'}}>&gt; {dest.url}</p>
                
                <hr style={{borderTop: '1px dashed #ccc', borderBottom: 'none', margin: '20px 0'}} />
                
                <button 
                  onClick={() => toggle(dest.id, dest.status)}
                  className={`wf-btn ${isOn ? 'wf-btn-dark' : ''}`}
                  disabled={isNA}
                >
                  {isNA ? '[ IMPOSSIBILITADO ]' : (isOn ? '[ DESLIGAR TRANSMISSÃO ]' : '[ ATIVAR THREAD ]')}
                </button>
             </div>
           )
         })}
      </div>
    </div>
  );
}
