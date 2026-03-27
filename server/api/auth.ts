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

// Build the key → tenant_id map at startup (read once, zero overhead per request)
function buildKeyMap(): Map<string, string> {
  const map = new Map<string, string>();
  const raw = process.env.TENANT_API_KEYS ?? '';

  if (!raw) {
    console.warn('[Auth] ⚠ TENANT_API_KEYS não definido no .env. Usando tenant padrão sem autenticação (modo dev).');
    return map;
  }

  for (const entry of raw.split(',')) {
    const [tenantId, apiKey] = entry.trim().split(':');
    if (tenantId && apiKey) {
      map.set(apiKey.trim(), tenantId.trim());
    }
  }

  console.log(`[Auth] ✅ ${map.size} tenant(s) carregado(s) do TENANT_API_KEYS.`);
  return map;
}

export const keyToTenant = buildKeyMap();

/**
 * Fastify hook — validates X-API-Key and injects tenant_id into the request.
 * Attach via: server.addHook('preValidation', authHook)
 */
export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  // If no keys are configured, fall back to dev mode (tenant123)
  if (keyToTenant.size === 0) {
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

  const tenantId = keyToTenant.get(apiKey);
  if (!tenantId) {
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: API Key inválida.',
    });
  }

  (request as any).tenant_id = tenantId;
}
