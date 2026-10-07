// 세 에이전트의 "역할 = 프롬프트 + 권한 + 출력 모양".
// 프롬프트(태도·기준)는 prompts/*.md, 권한과 출력 모양은 여기서 코드로 강제한다.
import { readFileSync } from 'node:fs';
import { runAgent } from './claude.js';
import { startApp } from './app.js';
import { CONTRACT_SCHEMA } from './contract.js';

export const REQUEST = '할 일 관리(ToDo) 웹 앱을 만들어줘.';

// startApp()이 앱을 띄우는 방식과 맞물린 기술 제약. 프롬프트가 아니라 "환경의 규칙"이다.
export const APP_RULES = [
  'Node.js 표준 라이브러리만 사용한다 (npm 의존성 없음, package.json 불필요).',
  '진입점은 현재 디렉터리의 server.js 하나이고 process.env.PORT 포트를 연다.',
  'GET / 에서 화면(HTML)을 제공한다. 데이터는 현재 디렉터리 안의 JSON 파일에 저장한다.',
  '서버를 직접 띄워둔 채로 끝내지 않는다. 확인이 필요하면 띄웠다가 반드시 종료한다.',
].map((r) => `- ${r}`).join('\n');

// 권한 표 — README의 표와 같은 내용
export const GENERATOR_TOOLS = { tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'], allow: ['Bash(node *)'], edits: true };
const EVALUATOR_TOOLS = { tools: ['Read', 'Glob', 'Grep', 'Bash'], allow: ['Bash(curl *)'] }; // Write/Edit 없음 → 코드를 못 고친다
const PLANNER_TOOLS = { tools: [] }; // 생각만 한다

const prompt = (name) => readFileSync(new URL(`../prompts/${name}.md`, import.meta.url), 'utf8');
const str = { type: 'string' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties) });

const SPEC_SCHEMA = obj({
  product: str,
  overview: str,
  sprints: { type: 'array', items: obj({ title: str, goal: str, features: { type: 'array', items: str } }) },
});
const REVIEW_SCHEMA = obj({ approved: { type: 'boolean' }, comments: str, contract: CONTRACT_SCHEMA });
export const REPORT_SCHEMA = obj({ summary: str, done: { type: 'boolean' } });
const VERDICT_SCHEMA = obj({
  results: { type: 'array', items: obj({ id: str, pass: { type: 'boolean' }, evidence: str }) },
  summary: str,
});

// ── markdown 렌더링 (사람과 다음 에이전트가 읽을 파일) ──────────────────
const specMd = (s) =>
  `# ${s.product}\n\n${s.overview}\n\n` +
  s.sprints.map((sp, i) => `## Sprint ${i + 1}: ${sp.title}\n${sp.goal}\n${sp.features.map((f) => `- ${f}`).join('\n')}`).join('\n\n');
export const contractMd = (c) =>
  c.criteria.map(({ id, ...rest }) => `- **${id}**\n` + Object.entries(rest).map(([k, v]) => `  - ${k}: ${v}`).join('\n')).join('\n');
const verdictMd = (v) =>
  `# ${v.pass ? 'PASS' : 'FAIL'}\n\n${v.summary}\n\n` +
  v.results.map((r) => `- ${r.pass ? '✅' : '❌'} **${r.id}** — ${r.evidence}`).join('\n');

export function save(run, role, rel, md) {
  run.save(rel, md);
  run.event({ type: 'artifact', role, file: rel });
}

// ── 에이전트 ────────────────────────────────────────────────────────────
export async function plan(run) {
  const { output: spec } = await runAgent({
    run, role: 'planner', step: '스펙 작성', system: prompt('planner'), ...PLANNER_TOOLS, schema: SPEC_SCHEMA,
    prompt: `사용자 요청: ${REQUEST}\n\n환경 제약:\n${APP_RULES}`,
  });
  save(run, 'planner', 'spec.md', specMd(spec));
  return spec;
}

