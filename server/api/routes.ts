import { FastifyInstance } from 'fastify';
import { getDb } from '../db/database';
import { FFmpegService } from '../services/ffmpeg.service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Zod Schemas for Runtime Type Safety and Input Validation
const CreateChannelSchema = z.object({
  name: z.string().min(1).max(100),
  streamid: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, 'StreamID must be alphanumeric with underscores'),
});

const SpawnShiftSchema = z.object({
  channel_id: z.string().uuid(),
  delay_seconds: z.number().int().min(0).max(259200), // Max 3 days
  out_port: z.number().int().min(1024).max(65535),
});

const IdParamSchema = z.object({
  id: z.string().uuid()
});

export async function setupRoutes(server: FastifyInstance) {
  
  // Mocking JWT Auth Middleware for Sprint 2 (Tenant extraction)
  server.addHook('preValidation', async (request, reply) => {
    // In Sprint 3, this will use 'jose' to verify the JWT Bearer token
    // For now, we mock a strict tenant isolation:
    (request as any).tenant_id = 'tenant123';
  });

  server.get('/api/v1/channels', async (request, reply) => {
    const tenant_id = (request as any).tenant_id;
    const db = getDb();
    const channels = db.prepare('SELECT * FROM channels WHERE tenant_id = ?').all(tenant_id);
    return reply.send({ success: true, channels });
  });

  server.post('/api/v1/channels', async (request, reply) => {
    try {
      const { name, streamid } = CreateChannelSchema.parse(request.body);
      const tenant_id = (request as any).tenant_id;
      const db = getDb();
      
      const id = uuidv4();
      
      db.prepare('INSERT INTO channels (id, tenant_id, name, streamid) VALUES (?, ?, ?, ?)')
        .run(id, tenant_id, name, streamid);
        
      // Note: We NO LONGER spawn Ingest FFmpeg nodes here.
      // Nimble Streamer handles the SRT Ingestion and ring-buffer natively!
      
      return reply.code(201).send({ success: true, id, message: 'Channel created. Nimble is ready to ingest.' });
    } catch (e: any) {
      server.log.error(e);
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  server.get('/api/v1/shifts', async (request, reply) => {
    const tenant_id = (request as any).tenant_id;
    const db = getDb();
    const shifts = db.prepare('SELECT * FROM shifts WHERE tenant_id = ?').all(tenant_id);
    return reply.send({ success: true, shifts });
  });

  server.post('/api/v1/shifts', async (request, reply) => {
    try {
      const { channel_id, delay_seconds, out_port } = SpawnShiftSchema.parse(request.body);
      const tenant_id = (request as any).tenant_id;
      const db = getDb();

      // Ensure channel belongs to tenant
      const channel = db.prepare('SELECT * FROM channels WHERE id = ? AND tenant_id = ?').get(channel_id, tenant_id);
      if (!channel) {
         return reply.code(404).send({ success: false, error: 'Channel not found or isolated' });
      }

      const id = uuidv4();
      db.prepare(
        'INSERT INTO shifts (id, tenant_id, channel_id, delay_seconds, out_port) VALUES (?, ?, ?, ?, ?)'
      ).run(id, tenant_id, channel_id, delay_seconds, out_port);

      // Spawn the FFmpeg Orchestrator process linking Nimble to the Output Port
      const result = FFmpegService.startTimeShift(id, channel_id, delay_seconds, out_port);

      if (!result.success) throw new Error(result.message);

      return reply.code(201).send({ success: true, id, message: 'Timeshift Output Daemon actively running' });
    } catch (e: any) {
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  server.delete('/api/v1/shifts/:id', async (request, reply) => {
    try {
      const { id } = IdParamSchema.parse(request.params);
      const tenant_id = (request as any).tenant_id;
      const db = getDb();

      const shift = db.prepare('SELECT * FROM shifts WHERE id = ? AND tenant_id = ?').get(id, tenant_id);
      if (!shift) {
        return reply.code(404).send({ success: false, error: 'Shift not found' });
      }

      FFmpegService.stop(id);
      db.prepare('DELETE FROM shifts WHERE id = ?').run(id);

      return reply.send({ success: true, message: 'Shift killed gracefully' });
    } catch (e: any) {
       return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  // Nimble handles the HLS Playlists now!
  // The legacy internal /live/:channelId/:playlistFile buffer logic was completely removed from the Node.js backend.
}
