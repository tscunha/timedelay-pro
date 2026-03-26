import React, { useState, useEffect } from 'react';
import { Activity, Clock, Server, MonitorPlay, Copy, Square, Play, Plus, Zap } from 'lucide-react';
import axios from 'axios';

// The IP of our Production Cloud where the API and Nimble live
const API_BASE = 'http://72.60.142.3:3000/api/v1';

function App() {
  const [channels, setChannels] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  
  // Forms
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelStreamID, setNewChannelStreamID] = useState('');
  
  const [selectedChannel, setSelectedChannel] = useState('');
  const [shiftDelaySeconds, setShiftDelaySeconds] = useState(1500); // 25 min default test
  const [shiftPort, setShiftPort] = useState(9011);

  // Auto-refresh state from the Nuvem
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const [chRes, shRes] = await Promise.all([
        axios.get(`${API_BASE}/channels`),
        axios.get(`${API_BASE}/shifts`)
      ]);
      setChannels(chRes.data.channels || []);
      setShifts(shRes.data.shifts || []);
    } catch (e) {
      console.error("Failed to fetch cloud status");
    }
  };

  const createChannel = async () => {
    try {
      await axios.post(`${API_BASE}/channels`, { 
        name: newChannelName, 
        streamid: newChannelStreamID 
      });
      setNewChannelName('');
      setNewChannelStreamID('');
      fetchStatus();
    } catch (error: any) {
      alert("Erro ao cadastrar canal: " + JSON.stringify(error.response?.data?.error || error.message));
    }
  };

  const createShift = async () => {
    try {
      await axios.post(`${API_BASE}/shifts`, { 
        channel_id: selectedChannel, 
        delay_seconds: shiftDelaySeconds, 
        out_port: shiftPort 
      });
      fetchStatus();
    } catch (error: any) {
       alert("Erro ao criar Shift: " + JSON.stringify(error.response?.data?.error || error.message));
    }
  };

  const deleteShift = async (id: string) => {
    if (confirm("Derrubar este Output SRT?")) {
        await axios.delete(`${API_BASE}/shifts/${id}`);
        fetchStatus();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Comando Copiado:\n${text}`);
  };

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-broadcast-700">
        <div className="flex items-center gap-3">
          <Server className="text-blue-500 w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight text-white">TimeDelay <span className="text-blue-500">CLOUD</span></h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-broadcast-800 px-4 py-2 rounded-full border border-broadcast-700">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          Conectado à VPS 72.60.142.3
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Col: Controls */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="glass-panel rounded-xl p-5 border-l-4 border-l-purple-500">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MonitorPlay className="w-5 h-5 text-purple-400"/> Cadastrar Master Ingest</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Nome da Emissora</label>
                <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full bg-broadcast-900 border border-broadcast-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="Ex: Master Brasil" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">StreamID (Chave Nimble)</label>
                <input value={newChannelStreamID} onChange={e => setNewChannelStreamID(e.target.value)} className="w-full bg-broadcast-900 border border-broadcast-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="mpegtsin_sinal1_client1" />
              </div>
              <button onClick={createChannel} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4"/> Salvar Entrada
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border-l-4 border-l-orange-500">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-400"/> Gerar Saída SRT (Atrasada)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Sinal Original (Origem)</label>
                <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)} className="w-full bg-broadcast-900 border border-broadcast-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">-- Escolha um Ingest --</option>
                  {channels.map(c => <option key={c.id} value={c.id}>{c.name} ({c.streamid})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-yaml-400 mb-1 uppercase tracking-wider text-orange-400">Atraso (Segundos)</label>
                  <input type="number" value={shiftDelaySeconds} onChange={e => setShiftDelaySeconds(Number(e.target.value))} className="w-full bg-broadcast-900 border border-orange-900/50 rounded p-2 text-sm focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider text-green-400">Porta SRT Out</label>
                  <input type="number" value={shiftPort} onChange={e => setShiftPort(Number(e.target.value))} className="w-full bg-broadcast-900 border border-green-900/50 rounded p-2 text-sm focus:border-green-500 focus:outline-none" />
                </div>
              </div>
              <button onClick={createShift} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-medium py-2 rounded transition-colors flex items-center justify-center gap-2 mt-4">
                <Plus className="w-4 h-4"/> Iniciar FFmpeg Timeshift
              </button>
            </div>
          </div>

        </div>

        {/* Right Col: Multiplex Monitor */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-500"/> Monitor de Roteamento</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {channels.map(channel => {
              const channelShifts = shifts.filter(s => s.channel_id === channel.id);
              
              return (
                <div key={channel.id} className="glass-panel rounded-xl overflow-hidden border border-blue-900/30">
                  <div className="p-4 bg-broadcast-800 flex justify-between items-center border-b border-broadcast-700">
                    <div>
                      <h3 className="font-bold text-lg text-blue-400">{channel.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">Nimble Stream ID: <span className="font-mono bg-broadcast-900 px-2 py-0.5 rounded text-white">{channel.streamid}</span></p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-broadcast-900/50">
                     <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">Descidas SRT Ativas (Shifts)</h4>
                      <div className="space-y-3">
                        {channelShifts.map(shift => (
                          <div key={shift.id} className="bg-broadcast-800 p-4 rounded-lg border border-broadcast-700 flex justify-between items-center hover:border-broadcast-600 transition-colors">
                            <div className="flex items-center gap-6">
                              
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</span>
                                {shift.status === 'running' ? (
                                    <span className="flex items-center gap-1 text-green-500 text-sm font-bold mt-1"><Activity className="w-4 h-4"/> ONLINE</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-500 text-sm font-bold mt-1"><Square className="w-4 h-4"/> OFF</span>
                                )}
                              </div>
                              
                              <div className="h-8 w-px bg-broadcast-700"></div>
                              
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Atraso Realizado</span>
                                <span className="text-lg font-bold text-orange-400">{shift.delay_seconds} Segundos</span>
                              </div>

                              <div className="h-8 w-px bg-broadcast-700"></div>
                              
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Link SRT Gerado</span>
                                <span className="font-mono text-green-400 tracking-wider">srt://72.60.142.3:{shift.out_port}</span>
                              </div>

                            </div>
                            
                            <div className="flex gap-2">
                              <button onClick={() => copyToClipboard(`ffplay -fflags nobuffer "srt://72.60.142.3:${shift.out_port}?mode=caller"`)} className="bg-broadcast-900 border border-broadcast-700 px-3 py-1.5 rounded hover:bg-blue-600 hover:border-blue-600 transition-colors text-white text-xs flex items-center gap-2" title="Copiar Comando FFplay">
                                <Copy className="w-3 h-3"/> Copiar Teste FFplay
                              </button>
                              <button onClick={() => deleteShift(shift.id)} className="bg-broadcast-900 border border-broadcast-700 px-3 py-1.5 rounded hover:bg-red-600 hover:border-red-600 transition-colors text-white text-xs flex items-center gap-2" title="Derrubar Output">
                                <Square className="w-3 h-3"/> Matar Feixe
                              </button>
                            </div>
                          </div>
                        ))}
                        {channelShifts.length === 0 && (
                          <div className="flex items-center justify-center p-6 border border-dashed border-broadcast-700 rounded-lg">
                             <p className="text-sm text-gray-500 italic">Nenhum timeshift criado. Clique em "Gerar Saída SRT" à esquerda.</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
