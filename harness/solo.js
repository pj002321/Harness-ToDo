// 비교군: 하네스 없이 Claude Code에게 한 번 시키고 끝.
// 스펙도, 계약도, 독립 검증도 없다. 끝나면 "자기 보고"와 "독립 심사"를 나란히 남긴다.
import { createRun } from './log.js';
import { runAgent } from './claude.js';
import { REQUEST, APP_RULES, GENERATOR_TOOLS, REPORT_SCHEMA, ACCEPTANCE, evaluate, save } from './agents.js';

const run = createRun('solo', REQUEST);

const { output: report } = await runAgent({
  run, role: 'generator', step: '혼자 구현', ...GENERATOR_TOOLS, cwd: run.appDir, schema: REPORT_SCHEMA,
  prompt: `${REQUEST}\n\n환경 제약:\n${APP_RULES}\n\n다 만들면 무엇을 했는지와 완료 여부를 보고하라.`,
});
save(run, 'generator', 'report.md', `# 자기 보고: ${report.done ? '완료했다고 주장' : '미완료'}\n\n${report.summary}`);

const final = await evaluate(run, { tag: 'acceptance', contract: ACCEPTANCE });
run.event({ type: 'done', pass: final.pass });
console.log(`자기 보고: ${report.done ? '완료' : '미완료'} / 독립 심사: ${final.pass ? 'PASS' : 'FAIL'}  → runs/${run.id}`);
