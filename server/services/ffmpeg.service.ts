import { spawn, ChildProcess } from 'child_process';
import { getDb } from '../db/database';

interface FfmpegProcessMap {
  [id: string]: ChildProcess;
}

const activeDaemons: FfmpegProcessMap = {};

export class FFmpegService {
  static getActivePids() {
    const pids: Record<string, number | undefined> = {};
    for (const key in activeDaemons) {
      pids[key] = activeDaemons[key]?.pid;
    }
    return pids;
  }
  
  static startTimeShift(shiftId: string, channelId: string, delaySeconds: number, outputPort: number): { success: boolean, message?: string } {
    if (activeDaemons[`shift_${shiftId}`]) return { success: false, message: 'Shift already running' };

    const db = getDb();
    const channel = db.prepare('SELECT streamid FROM channels WHERE id = ?').get(channelId) as any;
    
    if (!channel || !channel.streamid) {
       return { success: false, message: 'Channel not found or missing streamid' };
    }

    const nimbleHost = process.env.NIMBLE_HOST || '127.0.0.1';
    const nimblePort = process.env.NIMBLE_PORT || '8081';
    const m3u8Url = `http://${nimbleHost}:${nimblePort}/live/${channel.streamid}/playlist_dvr_timeshift-${delaySeconds}.m3u8`;
    
    // Command exactly as validated in MVP
    const args = [
      '-re',
      '-i', m3u8Url,
      '-c', 'copy',
      '-pes_payload_size', '1316',
      '-f', 'mpegts',
      `srt://0.0.0.0:${outputPort}?mode=listener&latency=2000`
    ];

    const proc = spawn('ffmpeg', args, { stdio: 'ignore', shell: false });
    activeDaemons[`shift_${shiftId}`] = proc;

    // Update DB status to 'running'
    db.prepare('UPDATE shifts SET status = ?, pid = ? WHERE id = ?').run('running', proc.pid, shiftId);

    proc.on('close', (code) => { 
      delete activeDaemons[`shift_${shiftId}`]; 
      
      const currentShift = getDb().prepare('SELECT status FROM shifts WHERE id = ?').get(shiftId) as any;
      
      // Se o status no DB ainda for 'running', significa que o client (ffplay) desconectou e o ffmpeg morreu.
      // Neste caso, nós REINICIAMOS a transmissão imediatamente para ficar "sempre ativo"!
      if (currentShift && currentShift.status === 'running') {
         console.log(`[FFmpeg Keep-Alive] O Client desconectou do Shift ${shiftId}. Reiniciando o listener em 1s...`);
         setTimeout(() => {
             FFmpegService.startTimeShift(shiftId, channelId, delaySeconds, outputPort);
         }, 1000);
      } else {
         // O usuário apagou/pausou o feixe pelo Dashboard
         console.log(`[FFmpeg] Shift ${shiftId} foi encerrado permanentemente (código ${code})`);
      }
    });

    proc.on('error', (err) => {
      console.error(`[FFmpeg] Shift ${shiftId} error:`, err);
      // Tentará auto-reiniciar pelo evento close caso seja uma morte súbita
    });

    return { success: true };
  }

  static stop(id: string) {
    const shiftKey = `shift_${id}`;
    // Set to intentional stop instantly to prevent auto-respawn
    getDb().prepare("UPDATE shifts SET status = 'stopped', pid = NULL WHERE id = ?").run(id);
    
    if (activeDaemons[shiftKey]) {
      activeDaemons[shiftKey].kill('SIGKILL');
      delete activeDaemons[shiftKey];
    }
  }
}
