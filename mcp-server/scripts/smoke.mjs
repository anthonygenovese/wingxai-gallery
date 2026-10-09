/**
 * Local contract check. Not a production probe.
 * https://wingxai.gallery/mcp is not live; this talks to a server this script starts.
 */
import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samplesDir = path.join(project, 'samples');
const headers = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function startServer(port, env) {
  const child = spawn(path.join(project, 'node_modules', '.bin', 'tsx'), ['src/server.ts'], {
    cwd: project,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.logs = () => logs;
  return child;
}

async function stop(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 2000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function waitForHealth(port, child) {
  const deadline = Date.now() + 20_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited early.\n${child.logs()}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for /health (${lastError}).\n${child.logs()}`);
}

async function post(port, body, extraHeaders = {}) {
  const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: { ...headers, ...extraHeaders },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, headers: response.headers, json };
}

function provenanceOf(payload) {
  return payload?.provenance ?? payload?.structuredContent?.provenance;
}

async function main() {
  const port = 8787;
  const child = startServer(port, {
    WINGXAI_API_KEY_REQUIRED: 'false',
    WINGXAI_RATE_LIMIT_PER_MIN: '60',
  });
  try {
    const health = await waitForHealth(port, child);
    assert(health.ok === true && health.live === false, 'health must be ok and not live');
    const prefixed = await fetch(`http://127.0.0.1:${port}/mcp/health`);
    assert(prefixed.ok, '/mcp/health should answer');

    const sampleFiles = (await readdir(samplesDir)).filter((name) => name.endsWith('.json')).sort();
    assert(sampleFiles.length === 4, 'expected four tool samples');
    for (const file of sampleFiles) {
      const body = JSON.parse(await readFile(path.join(samplesDir, file), 'utf8'));
      const response = await post(port, body);
      assert(response.status === 200, `${file} HTTP ${response.status}`);
      assert(response.json.result, `${file} missing result: ${JSON.stringify(response.json).slice(0, 400)}`);
      const provenance = provenanceOf(response.json.result.structuredContent);
      assert(provenance?.source === 'wingxai.gallery', `${file} provenance source`);
      assert(provenance?.original_design === true, `${file} original_design`);
      assert(provenance?.real_people === false, `${file} no real people`);
      assert(provenance?.franchise_designs === false, `${file} no franchise designs`);
      assert(String(response.json.result.content?.[0]?.text ?? '').includes('no real people'), `${file} text provenance`);
      console.log(`ok ${file}`);
    }

    const search = await post(port, JSON.parse(await readFile(path.join(samplesDir, 'search_monsters.json'), 'utf8')));
    const found = search.json.result.structuredContent;
    assert(found.results.length === 2, `search returned ${found.results.length}`);
    assert(typeof found.next_cursor === 'string' && found.next_cursor.length > 0, 'search cursor');

    const monster = await post(port, JSON.parse(await readFile(path.join(samplesDir, 'get_monster.json'), 'utf8')));
    assert(monster.json.result.structuredContent.id === 'WX-01', 'get_monster id');

    const asset = await post(port, JSON.parse(await readFile(path.join(samplesDir, 'get_monster_asset.json'), 'utf8')));
    const assetBody = asset.json.result.structuredContent;
    assert(assetBody.served_format === 'svg', 'asset serves svg');
    assert(assetBody.path === '/assets/wx-01.svg', 'asset path');
    assert(assetBody.card === false, 'asset card flag');

    const card = await post(port, JSON.parse(await readFile(path.join(samplesDir, 'get_style_card.json'), 'utf8')));
    const cardBody = card.json.result.structuredContent;
    assert(cardBody.version === '0.4', 'card version');
    assert(cardBody.mcp_endpoint.live === false, 'card endpoint not live');
    assert(typeof cardBody.markdown === 'string' && cardBody.markdown.includes('WingXAI'), 'card markdown');

    const unknown = await post(port, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get_monster', arguments: { id: 'WX-99' } },
    });
    assert(unknown.json.error?.code === -32602, `unknown id code ${unknown.json.error?.code}`);

    const badEnum = await post(port, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'search_monsters', arguments: { light: 'blue' } },
    });
    assert(badEnum.json.error?.code === -32602, `bad enum code ${badEnum.json.error?.code}`);

    const listed = await post(port, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/list',
      params: {},
    });
    const names = (listed.json.result?.tools ?? []).map((tool) => tool.name).sort();
    assert(names.join(',') === 'get_monster,get_monster_asset,get_style_card,search_monsters', `tools/list ${names.join(',')}`);
    console.log('ok tools/list and error codes');
  } finally {
    await stop(child);
  }

  const gatedPort = 8788;
  const gated = startServer(gatedPort, {
    WINGXAI_API_KEY_REQUIRED: 'true',
    WINGXAI_API_KEY: 'sample-key',
    WINGXAI_RATE_LIMIT_PER_MIN: '60',
  });
  try {
    await waitForHealth(gatedPort, gated);
    const openHealth = await fetch(`http://127.0.0.1:${gatedPort}/health`);
    assert(openHealth.status === 200, 'health stays open when the key gate is on');
    const denied = await post(gatedPort, { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    assert(denied.status === 401, `expected 401, got ${denied.status}`);
    const allowed = await post(
      gatedPort,
      { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
      { authorization: 'Bearer sample-key' },
    );
    assert(allowed.status === 200 && allowed.json.result, 'bearer key should allow tools/list');
    console.log('ok api key gate');
  } finally {
    await stop(gated);
  }

  const limitedPort = 8789;
  const limited = startServer(limitedPort, { WINGXAI_RATE_LIMIT_PER_MIN: '2', WINGXAI_API_KEY_REQUIRED: 'false' });
  try {
    await waitForHealth(limitedPort, limited);
    const body = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };
    const first = await post(limitedPort, body);
    const second = await post(limitedPort, body);
    const third = await post(limitedPort, body);
    assert(first.status === 200 && second.status === 200, 'first two calls should pass');
    assert(third.status === 429, `expected 429, got ${third.status}`);
    assert(third.headers.get('retry-after'), 'Retry-After missing');
    const health = await fetch(`http://127.0.0.1:${limitedPort}/health`);
    assert(health.status === 200, 'health is exempt from the rate limit');
    console.log('ok rate limit');
  } finally {
    await stop(limited);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
