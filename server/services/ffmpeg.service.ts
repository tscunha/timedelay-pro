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

  private static getChannel(channelId: string) {
    return getDb().prepare('SELECT streamid FROM channels WHERE id = ?').get(channelId) as any;
  }

  private static getNimbleBaseUrl() {
      const nimbleHost = process.env.NIMBLE_HOST || '127.0.0.1';
      const nimblePort = process.env.NIMBLE_PORT || '8081';
      return `http://${nimbleHost}:${nimblePort}/live`;
  }

  // ============================================
  // APLICAÇÃO A: TIMESHIFT (Delay SRT Engine)
  // ============================================
  static startTimeShift(id: string, channelId: string, delaySeconds: number, outputPort: number): { success: boolean, message?: string } {
    const procKey = `shift_${id}`;
    if (activeDaemons[procKey]) return { success: false, message: 'Process already running' };

    const channel = this.getChannel(channelId);
    if (!channel) return { success: false, message: 'Channel not found' };

    const m3u8Url = `${this.getNimbleBaseUrl()}/${channel.streamid}/playlist_dvr_timeshift-${delaySeconds}.m3u8`;
    
    // Command strictly using Tractor Philosophy
    const args = [
      '-re', '-i', m3u8Url, '-c', 'copy', '-pes_payload_size', '1316', '-f', 'mpegts',
      `srt://0.0.0.0:${outputPort}?mode=listener&latency=2000`
    ];

    return this.spawnDaemon(procKey, args, 'shifts', id, () => this.startTimeShift(id, channelId, delaySeconds, outputPort));
  }

  // ============================================
  // APLICAÇÃO B: REMI (Low Latency Routing)
  // ============================================
  static startRemi(id: string, channelId: string, outputPort: number): { success: boolean, message?: string } {
    const procKey = `remi_${id}`;
    if (activeDaemons[procKey]) return { success: false, message: 'Process already running' };

    const channel = this.getChannel(channelId);
    if (!channel) return { success: false, message: 'Channel not found' };

    const m3u8Url = `${this.getNimbleBaseUrl()}/${channel.streamid}/playlist.m3u8`;
    
    // REMI: Ultra-low latency args (No Delay buffer)
    const args = [
      '-i', m3u8Url, '-c', 'copy', '-pes_payload_size', '1316', '-f', 'mpegts',
      `srt://0.0.0.0:${outputPort}?mode=listener&latency=200`
    ];

    return this.spawnDaemon(procKey, args, 'remi', id, () => this.startRemi(id, channelId, outputPort));
  }

  // ============================================
  // APLICAÇÃO C: SIMULCAST (Social Restreaming)
  // ============================================
  static startSimulcast(id: string, channelId: string, rtmpUrl: string): { success: boolean, message?: string } {
    const procKey = `simulcast_${id}`;
    if (activeDaemons[procKey]) return { success: false, message: 'Process already running' };

    const channel = this.getChannel(channelId);
    if (!channel) return { success: false, message: 'Channel not found' };

    const m3u8Url = `${this.getNimbleBaseUrl()}/${channel.streamid}/playlist.m3u8`;
    
    const args = [
      '-re', '-i', m3u8Url, '-c', 'copy', '-f', 'flv', rtmpUrl
    ];

    return this.spawnDaemon(procKey, args, 'simulcasts', id, () => this.startSimulcast(id, channelId, rtmpUrl));
  }

  // ============================================
  // APLICAÇÃO D: COMPLIANCE (Passive VOD Dumper)
  // ============================================
  static startCompliance(id: string, channelId: string, outputPath: string): { success: boolean, message?: string } {
    const procKey = `compliance_${id}`;
    if (activeDaemons[procKey]) return { success: false, message: 'Process already running' };

    const channel = this.getChannel(channelId);
    if (!channel) return { success: false, message: 'Channel not found' };

    const m3u8Url = `${this.getNimbleBaseUrl()}/${channel.streamid}/playlist.m3u8`;
    
    // Minimal CPU profile for continuous chunking
    const args = [
      '-i', m3u8Url, '-c', 'copy', '-f', 'segment', '-segment_time', '3600', '-reset_timestamps', '1', `${outputPath}/compliance_${channel.streamid}_%Y%m%d%H%M%S.mp4`
    ];

    return this.spawnDaemon(procKey, args, 'compliance', id, () => this.startCompliance(id, channelId, outputPath));
  }

  // ============================================
  // ENGINE CORE: The Zombie Spawner
  // ============================================
  private static spawnDaemon(procKey: string, args: string[], tableName: string, dbId: string, restartCallback: () => void) {
    const db = getDb();
    const proc = spawn('ffmpeg', args, { stdio: 'ignore', shell: false });
    activeDaemons[procKey] = proc;

    db.prepare(`UPDATE ${tableName} SET status = ?, pid = ? WHERE id = ?`).run('running', proc.pid, dbId);

    proc.on('close', (code) => { 
      delete activeDaemons[procKey]; 
      
      const currentJob = getDb().prepare(`SELECT status FROM ${tableName} WHERE id = ?`).get(dbId) as any;
      
      // The "No Handshake" Keep-Alive Rule
      if (currentJob && currentJob.status === 'running') {
         console.log(`[FFmpeg Zombie] O Client desconectou ou perdeu a fonte do ${procKey}. Reiniciando o motor subnível em 1s...`);
         setTimeout(restartCallback, 1000);
      } else {
         console.log(`[FFmpeg] ${procKey} encerrado permanentemente pelo Orquestrador (código ${code})`);
      }
    });

    proc.on('error', (err) => {
      console.error(`[FFmpeg] ${procKey} error:`, err);
    });

    return { success: true };
  }

  static stop(jobType: 'shift' | 'remi' | 'simulcast' | 'compliance', id: string) {
    const tableName = jobType === 'shift' ? 'shifts' : jobType === 'simulcast' ? 'simulcasts' : jobType;
    const procKey = `${jobType}_${id}`;
    
    getDb().prepare(`UPDATE ${tableName} SET status = 'stopped', pid = NULL WHERE id = ?`).run(id);
    
    if (activeDaemons[procKey]) {
      activeDaemons[procKey].kill('SIGKILL');
      delete activeDaemons[procKey];
    }
  }

  static stopAny(id: string) {
      this.stop('shift', id);
      this.stop('remi', id);
      this.stop('simulcast', id);
      this.stop('compliance', id);
  }
}
