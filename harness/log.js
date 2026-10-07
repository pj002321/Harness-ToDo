// 실행 기록. 에이전트끼리 주고받는 모든 것은 runs/<id>/ 아래 파일로 남는다.
// viewer는 events.jsonl만 읽어서 타임라인을 그린다.
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RUNS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'runs');

export function createRun(mode, request) {
  const id = `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${mode}`;
  const dir = join(RUNS_DIR, id);
  mkdirSync(join(dir, 'app'), { recursive: true });

  const run = {
    id,
    dir,
    appDir: join(dir, 'app'),
    event(e) {
      appendFileSync(join(dir, 'events.jsonl'), JSON.stringify({ t: Date.now(), ...e }) + '\n');
    },
    save(rel, content) {
      mkdirSync(dirname(join(dir, rel)), { recursive: true });
      writeFileSync(join(dir, rel), content);
      return rel;
    },
  };
  run.event({ type: 'run', mode, request });
  console.log(`▶ ${id}  (npm run view 로 실시간 확인)`);
  return run;
}