export async function proposeContract(run, { spec, n }) {
  const sprint = spec.sprints[n - 1];
  const { output: contract } = await runAgent({
    run, role: 'generator', step: `Sprint ${n} 계약 제안`, system: prompt('generator'), tools: [], schema: CONTRACT_SCHEMA,
    prompt: `${specMd(spec)}\n\n---\n이번은 Sprint ${n}: ${sprint.title} 이다. 이 스프린트의 완료 기준(Sprint Contract)을 제안하라.`,
  });
  save(run, 'generator', `sprint-${n}/contract-proposal.md`, contractMd(contract));
  return contract;
}

export async function reviewContract(run, { spec, n, contract }) {
  const { output: review } = await runAgent({
    run, role: 'evaluator', step: `Sprint ${n} 계약 검토`, system: prompt('evaluator'), tools: [], schema: REVIEW_SCHEMA,
    prompt:
      `${specMd(spec)}\n\n---\nGenerator가 Sprint ${n} 계약을 제안했다:\n${contractMd(contract)}\n\n` +
      `curl로 검증 가능한지, 스펙 대비 빠진 것은 없는지 검토하라. 승인하지 않으면 고친 계약을 contract에 담아라.`,
  });
  save(run, 'evaluator', `sprint-${n}/contract-review.md`, `# ${review.approved ? '승인' : '수정 요청'}\n\n${review.comments}\n\n${contractMd(review.contract)}`);
  return review;
}

export async function generate(run, { spec, n, attempt, contract, feedback }) {
  const { output: report } = await runAgent({
    run, role: 'generator', step: `Sprint ${n} 구현 #${attempt}`, system: prompt('generator'), ...GENERATOR_TOOLS, cwd: run.appDir, schema: REPORT_SCHEMA,
    prompt:
      `${specMd(spec)}\n\n환경 제약:\n${APP_RULES}\n\n---\nSprint ${n}을 구현하라. 합의된 계약:\n${contractMd(contract)}` +
      (feedback ? `\n\n---\n직전 시도에 대한 Evaluator 판정:\n${verdictMd(feedback)}\n실패 항목을 고쳐라.` : ''),
  });
  save(run, 'generator', `sprint-${n}/attempt-${attempt}/report.md`, `# 자기 보고: ${report.done ? '완료했다고 주장' : '미완료'}\n\n${report.summary}`);
  return report;
}

// tag: 저장 위치 겸 화면 표시용 이름 (예: 'sprint-1/attempt-2', 'acceptance')
export async function evaluate(run, { tag, contract }) {
  const app = await startApp(run.appDir);
  let verdict;
  if (app.error) {
    // 서버가 안 뜨면 LLM에게 물어볼 것도 없다 — 하네스가 바로 전부 실패 처리
    verdict = { summary: `앱 기동 실패: ${app.error}`, results: contract.criteria.map((c) => ({ id: c.id, pass: false, evidence: '앱이 뜨지 않음' })) };
  } else {
    try {
      ({ output: verdict } = await runAgent({
        run, role: 'evaluator', step: `${tag} 검증`, system: prompt('evaluator'), ...EVALUATOR_TOOLS, cwd: run.appDir, schema: VERDICT_SCHEMA,
        prompt: `앱이 ${app.url} 에서 실행 중이다. 아래 계약의 모든 항목을 실제로 호출해서 검증하라:\n${contractMd(contract)}`,
      }));
    } finally {
      app.stop();
    }
  }
  // 최종 합격은 LLM의 말이 아니라 하네스가 계산한다: 계약의 모든 id가 pass여야 한다.
  const passed = new Set(verdict.results.filter((r) => r.pass).map((r) => r.id));
  const failed = contract.criteria.map((c) => c.id).filter((id) => !passed.has(id));
  verdict.pass = failed.length === 0;
  save(run, 'evaluator', `${tag}/verdict.md`, verdictMd(verdict));
  run.event({ type: 'verdict', tag, pass: verdict.pass, failed, total: contract.criteria.length });
  return verdict;
}

// 비교용 최종 심사: solo와 harness 결과물을 같은 숨겨진 기준으로 채점한다.
export const ACCEPTANCE = JSON.parse(readFileSync(new URL('./acceptance.json', import.meta.url), 'utf8'));
