// 에이전트 1명 = `claude -p` 프로세스 1개.
// 실행하는 사람의 Claude Code 로그인(구독 또는 API 키)을 그대로 쓴다.
//
// 하네스가 에이전트를 통제하는 손잡이는 전부 여기 CLI 플래그다:
//   --tools          이 에이전트가 "존재를 아는" 도구 목록 (없는 도구는 아예 못 씀)
//   --allowedTools   그중 묻지 않고 실행해도 되는 범위 (예: Bash(curl *))
//   --json-schema    답을 정해진 모양의 JSON으로만 받기 → 하네스가 파싱할 필요 없음
import { spawn } from 'node:child_process';

export function runAgent({ run, role, step, system, prompt, tools = [], allow = [], cwd, schema, edits = false }) {
  const args = [
    '-p',
    '--output-format', 'json',
    '--no-session-persistence',
    // 실행하는 사람의 개인 설정/MCP/훅이 섞이지 않게 격리 → 누가 돌려도 같은 조건
    '--setting-sources', '',
    '--strict-mcp-config',
    '--tools', tools.join(','),
  ];
  if (system) args.push('--append-system-prompt', system);
  if (allow.length) args.push('--allowedTools', ...allow);
  if (edits) args.push('--permission-mode', 'acceptEdits'); // 파일 수정은 cwd 안에서만 허용됨
  if (schema) args.push('--json-schema', JSON.stringify(schema));
  if (process.env.HARNESS_MODEL) args.push('--model', process.env.HARNESS_MODEL);

  run.event({ type: 'agent_start', role, step });
  console.log(`  [${role}] ${step} …`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CLAUDE_BIN || 'claude', args, { cwd: cwd || run.dir });
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
      const result = {
        output: res.structured_output ?? res.result,
        cost: res.total_cost_usd,
        ms: res.duration_ms,
        turns: res.num_turns,
        denied: res.permission_denials?.length ?? 0,
      };
      run.event({ type: 'agent_end', role, step, cost: result.cost, ms: result.ms, turns: result.turns, denied: result.denied });
      resolve(result);
    });
    child.stdin.end(prompt);
  });
}
