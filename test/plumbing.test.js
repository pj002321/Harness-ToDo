// Claude 호출 없이 하네스 배관만 검증한다 (사용량 0).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { extract, parseFeed } from '../harness/collect.js';
import { grounded } from '../harness/agents.js';
import { renderBriefing } from '../harness/digest.js';
import { RUNS_DIR } from '../harness/log.js';

test('extract: 본문 문단과 og:image를 뽑고, script는 버린다', () => {
  const html = `<meta content="https://x.com/a.png?w=1&amp;h=2" property="og:image">
    <script>var p = "<p>가짜</p>";</script><p>First <b>para</b> &amp; more.</p><p>Second&#39;s &ldquo;quote&rdquo;</p>`;
  const { text, image } = extract(html);
  assert.equal(image, 'https://x.com/a.png?w=1&h=2');
  assert.equal(text, 'First para & more.\nSecond\'s “quote”');
});

test('parseFeed: CDATA 유무와 상관없이 제목·링크·날짜를 읽는다', () => {
  const xml = `<rss><channel><item><title><![CDATA[삼성 &amp; LG]]></title><link>https://a.kr/1?x=1&amp;y=2</link><pubDate>Wed, 7 Oct 2026 12:00:00 +0900</pubDate></item>
    <item><title>둘째</title><link><![CDATA[https://a.kr/2]]></link></item></channel></rss>`;
  assert.deepEqual(parseFeed(xml), [
    { title: '삼성 & LG', url: 'https://a.kr/1?x=1&y=2', published: 'Wed, 7 Oct 2026 12:00:00 +0900' },
    { title: '둘째', url: 'https://a.kr/2', published: '' },
  ]);
});

test('grounded: 원문에 실제로 있는 15자 이상 인용만 근거로 인정', () => {
  const src = '기업 여유자금이   2분기 67.1조 원으로 역대 최대를 기록했다.';
  assert.ok(grounded('기업 여유자금이 2분기 67.1조 원으로 역대 최대', src)); // 공백 차이는 허용
  assert.ok(!grounded('기업 여유자금이 2분기 76.1조 원으로 역대 최대', src)); // 숫자 조작
  assert.ok(!grounded('67.1조', src));                                         // 너무 짧은 인용
});

const card = (over) => ({
  id: '1', category: '경제', source: 'a.kr', title: 't', url: 'https://a.kr/1', image: null, published: '',
  headline: 'h', sentences: ['s'], verified: true, ...over,
});

test('renderBriefing: 외부 입력의 HTML·javascript: 는 무력화된다', () => {
  const html = renderBriefing({
    selected: ['경제'],
    digest: [card({ url: 'javascript:alert(1)', image: 'javascript:x', headline: '<img src=x onerror=alert(1)>', sentences: ['<script>x</script>'] })],
  });
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>x'));
  assert.ok(!html.includes('javascript:'));
});

test('server: 분야 필터 + 쿠키 기억, runs/ 밖 차단, 브리핑엔 스크립트 금지 CSP', async () => {
  const dir = join(RUNS_DIR, '0000-test-harness');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'events.jsonl'), '{}\n');
  writeFileSync(join(dir, 'digest.json'), JSON.stringify([card({ headline: '경제기사' }), card({ id: '2', category: 'AI', headline: 'AI기사' })]));
  process.env.PORT = '0';
  const { default: server } = await import('../viewer/server.js');
  after(() => { server.close(); rmSync(dir, { recursive: true }); });
  await new Promise((r) => (server.listening ? r() : server.once('listening', r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const q = '&run=0000-test-harness';

  const all = await fetch(`${base}/?${q}`);
  assert.match(all.headers.get('content-security-policy'), /default-src 'none'/);
  const body = await all.text();
  assert.ok(body.includes('경제기사') && body.includes('AI기사'));

  const onlyAi = await fetch(`${base}/?c=AI${q}`);
  assert.ok(!(await onlyAi.text()).includes('경제기사'));
  const cookie = onlyAi.headers.get('set-cookie').split(';')[0];
  const remembered = await (await fetch(`${base}/?${q}`, { headers: { cookie } })).text();
  assert.ok(remembered.includes('AI기사') && !remembered.includes('경제기사'));
  assert.ok(remembered.includes('name="run" value="0000-test-harness"')); // 보던 실행에 머문다
  const none = await (await fetch(`${base}/?sent=1${q}`)).text();          // 전부 해제
  assert.ok(!none.includes('AI기사') && !none.includes('경제기사'));

  assert.equal((await fetch(`${base}/runs/0000-test-harness/events.jsonl`)).status, 200);
  assert.equal((await fetch(`${base}/runs/..%2Fpackage.json`)).status, 404);
  assert.equal((await fetch(`${base}/process`)).status, 200);
});
