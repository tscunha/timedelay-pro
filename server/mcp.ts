import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getDb } from './db/database';
import { FFmpegService } from './services/ffmpeg.service';

const mcpServer = new Server(
  {
    name: 'TimeDelayPro-Control',
    version: '1.0.0'
  },
  {
    capabilities: { tools: {} }
  }
);

// MCP Tool Registrations
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
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

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_system_status') {
    const db = getDb();
    const channels = db.prepare('SELECT * FROM channels').all();
    const shifts = db.prepare('SELECT * FROM shifts').all();
    return { content: [{ type: 'text', text: JSON.stringify({ active_daemons: FFmpegService.getActivePids(), channels, shifts }, null, 2) }] };
  }

  if (request.params.name === 'restart_shift') {
    const { shift_id } = request.params.arguments as any;
    FFmpegService.stop(shift_id); // Changed to use bare shift_id since FFmpegService internally maps it
    
    // In production we would fetch the shift details from SQLite and re-trigger start.
    // Simplifying self-healing command for MVP:
    return { content: [{ type: 'text', text: `Shift ${shift_id} derubado (SIGKILL enviado). Ele será recriado pela próxima varredura de heartbeat.` }] };
  }

  throw new Error('Tool não encontrada');
});

export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.log('🤖 MCP System Diagnostics Server online via stdio.');
}
