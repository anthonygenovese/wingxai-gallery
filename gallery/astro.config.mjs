import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Intended production origin. wingxai.gallery is not pointed at Vercel yet.
// Relative asset paths still work on preview URLs.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  site: 'https://wingxai.gallery',
  output: 'static',
  vite: {
    server: {
      fs: {
        allow: [repoRoot],
      },
    },
  },
});
