"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const routes_1 = require("./api/routes");
// import { initMcpServer } from './mcp'; // Will safely re-enable MCP in a later sprint task
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const ffmpeg_service_1 = require("./services/ffmpeg.service");
dotenv_1.default.config();
const server = (0, fastify_1.default)({ logger: true });
async function bootstrap() {
    await server.register(cors_1.default, { origin: '*' });
    // DB is now synchronous
    (0, database_1.initDb)();
    // Auto-Resume FFmpeg workers based on persistent DB state (Only Shifts)
    const db = (0, database_1.getDb)();
    // Ingest is handled by Nimble Streamer. We only need to resume the Timeshift output daemons.
    const shifts = db.prepare("SELECT * FROM shifts WHERE status = 'running'").all();
    for (const s of shifts) {
        server.log.info(`Auto-resuming shift ${s.id}...`);
        ffmpeg_service_1.FFmpegService.startTimeShift(s.id, s.channel_id, s.delay_seconds, s.out_port);
    }
    await (0, routes_1.setupRoutes)(server);
    // Servir frontend React em Produção
    await server.register(static_1.default, {
        root: path_1.default.join(__dirname, '../../client/dist'),
        prefix: '/',
    });
    server.get('/api/v1/health', async () => {
        return { status: 'healthy', timestamp: new Date().toISOString() };
    });
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    try {
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 TimeDelay Pro API running on port ${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
bootstrap();
