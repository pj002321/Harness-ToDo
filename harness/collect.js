// 수집은 AI가 아니라 코드가 한다 — 코드로 되는 일에 모델을 쓰지 않는다.
// 분야별 언론사 RSS → 기사 페이지에서 본문·썸네일(og:image) 추출 → sources/<날짜>.json
// 분야는 피드가 정한다. 기사가 어느 분야인지 모델에게 묻지 않는다.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CATEGORIES = {
  시사: ['https://www.yna.co.kr/rss/politics.xml', 'https://www.yna.co.kr/rss/society.xml'],
  경제: ['https://www.yna.co.kr/rss/economy.xml', 'https://www.hani.co.kr/rss/economy/', 'https://www.khan.co.kr/rss/rssdata/economy_news.xml'],
  AI: ['https://www.aitimes.com/rss/allArticle.xml'],
  문화: ['https://www.yna.co.kr/rss/culture.xml', 'https://www.hani.co.kr/rss/culture/'],
};

const SOURCES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'sources');
const PER_FEED = 8;      // 피드마다 최신 몇 개를 열어볼지
const PER_CATEGORY = 12; // 분야마다 후보로 넘길 수
const MIN_TEXT = 500;    // 이보다 짧으면 근거 검증이 불가능하니 후보에서 뺀다
const TEXT_CAP = 3000;   // 에이전트에게 넘길 본문 상한 (solo·harness 동일)
const UA = { 'user-agent': 'Mozilla/5.0 harness-news' };

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', middot: '·' };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);

// ponytail: 정규식 추출 — 언론사별 군더더기(송고 시각, 공유 버튼 문구)가 섞인다. 요약 품질을 해치면 출처별 정리 규칙 추가
export function extract(html) {
  const tag = html.match(/<meta[^>]+og:image["'][^>]*>/i)?.[0];
  const image = tag?.match(/content=["']([^"']+)/i)?.[1];
  const text = [...html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  return { text, image: image && decode(image) };
}

export function parseFeed(xml) {
  const field = (s, name) => s.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1].trim();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, s]) => ({
    title: decode(field(s, 'title') ?? ''),
    url: decode(field(s, 'link') ?? ''),
    published: field(s, 'pubDate') ?? '',
  }));
}

async function fetchArticle(item, category) {
  try {
    const res = await fetch(item.url, { signal: AbortSignal.timeout(10_000), headers: UA });
    if (!res.ok) return null;
    const { text, image } = extract(await res.text());
    if (text.length < MIN_TEXT) return null;
    return {
      id: createHash('sha1').update(item.url).digest('hex').slice(0, 10),
      category,
      source: new URL(item.url).hostname.replace(/^www\./, ''),
      title: item.title,
      url: item.url,
      published: item.published,
      image: image ? new URL(image, item.url).href : null,
      text: text.slice(0, TEXT_CAP),
    };
  } catch {
    return null; // 막힌 사이트, 타임아웃 등은 조용히 제외
  }
}

async function collectCategory(category, feeds) {
  const perFeed = await Promise.all(feeds.map(async (feed) => {
    try {
      const xml = await (await fetch(feed, { signal: AbortSignal.timeout(10_000), headers: UA })).text();
      return (await Promise.all(parseFeed(xml).slice(0, PER_FEED).map((it) => fetchArticle(it, category)))).filter(Boolean);
    } catch {
      return [];
    }
  }));
  // 피드를 번갈아 섞어서 한 언론사가 후보를 독식하지 않게
  const mixed = [];
  for (let i = 0; perFeed.some((l) => i < l.length); i++) for (const l of perFeed) if (l[i]) mixed.push(l[i]);
  return mixed;
}

// file을 주면 그 스냅샷을, 없으면 오늘 것을 쓴다 (없으면 수집). solo와 harness는 같은 파일로 비교한다.
export async function loadSources(file) {
  file ??= join(SOURCES_DIR, `${new Date().toLocaleDateString('sv')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));

  console.log('  [collect] 분야별 RSS 수집 …');
  const seen = new Set();
  const articles = [];
  for (const [category, feeds] of Object.entries(CATEGORIES)) {
    // 같은 기사가 여러 분야 피드에 실리면 먼저 나온 분야에만 둔다
    const list = (await collectCategory(category, feeds)).filter((a) => !seen.has(a.id) && seen.add(a.id)).slice(0, PER_CATEGORY);
    console.log(`  [collect] ${category} ${list.length}개`);
    articles.push(...list);
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(articles, null, 2));
  console.log(`  [collect] 본문 확보 ${articles.length}개 → ${file}`);
  return articles;
}
