// 생성된 앱을 하네스가 직접 띄운다. Evaluator는 띄워진 앱을 "밖에서" 두드릴 뿐이다.
// 약속: 앱은 app/server.js 하나로 시작하고, PORT 환경변수의 포트를 연다.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

export async function startApp(appDir, timeoutMs = 10_000) {
  if (!existsSync(join(appDir, 'server.js'))) return { error: 'app/server.js 가 없음' };

  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['server.js'], { cwd: appDir, env: { ...process.env, PORT: String(port) } });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  const stop = () => child.kill();

  for (const end = Date.now() + timeoutMs; Date.now() < end; ) {
    if (child.exitCode !== null) return { error: `서버가 바로 종료됨 (code ${child.exitCode})\n${log}` };
    try {
      await fetch(url);
      return { url, stop };
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  stop();
  return { error: `${timeoutMs}ms 안에 응답 없음\n${log}` };
}
