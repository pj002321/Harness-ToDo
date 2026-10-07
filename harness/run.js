// ③ 직접 작성: 하네스의 메인 루프
//
// 쓸 수 있는 부품 (전부 agents.js):
//   plan(run)                                        → spec   { product, overview, sprints: [{ title, goal, features }] }
//   proposeContract(run, { spec, n })                → contract  (Generator가 제안)
//   reviewContract(run, { spec, n, contract })       → { approved, comments, contract }  (Evaluator가 검토/수정)
//   generate(run, { spec, n, attempt, contract, feedback }) → { summary, done }  (feedback = 직전 verdict, 첫 시도는 생략)
//   evaluate(run, { tag, contract })                 → verdict { pass, results, summary }  (앱 기동·종료는 알아서 함)
//
// 흐름:
//   1. Planner가 스펙을 쓴다.
//   2. 스프린트마다
//      a. 계약 협상: Generator 제안 → Evaluator 검토. 승인될 때까지 (최대 몇 번?)
//      b. 구현 루프: generate → evaluate. pass면 다음 스프린트, 아니면 verdict를 feedback으로 넘겨 재시도 (최대 MAX_ATTEMPTS)
//      c. 끝내 통과 못 하면? (멈출지, 다음으로 넘어갈지 — 직접 결정)
//   3. 맨 아래 최종 심사는 solo와 같은 기준이라 그대로 둔다.
//
// 생각해볼 것: 각 루프의 상한이 없으면 어떻게 되나? 계약 협상을 생략하면 무엇이 깨지나?
import { createRun } from './log.js';
import { REQUEST, ACCEPTANCE, plan, proposeContract, reviewContract, generate, evaluate } from './agents.js';

const MAX_ATTEMPTS = 3;
const run = createRun('harness', REQUEST);

// TODO

const final = await evaluate(run, { tag: 'acceptance', contract: ACCEPTANCE });
run.event({ type: 'done', pass: final.pass });
console.log(`최종 심사: ${final.pass ? 'PASS' : 'FAIL'}  → runs/${run.id}`);
