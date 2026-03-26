"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const database_1 = require("../db/database");
const ffmpeg_service_1 = require("../services/ffmpeg.service");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
// Zod Schemas for Runtime Type Safety and Input Validation
const CreateChannelSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    streamid: zod_1.z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, 'StreamID must be alphanumeric with underscores'),
});
const SpawnShiftSchema = zod_1.z.object({
    channel_id: zod_1.z.string().uuid(),
    delay_seconds: zod_1.z.number().int().min(0).max(259200), // Max 3 days
    out_port: zod_1.z.number().int().min(1024).max(65535),
});
const IdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid()
});
async function setupRoutes(server) {
    // Mocking JWT Auth Middleware for Sprint 2 (Tenant extraction)
    server.addHook('preValidation', async (request, reply) => {
        // In Sprint 3, this will use 'jose' to verify the JWT Bearer token
        // For now, we mock a strict tenant isolation:
        request.tenant_id = 'tenant123';
    });
    server.get('/api/v1/channels', async (request, reply) => {
        const tenant_id = request.tenant_id;
        const db = (0, database_1.getDb)();
        const channels = db.prepare('SELECT * FROM channels WHERE tenant_id = ?').all(tenant_id);
        return reply.send({ success: true, channels });
    });
    server.post('/api/v1/channels', async (request, reply) => {
        try {
            const { name, streamid } = CreateChannelSchema.parse(request.body);
            const tenant_id = request.tenant_id;
            const db = (0, database_1.getDb)();
            const id = (0, uuid_1.v4)();
            db.prepare('INSERT INTO channels (id, tenant_id, name, streamid) VALUES (?, ?, ?, ?)')
                .run(id, tenant_id, name, streamid);
            // Note: We NO LONGER spawn Ingest FFmpeg nodes here.
            // Nimble Streamer handles the SRT Ingestion and ring-buffer natively!
            return reply.code(201).send({ success: true, id, message: 'Channel created. Nimble is ready to ingest.' });
        }
        catch (e) {
            server.log.error(e);
            return reply.code(400).send({ success: false, error: e.issues || e.message });
        }
    });
    server.get('/api/v1/shifts', async (request, reply) => {
        const tenant_id = request.tenant_id;
        const db = (0, database_1.getDb)();
        const shifts = db.prepare('SELECT * FROM shifts WHERE tenant_id = ?').all(tenant_id);
        return reply.send({ success: true, shifts });
    });
    server.post('/api/v1/shifts', async (request, reply) => {
        try {
            const { channel_id, delay_seconds, out_port } = SpawnShiftSchema.parse(request.body);
            const tenant_id = request.tenant_id;
            const db = (0, database_1.getDb)();
            // Ensure channel belongs to tenant
            const channel = db.prepare('SELECT * FROM channels WHERE id = ? AND tenant_id = ?').get(channel_id, tenant_id);
            if (!channel) {
                return reply.code(404).send({ success: false, error: 'Channel not found or isolated' });
            }
            const id = (0, uuid_1.v4)();
            db.prepare('INSERT INTO shifts (id, tenant_id, channel_id, delay_seconds, out_port) VALUES (?, ?, ?, ?, ?)').run(id, tenant_id, channel_id, delay_seconds, out_port);
            // Spawn the FFmpeg Orchestrator process linking Nimble to the Output Port
            const result = ffmpeg_service_1.FFmpegService.startTimeShift(id, channel_id, delay_seconds, out_port);
            if (!result.success)
                throw new Error(result.message);
            return reply.code(201).send({ success: true, id, message: 'Timeshift Output Daemon actively running' });
        }
        catch (e) {
            return reply.code(400).send({ success: false, error: e.issues || e.message });
        }
    });
    server.delete('/api/v1/shifts/:id', async (request, reply) => {
        try {
            const { id } = IdParamSchema.parse(request.params);
            const tenant_id = request.tenant_id;
            const db = (0, database_1.getDb)();
            const shift = db.prepare('SELECT * FROM shifts WHERE id = ? AND tenant_id = ?').get(id, tenant_id);
            if (!shift) {
                return reply.code(404).send({ success: false, error: 'Shift not found' });
            }
            ffmpeg_service_1.FFmpegService.stop(id);
            db.prepare('DELETE FROM shifts WHERE id = ?').run(id);
            return reply.send({ success: true, message: 'Shift killed gracefully' });
        }
        catch (e) {
            return reply.code(400).send({ success: false, error: e.issues || e.message });
        }
    });
    // Nimble handles the HLS Playlists now!
    // The legacy internal /live/:channelId/:playlistFile buffer logic was completely removed from the Node.js backend.
}
