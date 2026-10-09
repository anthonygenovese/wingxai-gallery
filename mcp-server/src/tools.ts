import { McpServer, ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { CatalogInputError, monsterAsset, monsterRecord, searchFrames } from './catalog.js';
import { provenanceLine, PROVENANCE } from './provenance.js';
import { styleCardDocument } from './style-card.js';

/**
 * Tool names and input schemas follow docs/character-card.md section 6.2.
 * The HTTP server answers tools/call itself so bad arguments return JSON-RPC -32602.
 * The SDK still advertises these tools on tools/list. Its own tools/call path wraps
 * thrown errors as result.isError, which is not the card's error table, so server.ts
 * does not send tools/call through that path.
 */

const modeSchema = z.enum(['cute', 'menacing', 'minimal', 'detailed', 'parade', 'gallery-card']);
const schemeSchema = z.enum(['carbon', 'parade']);
const lightSchema = z.enum(['red', 'green', 'red-green']);

export const searchMonstersSchema = z.object({
  query: z.string().optional().describe("Free-text search, e.g. 'wings spread green edge lights'"),
  tags: z.array(z.string()).optional().describe("Style tags, e.g. ['wings-spread','gold-crest','frame-card']"),
  mode: modeSchema.optional(),
  scheme: schemeSchema.optional(),
  light: lightSchema.optional(),
  class: z.string().optional().describe('Frame class from the card'),
  limit: z.number().int().min(1).max(50).default(10),
  cursor: z.string().optional().describe('Pagination cursor from a previous result'),
});

export const getMonsterSchema = z.object({
  id: z.string().min(1).describe("Unit code, e.g. 'WX-01'"),
});

export const getMonsterAssetSchema = z.object({
  id: z.string().min(1),
  size: z.enum(['thumb', 'medium', 'full']).default('medium'),
  format: z.enum(['png', 'jpg', 'webp']).default('png'),
  card: z.boolean().default(true).describe('Include the frame card layout'),
});

export const getStyleCardSchema = z.object({
  version: z.string().optional().describe('Card version, default latest'),
});

export interface ToolTextResult {
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}

function textResult(summary: string, structured: Record<string, unknown>): ToolTextResult {
  const withProvenance = 'provenance' in structured ? structured : { ...structured, provenance: PROVENANCE };
  return {
    content: [{ type: 'text', text: `${summary}\n${provenanceLine()}` }],
    structuredContent: withProvenance,
  };
}

function issues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');
}

export function callTool(name: string, args: unknown): ToolTextResult {
  try {
    switch (name) {
      case 'search_monsters': {
        const parsed = searchMonstersSchema.safeParse(args ?? {});
        if (!parsed.success) throw new CatalogInputError(`Invalid arguments for search_monsters: ${issues(parsed.error)}`);
        const found = searchFrames(parsed.data);
        const summary = `${found.results.length} frame${found.results.length === 1 ? '' : 's'} found`;
        return textResult(summary, { results: found.results, next_cursor: found.next_cursor, provenance: PROVENANCE });
      }
      case 'get_monster': {
        const parsed = getMonsterSchema.safeParse(args ?? {});
        if (!parsed.success) throw new CatalogInputError(`Invalid arguments for get_monster: ${issues(parsed.error)}`);
        const record = monsterRecord(parsed.data.id);
        return textResult(`${String(record.id)} ${String((record.frame_card as { name: string }).name)}`, record);
      }
      case 'get_monster_asset': {
        const parsed = getMonsterAssetSchema.safeParse(args ?? {});
        if (!parsed.success) throw new CatalogInputError(`Invalid arguments for get_monster_asset: ${issues(parsed.error)}`);
        const asset = monsterAsset(parsed.data);
        return textResult(`Asset for ${parsed.data.id}: ${String(asset.url)}`, asset);
      }
      case 'get_style_card': {
        const parsed = getStyleCardSchema.safeParse(args ?? {});
        if (!parsed.success) throw new CatalogInputError(`Invalid arguments for get_style_card: ${issues(parsed.error)}`);
        const card = styleCardDocument(parsed.data.version);
        return textResult(`WingXAI style card ${String(card.version)} (endpoint not live)`, card);
      }
      default:
        throw new CatalogInputError(`Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof CatalogInputError) {
      throw new ProtocolError(ProtocolErrorCode.InvalidParams, error.message);
    }
    throw error;
  }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'wingxai', version: '0.4.0' });

  const publish = (result: ToolTextResult) => ({
    content: [{ type: 'text' as const, text: result.content[0]!.text }],
    structuredContent: result.structuredContent,
  });

  server.registerTool(
    'search_monsters',
    {
      description: 'Search WingXAI Prototype Frames by text, style tags, mode, armor scheme, light color, or class.',
      inputSchema: searchMonstersSchema,
    },
    async (args) => publish(callTool('search_monsters', args)),
  );

  server.registerTool(
    'get_monster',
    {
      description:
        "Get one frame's full metadata: unit code, frame card fields, prompt, negative prompt, style tags, palette, provenance, credits, and asset URLs.",
      inputSchema: getMonsterSchema,
    },
    async (args) => publish(callTool('get_monster', args)),
  );

  server.registerTool(
    'get_monster_asset',
    {
      description: 'Get a download URL for a frame image at a given size and format, with or without the frame card.',
      inputSchema: getMonsterAssetSchema,
    },
    async (args) => publish(callTool('get_monster_asset', args)),
  );

  server.registerTool(
    'get_style_card',
    {
      description:
        'Return this style card (Visual DNA, schemes, lighting, base and negative prompts, mecha influence rule, heraldry rule, reference rules, frame card layout, modifiers) as structured JSON so an agent can generate on-style.',
      inputSchema: getStyleCardSchema,
    },
    async (args) => publish(callTool('get_style_card', args)),
  );

  return server;
}
