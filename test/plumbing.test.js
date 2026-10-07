// Claude 호출 없이 하네스 배관만 검증한다 (사용량 0).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startApp } from '../harness/app.js';
import { RUNS_DIR } from '../harness/log.js';

test('startApp: server.js를 PORT로 띄우고 stop으로 내린다', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'app-'));
  writeFileSync(join(dir, 'server.js'), `require('http').createServer((q,s)=>s.end('ok')).listen(process.env.PORT)`);
  const app = await startApp(dir);
  assert.equal(await (await fetch(app.url)).text(), 'ok');
  app.stop();
});

test('startApp: server.js가 없거나 바로 죽으면 error', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'app-'));
  assert.match((await startApp(dir)).error, /server\.js/);
  writeFileSync(join(dir, 'server.js'), `process.exit(3)`);
  assert.match((await startApp(dir)).error, /code 3/);
});

test('viewer: runs/ 밖의 파일은 내주지 않는다', async () => {
  mkdirSync(join(RUNS_DIR, 't'), { recursive: true });
  writeFileSync(join(RUNS_DIR, 't', 'events.jsonl'), '{}\n');
  process.env.PORT = '0';
  const { default: server } = await import('../viewer/server.js');
  after(() => { server.close(); rmSync(join(RUNS_DIR, 't'), { recursive: true }); });
  await new Promise((r) => server.listening ? r() : server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/runs/t/events.jsonl`)).status, 200);
  assert.equal((await fetch(`${base}/runs/..%2Fpackage.json`)).status, 404);
  assert.ok((await (await fetch(`${base}/api/runs`)).json()).includes('t'));
});
