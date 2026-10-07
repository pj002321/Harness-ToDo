// 사이트 서버. 의존성 없음.
//   /          오늘의 브리핑 (분야 칩 필터) — 가장 최근 harness 실행의 digest.json
//   /process   하네스 과정 뷰어 (타임라인 + 구조도)
//   /runs/...  실행 기록 파일 (읽기 전용)
import { createServer } from 'node:http';
import { readFile, readdir, access } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { RUNS_DIR } from '../harness/log.js';
import { CATEGORIES } from '../harness/collect.js';
import { renderBriefing, CSP } from '../harness/digest.js';

const PORT = process.env.PORT || 4400;
const PROCESS_PAGE = new URL('./index.html', import.meta.url);
const ALL = Object.keys(CATEGORIES);

const listRuns = async () =>
  (await readdir(RUNS_DIR, { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory()).map((d) => d.name).sort().reverse();

// ?run= 이 없으면 digest.json 이 있는 가장 최근 harness 실행
async function pickRun(requested) {
  const runs = await listRuns();
  if (requested && runs.includes(requested)) return requested;
  for (const r of runs.filter((r) => r.endsWith('-harness'))) {
    if (await access(join(RUNS_DIR, r, 'digest.json')).then(() => true, () => false)) return r;
  }
  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = decodeURIComponent(url.pathname);
  try {
    if (path === '/') {
      // 분야 선택: 폼으로 보냈으면 그걸 쓰고 쿠키에 기억, 아니면 쿠키, 처음이면 전부
      const sent = url.searchParams.has('c') || url.searchParams.has('sent');
      const cookie = req.headers.cookie?.match(/(?:^|; )topics=([^;]*)/)?.[1];
      const selected = (sent ? url.searchParams.getAll('c') : cookie !== undefined ? decodeURIComponent(cookie).split(',') : ALL).filter((c) => ALL.includes(c));
      const runId = await pickRun(url.searchParams.get('run'));
      const digest = runId && JSON.parse(await readFile(join(RUNS_DIR, runId, 'digest.json'), 'utf8').catch(() => 'null'));
      const headers = { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': CSP };
      if (sent) headers['set-cookie'] = `topics=${encodeURIComponent(selected.join(','))}; Path=/; Max-Age=31536000; SameSite=Lax`;
      res.writeHead(200, headers);
      return res.end(renderBriefing({ digest, selected, runId, pinned: runId === url.searchParams.get('run') }));
    }
    if (path === '/process') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(await readFile(PROCESS_PAGE));
    }
    if (path === '/api/runs') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify(await listRuns()));
    }
    if (path.startsWith('/runs/')) {
      const file = resolve(RUNS_DIR, path.slice('/runs/'.length));
      if (!file.startsWith(RUNS_DIR + sep)) throw new Error('outside runs/');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(body);
    }
  } catch {}
  res.writeHead(404).end();
});

server.listen(PORT, () => console.log(`브리핑 → http://localhost:${server.address().port}   과정 → /process`));
export default server;
