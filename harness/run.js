// ③ 직접 작성: 하네스의 메인 루프
//
// 쓸 수 있는 부품:
//   articles  [{ id, category, source, title, url, image, published, text }]  — 아래에서 이미 불러옴
//   CATEGORIES  { 시사: [...], 경제: [...], AI: [...], 문화: [...] }  — Object.keys로 분야 목록
//   edit(run, { category, articles })                  → picks  (그 분야의 계약 목록. pick.id = 기사 id)
//   write(run, { article, pick, attempt, feedback })   → draft { headline, sentences }   (feedback = 직전 verdict, 첫 시도는 생략)
//   check(run, { article, pick, draft, tag })          → verdict { pass, results, unmet } (tag 예: `${article.id}/check-${attempt}`)
//   finish(run, items)   items = [{ article, draft, verified }]  → digest.json 발행
//
// 흐름:
//   1. 분야마다 Editor가 후보 중에서 고르고, 기사마다 계약(브리프)을 쓴다.
//   2. 고른 기사마다: write → check. pass면 채택, 아니면 verdict를 feedback으로 넘겨 재시도 (최대 MAX_ATTEMPTS)
//   3. 끝내 통과 못 한 기사는? (빼기 / verified: false로 싣기 — 직접 결정)
//   4. 맨 아래 finish는 solo와 같으니 그대로 둔다.
//
// 생각해볼 것: 재시도 상한이 없으면? Checker를 빼면 브리핑에 무엇이 섞이나?
//             분야 4개 × 기사 N개 × 시도 횟수 = 호출 수 = 하루 비용.
import { createRun } from './log.js';
import { loadSources, CATEGORIES } from './collect.js';
import { edit, write, check, finish } from './agents.js';

const MAX_ATTEMPTS = 3;
const articles = await loadSources(process.argv[2]);
const run = createRun('harness', `오늘의 브리핑 — 후보 ${articles.length}개`);
const items = [];

// TODO

await finish(run, items);
