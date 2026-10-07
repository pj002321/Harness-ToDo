// 에이전트 1명 = `claude -p` 프로세스 1개.
// 실행하는 사람의 Claude Code 로그인(구독 또는 API 키)을 그대로 쓴다.
//
// 하네스가 에이전트를 통제하는 손잡이는 전부 여기 CLI 플래그다:
//   --tools ''       모든 에이전트에게 도구 0개. 기사 원문은 신뢰할 수 없는 입력(프롬프트 인젝션 가능)이라,
//                    원문에 "파일을 지워라"가 숨어 있어도 실행할 손이 없다. 필요한 자료는 하네스가 프롬프트로 넣어준다.
//   --json-schema    답을 정해진 모양의 JSON으로만 받기 → 하네스가 파싱할 필요 없음
import { spawn } from 'node:child_process';

export function runAgent({ run, role, step, system, prompt, schema }) {
  const args = [
    '-p',
    '--output-format', 'json',
    '--no-session-persistence',
    // 실행하는 사람의 개인 설정/MCP/훅이 섞이지 않게 격리 → 누가 돌려도 같은 조건
    '--setting-sources', '',
    '--strict-mcp-config',
    '--tools', '',
    '--json-schema', JSON.stringify(schema),
  ];
  if (system) args.push('--append-system-prompt', system);
  if (process.env.HARNESS_MODEL) args.push('--model', process.env.HARNESS_MODEL);

  run.event({ type: 'agent_start', role, step });
  console.log(`  [${role}] ${step} …`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CLAUDE_BIN || 'claude', args, { cwd: run.dir });
    let out = '', err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      let res;
      try {
        res = JSON.parse(out);
      } catch {
        return reject(new Error(`[${role}] claude 종료코드 ${code}\n${err || out}`));
      }
      if (res.is_error) return reject(new Error(`[${role}] ${res.result}`));
      const result = { output: res.structured_output, cost: res.total_cost_usd, ms: res.duration_ms };
      run.event({ type: 'agent_end', role, step, cost: result.cost, ms: result.ms });
      resolve(result);
    });
    child.stdin.end(prompt);
  });
}
