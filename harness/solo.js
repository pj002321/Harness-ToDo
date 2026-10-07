// 비교군: 하네스 없이 분야마다 Claude에게 한 번에 "골라서 요약해줘".
// 같은 후보 기사(본문 포함). 선정 기준도, 계약도, 검수도 없다.
// AUDIT=1 로 돌리면 harness와 같은 감사(근거 없는 문장 수)를 받는다.
import { createRun } from './log.js';
import { runAgent } from './claude.js';
import { loadSources, CATEGORIES } from './collect.js';
import { source, finish, DRAFT_SCHEMA } from './agents.js';

const articles = await loadSources(process.argv[2]);
const run = createRun('solo', `오늘의 브리핑 — 후보 ${articles.length}개`);

const SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: { ...DRAFT_SCHEMA, properties: { id: { type: 'string' }, ...DRAFT_SCHEMA.properties }, required: ['id', ...DRAFT_SCHEMA.required] } } },
  required: ['items'],
};

const items = [];
for (const category of Object.keys(CATEGORIES)) {
  const pool = articles.filter((a) => a.category === category);
  const { output } = await runAgent({
    run, role: 'writer', step: `${category} 혼자 선정·요약`, schema: SCHEMA,
    prompt: `오늘의 ${category} 기사들이다. 중요한 것을 골라 한국어로 짧게 요약해줘. id는 기사의 id를 그대로 써.\n\n${pool.map(source).join('\n\n')}`,
  });
  for (const it of output.items) {
    const article = pool.find((a) => a.id === it.id);
    if (article) items.push({ article, draft: it, verified: false });
  }
}
await finish(run, items);
