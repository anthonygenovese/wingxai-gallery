/**
 * NOT LIVE.
 *
 * https://wingxai.gallery/mcp is planned and is not deployed.
 * This process is the local server, and the same file is what a future Vercel
 * function would run. A successful /health here does not mean the public URL works.
 * DNS for wingxai.gallery is not pointed yet. See docs/deployment.md.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';
import { authorize } from './auth.js';
import { takeToken } from './rate-limit.js';
import { callTool, createMcpServer } from './tools.js';

const NOT_LIVE =
  'The production endpoint https://wingxai.gallery/mcp is not live. This response is from a local or preview process.';

function clientIp(req: IncomingMessage): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0]!.trim();
  return req.socket.remoteAddress ?? 'unknown';
}

function pathname(req: IncomingMessage): string {
  const raw = req.url ?? '/';
  const path = raw.split('?')[0] ?? '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

function kind(path: string): 'health' | 'mcp' | 'miss' {
  if (path === '/health' || path === '/mcp/health') return 'health';
  if (path === '/' || path === '/mcp') return 'mcp';
  return 'miss';
}

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  );
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After, WWW-Authenticate');
}

function sendJson(res: ServerResponse, status: number, body: unknown, extra?: Record<string, string>): void {
  const payload = JSON.stringify(body);
  cors(res);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) res.setHeader(key, value);
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(payload);
}

function readBody(req: IncomingMessage, limit = 1_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: { name?: string; arguments?: unknown };
}

function isToolsCall(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return (value as JsonRpcRequest).method === 'tools/call';
}

function jsonRpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

async function handleToolsCall(body: JsonRpcRequest, res: ServerResponse): Promise<void> {
  const id = body.id ?? null;
  if (body.id === undefined) {
    sendJson(res, 200, jsonRpcError(null, ProtocolErrorCode.InvalidRequest, 'tools/call requires an id.'));
    return;
  }
  const name = body.params?.name;
  if (!name || typeof name !== 'string') {
    sendJson(res, 200, jsonRpcError(id, ProtocolErrorCode.InvalidParams, 'tools/call requires params.name.'));
    return;
  }
  try {
    const result = callTool(name, body.params?.arguments ?? {});
    sendJson(res, 200, { jsonrpc: '2.0', id, result });
  } catch (error) {
    if (error instanceof ProtocolError) {
      sendJson(res, 200, jsonRpcError(id, error.code, error.message));
      return;
    }
    console.error(error);
    sendJson(res, 200, jsonRpcError(id, ProtocolErrorCode.InternalError, 'Internal error'));
  }
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'POST') {
    const raw = await readBody(req);
    let parsed: unknown;
    try {
      parsed = raw.trim() ? JSON.parse(raw) : {};
    } catch {
      sendJson(res, 200, jsonRpcError(null, ProtocolErrorCode.ParseError, 'Parse error'));
      return;
    }
    if (isToolsCall(parsed)) {
      await handleToolsCall(parsed, res);
      return;
    }
    const server = createMcpServer();
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, parsed);
    return;
  }

  const server = createMcpServer();
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res);
}

const httpServer = createServer((req, res) => {
  void (async () => {
    try {
      const path = pathname(req);
      const route = kind(path);

      if (req.method === 'OPTIONS') {
        cors(res);
        res.writeHead(204);
        res.end();
        return;
      }

      if (route === 'miss') {
        sendJson(res, 404, {
          error: 'not_found',
          live: false,
          note: NOT_LIVE,
        });
        return;
      }

      if (route === 'health') {
        sendJson(res, 200, {
          ok: true,
          service: 'wingxai-mcp',
          live: false,
          endpoint: 'https://wingxai.gallery/mcp',
          note: NOT_LIVE,
        });
        return;
      }

      const auth = authorize(req);
      if (!auth.ok) {
        const headers: Record<string, string> = {};
        if (auth.status === 401) headers['WWW-Authenticate'] = 'Bearer';
        sendJson(res, auth.status, { error: auth.status === 401 ? 'unauthorized' : 'misconfigured', message: auth.message, live: false }, headers);
        return;
      }

      const limit = takeToken(clientIp(req));
      if (!limit.ok) {
        sendJson(
          res,
          429,
          {
            error: 'rate_limited',
            message: 'Rate limit exceeded.',
            retry_after_seconds: limit.retryAfterSeconds,
            live: false,
          },
          { 'Retry-After': String(limit.retryAfterSeconds) },
        );
        return;
      }

      await handleMcp(req, res);
    } catch (error) {
      const status = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode: number }).statusCode) : 500;
      if (status === 413) {
        sendJson(res, 413, { error: 'payload_too_large', message: 'Payload too large.' });
        return;
      }
      console.error(error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'internal', message: 'Internal error', live: false });
      }
    }
  })();
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '0.0.0.0';

httpServer.listen(port, host, () => {
  console.log(`WingXAI MCP listening on http://${host}:${port}`);
  console.log('NOT LIVE: https://wingxai.gallery/mcp is not deployed.');
});
