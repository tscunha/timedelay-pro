import React from 'react';

export default function ComplianceTab() {
  return (
    <div className="wf-box">
      <div className="wf-flex-row" style={{borderBottom: '2px dashed #000', paddingBottom: '20px', alignItems: 'center'}}>
         <div>
            <h2 className="wf-title" style={{border: 'none', margin: 0}}>TERMINAL DE RECORDING (COMPLIANCE)</h2>
            <p style={{margin: '5px 0 0 0', fontSize: '12px'}}>LOG PASSIVO GERADO VIA MCP (TRIMMER VOD).</p>
         </div>
         <button className="wf-btn" style={{width: 'auto', padding: '10px 20px'}}>[ BAIXAR LISTA MASTER EM PDF ]</button>
      </div>
      
      <table className="wf-table" style={{marginTop: '30px'}}>
         <thead>
           <tr>
             <th>DATA E HORA DO EVENTO</th>
             <th>CÂMERA / DESTINO</th>
             <th>ARQUIVO DE VOD REGISTRADO</th>
             <th>ANÁLISE PASSIVA DE SISTEMA (M.C.P)</th>
             <th>AÇÃO LOCAL</th>
           </tr>
         </thead>
         <tbody>
           <tr>
             <td>HOJE, 10:00:00 UTC</td>
             <td>[CAM 1] ESTÚDIO A</td>
             <td>vod_esta_001.mp4</td>
             <td>[ FLUXO LIMPO / 0 DROPS ]</td>
             <td><button className="wf-btn" style={{padding: '5px 10px'}}>[ DOWNLOAD ARQUIVO ]</button></td>
           </tr>
           <tr style={{background: '#e0e0e0'}}>
             <td>HOJE, 09:00:00 UTC</td>
             <td>[CAM 2] MOCHILINK</td>
             <td>vod_mobi_002.mp4</td>
             <td>[ FALHA DE P-FRAME DETECTADA ]</td>
             <td><button className="wf-btn" style={{padding: '5px 10px'}}>[ DOWNLOAD ARQUIVO ]</button></td>
           </tr>
         </tbody>
      </table>
    </div>
  )
}
