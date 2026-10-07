// ② 직접 작성: 계약(브리프)의 모양
//
// 계약 = 요약을 쓰기 "전에" Editor가 기사마다 정하는 '이 요약이 반드시 해내야 할 것'.
//   - Writer는 이걸 지시로 받는다.
//   - Checker는 이걸 채점표로 받아, 못 지킨 항목을 unmet으로 돌려준다.
// 이 스키마가 곧 세 에이전트가 주고받는 서류 양식이다 (claude -p --json-schema 로 강제됨).
//
// 정해진 것: picks 배열, 각 항목의 id (= 후보 기사 id, 예: "hn-12345").
// 직접 정할 것: 각 pick에 어떤 필드가 있어야 Checker가 "지켰다/못 지켰다"를 판정할 수 있는가?
//   힌트 — "흥미롭게 써라"는 판정 불가. "기사의 벤치마크 수치를 포함" 은 판정 가능.
//   필드를 추가하면 properties에 넣고, 반드시 채워야 하면 required에도 넣는다.
export const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          // TODO
        },
        required: ['id'],
      },
    },
  },
  required: ['picks'],
};
