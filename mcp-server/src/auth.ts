import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/**
 * API key gate is OFF unless WINGXAI_API_KEY_REQUIRED is true/1/yes/on.
 * When the gate is on, requests must send Authorization: Bearer <WINGXAI_API_KEY>.
 * /health stays open so a probe can run without the key.
 * If the gate is on and the key is empty, the server fails closed.
 */

export function apiKeyRequired(): boolean {
  const value = (process.env.WINGXAI_API_KEY_REQUIRED ?? '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; message: string };

export function authorize(req: IncomingMessage): AuthResult {
  if (!apiKeyRequired()) return { ok: true };

  const expected = process.env.WINGXAI_API_KEY ?? '';
  if (!expected) {
    return {
      ok: false,
      status: 503,
      message: 'API key gate is enabled but WINGXAI_API_KEY is unset.',
    };
  }

  const header = req.headers.authorization;
  const presented = typeof header === 'string' ? header : '';
  const match = /^Bearer\s+(\S+)\s*$/i.exec(presented);
  const token = match?.[1] ?? '';
  if (!token || !safeEqual(token, expected)) {
    return { ok: false, status: 401, message: 'Missing or invalid API key.' };
  }
  return { ok: true };
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
