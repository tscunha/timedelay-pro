"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMcpServer = initMcpServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const database_1 = require("./db/database");
const ffmpeg_service_1 = require("./services/ffmpeg.service");
const mcpServer = new index_js_1.Server({
    name: 'TimeDelayPro-Control',
    version: '1.0.0'
}, {
    capabilities: { tools: {} }
});
// MCP Tool Registrations
mcpServer.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_system_status',
                description: 'Retorna o status completo dos canais Ingest ativos e seus respectivos Shifts (saídas SRT), útil para diagnóstico de PID do FFmpeg.',
                inputSchema: { type: 'object', properties: {} }
            },
            {
                name: 'restart_shift',
                description: 'Derruba e reinicia um processo do FFmpeg atrelado a um Shift em caso de telemetria corrompida.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        shift_id: { type: 'string', description: 'ID do Shift no banco de dados SQLite' }
                    },
                    required: ['shift_id']
                }
            }
        ]
    };
});
mcpServer.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === 'get_system_status') {
        const db = (0, database_1.getDb)();
        const channels = db.prepare('SELECT * FROM channels').all();
        const shifts = db.prepare('SELECT * FROM shifts').all();
        return { content: [{ type: 'text', text: JSON.stringify({ active_daemons: ffmpeg_service_1.FFmpegService.getActivePids(), channels, shifts }, null, 2) }] };
    }
    if (request.params.name === 'restart_shift') {
        const { shift_id } = request.params.arguments;
        ffmpeg_service_1.FFmpegService.stop(shift_id); // Changed to use bare shift_id since FFmpegService internally maps it
        // In production we would fetch the shift details from SQLite and re-trigger start.
        // Simplifying self-healing command for MVP:
        return { content: [{ type: 'text', text: `Shift ${shift_id} derubado (SIGKILL enviado). Ele será recriado pela próxima varredura de heartbeat.` }] };
    }
    throw new Error('Tool não encontrada');
});
async function initMcpServer() {
    const transport = new stdio_js_1.StdioServerTransport();
    await mcpServer.connect(transport);
    console.log('🤖 MCP System Diagnostics Server online via stdio.');
}
