import { FastifyInstance } from 'fastify';
import { getDb } from '../db/database';
import { FFmpegService } from '../services/ffmpeg.service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const CreateChannelSchema = z.object({
  name: z.string().min(1).max(100),
  streamid: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, 'StreamID must be alphanumeric'),
});

const SpawnShiftSchema = z.object({
  channel_id: z.string().uuid(),
  delay_seconds: z.number().int().min(0).max(259200),
  out_port: z.number().int().min(1024).max(65535),
});

const SpawnRemiSchema = z.object({
  channel_id: z.string().uuid(),
  out_port: z.number().int().min(1024).max(65535),
});

const SpawnSimulcastSchema = z.object({
  channel_id: z.string().uuid(),
  destination_name: z.string(),
  rtmp_url: z.string().url(),
});

const SpawnComplianceSchema = z.object({
  channel_id: z.string().uuid(),
  output_path: z.string(),
});

const IdParamSchema = z.object({ id: z.string().uuid() });

export async function setupRoutes(server: FastifyInstance) {
  
  server.addHook('preValidation', async (request, reply) => {
    (request as any).tenant_id = 'tenant123';
  });

  server.get('/api/v1/channels', async (request, reply) => {
    const db = getDb();
    const channels = db.prepare('SELECT * FROM channels WHERE tenant_id = ?').all((request as any).tenant_id);
    return reply.send({ success: true, channels });
  });

  server.post('/api/v1/channels', async (request, reply) => {
    try {
      const { name, streamid } = CreateChannelSchema.parse(request.body);
      const id = uuidv4();
      getDb().prepare('INSERT INTO channels (id, tenant_id, name, streamid) VALUES (?, ?, ?, ?)').run(id, (request as any).tenant_id, name, streamid);
      return reply.code(201).send({ success: true, id });
    } catch (e: any) { return reply.code(400).send({ success: false, error: e.issues || e.message }); }
  });

  // ========== SHIFTS (A) ==========
  server.get('/api/v1/shifts', async (request, reply) => {
    const shifts = getDb().prepare('SELECT * FROM shifts WHERE tenant_id = ?').all((request as any).tenant_id);
    return reply.send({ success: true, shifts });
  });

  server.post('/api/v1/shifts', async (request, reply) => {
    try {
      const { channel_id, delay_seconds, out_port } = SpawnShiftSchema.parse(request.body);
      const id = uuidv4();
      getDb().prepare('INSERT INTO shifts (id, tenant_id, channel_id, delay_seconds, out_port) VALUES (?, ?, ?, ?, ?)').run(id, (request as any).tenant_id, channel_id, delay_seconds, out_port);
      FFmpegService.startTimeShift(id, channel_id, delay_seconds, out_port);
      return reply.code(201).send({ success: true, id });
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return reply.code(409).send({ success: false, error: `Porta ${(request.body as any)?.out_port} já está ocupada por outro shift. Escolha uma porta diferente.` });
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  // ========== REMI (B) ==========
  server.get('/api/v1/remi', async (request, reply) => {
    const remi = getDb().prepare('SELECT * FROM remi WHERE tenant_id = ?').all((request as any).tenant_id);
    return reply.send({ success: true, remi });
  });

  server.post('/api/v1/remi', async (request, reply) => {
    try {
      const { channel_id, out_port } = SpawnRemiSchema.parse(request.body);
      const id = uuidv4();
      getDb().prepare('INSERT INTO remi (id, tenant_id, channel_id, out_port) VALUES (?, ?, ?, ?)').run(id, (request as any).tenant_id, channel_id, out_port);
      FFmpegService.startRemi(id, channel_id, out_port);
      return reply.code(201).send({ success: true, id });
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return reply.code(409).send({ success: false, error: `Porta ${(request.body as any)?.out_port} já está ocupada por outra rota REMI.` });
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  // ========== SIMULCAST (C) ==========
  server.get('/api/v1/simulcasts', async (request, reply) => {
    const simulcasts = getDb().prepare('SELECT * FROM simulcasts WHERE tenant_id = ?').all((request as any).tenant_id);
    return reply.send({ success: true, simulcasts });
  });

  server.post('/api/v1/simulcasts', async (request, reply) => {
    try {
        const { channel_id, destination_name, rtmp_url } = SpawnSimulcastSchema.parse(request.body);
        const id = uuidv4();
        getDb().prepare('INSERT INTO simulcasts (id, tenant_id, channel_id, destination_name, rtmp_url) VALUES (?, ?, ?, ?, ?)').run(id, (request as any).tenant_id, channel_id, destination_name, rtmp_url);
        FFmpegService.startSimulcast(id, channel_id, rtmp_url);
        return reply.code(201).send({ success: true, id });
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return reply.code(409).send({ success: false, error: 'Este canal já possui um simulcast ativo para este destino.' });
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  // ========== COMPLIANCE (D) ==========
  server.get('/api/v1/compliance', async (request, reply) => {
    const compliance = getDb().prepare('SELECT * FROM compliance WHERE tenant_id = ?').all((request as any).tenant_id);
    return reply.send({ success: true, compliance });
  });

  server.post('/api/v1/compliance', async (request, reply) => {
    try {
        const { channel_id, output_path } = SpawnComplianceSchema.parse(request.body);
        const id = uuidv4();
        getDb().prepare('INSERT INTO compliance (id, tenant_id, channel_id, output_path) VALUES (?, ?, ?, ?)').run(id, (request as any).tenant_id, channel_id, output_path);
        FFmpegService.startCompliance(id, channel_id, output_path);
        return reply.code(201).send({ success: true, id });
    } catch (e: any) {
      if (e?.code === 'SQLITE_CONSTRAINT_UNIQUE') return reply.code(409).send({ success: false, error: 'Este canal já possui uma sessão de compliance ativa.' });
      return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });

  // ========== GENERIC KILLER ==========
  server.delete('/api/v1/:type/:id', async (request, reply) => {
    try {
      const { type, id } = request.params as any;
      IdParamSchema.parse({ id });
      
      const tables = ['shifts', 'remi', 'simulcasts', 'compliance'];
      if (!tables.includes(type)) return reply.code(400).send({ error: 'Invalid module type' });

      getDb().prepare(`DELETE FROM ${type} WHERE id = ?`).run(id);
      
      const jobTypes: any = { shifts: 'shift', remi: 'remi', simulcasts: 'simulcast', compliance: 'compliance' };
      FFmpegService.stop(jobTypes[type], id);

      return reply.send({ success: true, message: 'Daemon Killed' });
    } catch (e: any) {
       return reply.code(400).send({ success: false, error: e.issues || e.message });
    }
  });
}
