// ============================================================
// TimeShift Pro — API Key Authentication Middleware
// ============================================================
// Reads TENANT_API_KEYS from .env in the format:
//   tenant1:key1,tenant2:key2,...
//
// Every request must include the header:
//   X-API-Key: <chave>
//
// Returns 401 if the key is missing or invalid.
// ============================================================

import { FastifyRequest, FastifyReply } from 'fastify';

// Build the key → tenant_id map on first use (lazy) so dotenv.config()
// has already run in server/index.ts before we read process.env.
let _keyMap: Map<string, string> | null = null;

function getKeyMap(): Map<string, string> {
  if (_keyMap) return _keyMap;

  _keyMap = new Map<string, string>();
  const raw = process.env.TENANT_API_KEYS ?? '';

  if (!raw) {
    console.warn('[Auth] ⚠ TENANT_API_KEYS não definido no .env. Usando tenant padrão sem autenticação (modo dev).');
    return _keyMap;
  }

  for (const entry of raw.split(',')) {
    const [tenantId, apiKey] = entry.trim().split(':');
    if (tenantId && apiKey) {
      _keyMap.set(apiKey.trim(), tenantId.trim());
    }
  }

  console.log(`[Auth] ✅ ${_keyMap.size} tenant(s) carregado(s) do TENANT_API_KEYS.`);
  return _keyMap;
}

/** @deprecated use getKeyMap() instead — kept for compatibility */
export const keyToTenant = { get: (k: string) => getKeyMap().get(k), size: 0 };

/**
 * Fastify hook — validates X-API-Key and injects tenant_id into the request.
 * Attach via: server.addHook('preValidation', authHook)
 */
export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  const keyMap = getKeyMap();

  // If no keys are configured, fall back to dev mode (tenant123)
  if (keyMap.size === 0) {
    (request as any).tenant_id = 'tenant123';
    return;
  }

  const apiKey = request.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: Header X-API-Key ausente.',
    });
  }

  const tenantId = keyMap.get(apiKey);
  if (!tenantId) {
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: API Key inválida.',
    });
  }

  (request as any).tenant_id = tenantId;
}
