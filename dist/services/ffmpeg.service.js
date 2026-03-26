"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFmpegService = void 0;
const child_process_1 = require("child_process");
const database_1 = require("../db/database");
const activeDaemons = {};
class FFmpegService {
    static getActivePids() {
        const pids = {};
        for (const key in activeDaemons) {
            pids[key] = activeDaemons[key]?.pid;
        }
        return pids;
    }
    static startTimeShift(shiftId, channelId, delaySeconds, outputPort) {
        if (activeDaemons[`shift_${shiftId}`])
            return { success: false, message: 'Shift already running' };
        const db = (0, database_1.getDb)();
        const channel = db.prepare('SELECT streamid FROM channels WHERE id = ?').get(channelId);
        if (!channel || !channel.streamid) {
            return { success: false, message: 'Channel not found or missing streamid' };
        }
        const nimbleHost = process.env.NIMBLE_HOST || '127.0.0.1';
        const nimblePort = process.env.NIMBLE_PORT || '8081';
        const m3u8Url = `http://${nimbleHost}:${nimblePort}/live/${channel.streamid}/playlist_dvr_timeshift-${delaySeconds}.m3u8`;
        // Command exactly as validated in MVP (Phase 1)
        const args = [
            '-re',
            '-i', m3u8Url,
            '-c', 'copy', // Raw passthrough for 0% CPU consumption
            '-pes_payload_size', '1316',
            '-f', 'mpegts',
            `srt://0.0.0.0:${outputPort}?mode=listener&latency=2000`
        ];
        const proc = (0, child_process_1.spawn)('ffmpeg', args, { stdio: 'ignore', shell: false });
        activeDaemons[`shift_${shiftId}`] = proc;
        // Update DB status to 'running'
        db.prepare('UPDATE shifts SET status = ?, pid = ? WHERE id = ?').run('running', proc.pid, shiftId);
        proc.on('close', (code) => {
            delete activeDaemons[`shift_${shiftId}`];
            // Update DB status when process dies
            (0, database_1.getDb)().prepare("UPDATE shifts SET status = 'stopped', pid = NULL WHERE id = ?").run(shiftId);
            console.log(`[FFmpeg] Shift ${shiftId} closed with code ${code}`);
        });
        proc.on('error', (err) => {
            console.error(`[FFmpeg] Shift ${shiftId} error:`, err);
            (0, database_1.getDb)().prepare("UPDATE shifts SET status = 'crashed', pid = NULL WHERE id = ?").run(shiftId);
        });
        return { success: true };
    }
    static stop(id) {
        const shiftKey = `shift_${id}`;
        if (activeDaemons[shiftKey]) {
            activeDaemons[shiftKey].kill('SIGKILL');
            delete activeDaemons[shiftKey];
            (0, database_1.getDb)().prepare("UPDATE shifts SET status = 'stopped', pid = NULL WHERE id = ?").run(id);
        }
    }
}
exports.FFmpegService = FFmpegService;
