// runs/ 를 읽기 전용으로 보여주는 작은 정적 서버. 의존성 없음.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { RUNS_DIR } from '../harness/log.js';

const PORT = process.env.PORT || 4400;
const INDEX = new URL('./index.html', import.meta.url);

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    if (path === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(await readFile(INDEX));
    }
    if (path === '/api/runs') {
      const runs = (await readdir(RUNS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(runs.sort().reverse()));
    }
    if (path.startsWith('/runs/')) {
      const file = resolve(RUNS_DIR, path.slice('/runs/'.length));
      if (!file.startsWith(RUNS_DIR + sep)) throw new Error('outside runs/');
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(await readFile(file));
    }
  } catch {}
  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`viewer → http://localhost:${PORT}`));
export default server;
