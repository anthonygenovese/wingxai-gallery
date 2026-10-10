/**
 * Local contract check. Not a production probe.
 * https://wingxai.gallery/mcp is not live; this talks to a server this script starts.
 */
import { spawn, spawnSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(project, 'samples);
const headers = {
  'content-type': 'application/json,
  accept: 'application/json, text/event-stream,
};