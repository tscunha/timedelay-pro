import React, { useState } from 'react';

export default function SimulcastTab() {
  const [destinations, setDestinations] = useState([
    { id: 'yt', name: 'YouTube', url: 'rtmp://a.rtmp.youtube.com/live2/XXXX', status: 'online', color: 'red' },
    { id: 'fb', name: 'Facebook', url: 'rtmps://live-api-s.facebook.com:443', status: 'offline', color: 'blue' },
    { id: 'tw', name: 'Twitch', url: 'Chave Ausente', status: 'empty', color: 'purple' }
  ]);

  const toggle = (id: string, currentStatus: string) => {
    if(currentStatus === 'empty') return;
    setDestinations(destinations.map(d => {
      if(d.id === id) {
        return { ...d, status: currentStatus === 'online' ? 'offline' : 'online' };
      }
      return d;
    }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 fade-in">
      <div className="xl:col-span-4 space-y-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-white/5 pb-2">Patch Pannel de Redes Sociais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {destinations.map(dest => {
             const isOnline = dest.status === 'online';
             const isOff = dest.status === 'offline';
             const isEmpty = dest.status === 'empty';
             
             // Dynamic Stylings based on The Doorman Test military switches
             let cardClass = "rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border-2 ";
             let btnClass = "w-full font-black tracking-widest uppercase py-4 rounded-xl transition-colors ";
             let statusBadgeClass = "text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase ";

             if(isOnline) {
                cardClass += `border-${dest.color}-600 shadow-[0_0_20px_rgba(255,0,0,0.15)] bg-[#0a0a0a] group`;
                btnClass += `bg-${dest.color}-600 text-white shadow-lg cursor-pointer`;
                statusBadgeClass += `bg-${dest.color}-600 text-white`;
             } else if (isOff) {
                cardClass += `border-gray-800 bg-[#0a0a0a] opacity-80`;
                btnClass += `border border-gray-700 text-gray-500 hover:text-white cursor-pointer`;
                statusBadgeClass += `bg-gray-800 text-gray-400`;
             } else {
                cardClass += `border-gray-800 bg-[#050505] opacity-50`;
                btnClass += `bg-transparent text-gray-700 cursor-not-allowed`;
                statusBadgeClass += `bg-transparent text-gray-600`;
             }

             return (
               <div key={dest.id} className={cardClass}>
                  {isOnline && <div className={`absolute top-0 left-0 w-2 h-full bg-${dest.color}-600 shadow-[0_0_15px_red]`}></div>}
                  <div className={`flex justify-between items-start mb-8 ${isOnline ? 'pl-4' : ''}`}>
                     <div>
                       <h3 className={`text-2xl font-black uppercase tracking-widest ${isOnline ? 'text-white' : 'text-gray-500'}`}>{dest.name}</h3>
                       <p className={`text-xs font-mono-tech mt-1 truncate max-w-[200px] ${isOnline ? `text-${dest.color}-400` : 'text-gray-600'}`}>{dest.url}</p>
                     </div>
                     <div className={statusBadgeClass}>{dest.status === 'empty' ? 'OFFLINE' : (isOnline ? 'ON-AIR' : 'PARADO')}</div>
                  </div>
                  <button 
                    onClick={() => toggle(dest.id, dest.status)}
                    className={btnClass}
                  >
                    {isEmpty ? 'INOPERANTE' : (isOnline ? 'DERRUBAR (KLL)' : 'ACIONAR ROTA')}
                  </button>
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
}
