import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { initDb, getDb } from './db/database';
import { setupRoutes } from './api/routes';
// import { initMcpServer } from './mcp'; // Will safely re-enable MCP in a later sprint task
import fastifyStatic from '@fastify/static';
import path from 'path';
import { FFmpegService } from './services/ffmpeg.service';

dotenv.config();

const server = Fastify({ logger: true });

async function bootstrap() {
  await server.register(cors, { origin: '*' });

  // DB is now synchronous
  initDb();
  
  // Auto-Resume FFmpeg workers based on persistent DB state (Only Shifts)
  const db = getDb();
  
  // Ingest is handled by Nimble Streamer. We only need to resume the Timeshift output daemons.
  const shifts = db.prepare("SELECT * FROM shifts WHERE status = 'running'").all() as any[];
  for (const s of shifts) {
      server.log.info(`Auto-resuming TimeShift ${s.id} (Trator Mode)`);
      FFmpegService.startTimeShift(s.id, s.channel_id, s.delay_seconds, s.out_port);
  }

  const remis = db.prepare("SELECT * FROM remi WHERE status = 'running'").all() as any[];
  for (const r of remis) {
      server.log.info(`Auto-resuming REMI ${r.id} (Trator Mode)`);
      FFmpegService.startRemi(r.id, r.channel_id, r.out_port);
  }

  const simulcasts = db.prepare("SELECT * FROM simulcasts WHERE status = 'running'").all() as any[];
  for (const sm of simulcasts) {
      server.log.info(`Auto-resuming Simulcast ${sm.id} (Trator Mode)`);
      FFmpegService.startSimulcast(sm.id, sm.channel_id, sm.rtmp_url);
  }

  const compliances = db.prepare("SELECT * FROM compliance WHERE status = 'running'").all() as any[];
  for (const c of compliances) {
      server.log.info(`Auto-resuming Compliance Dumper ${c.id} (Trator Mode)`);
      FFmpegService.startCompliance(c.id, c.channel_id, c.output_path);
  }

  await setupRoutes(server);
  
  // Servir frontend React em Produção (Sprint 3)
  /*
  await server.register(fastifyStatic, {
    root: path.join(__dirname, '../client/dist'),
    prefix: '/',
  });
  */

  server.get('/api/v1/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 TimeDelay Pro API running on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap();
