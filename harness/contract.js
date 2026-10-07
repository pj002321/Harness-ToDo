// ② 직접 작성: Sprint Contract의 모양
//
// Contract = 구현 "전에" Generator와 Evaluator가 합의하는 '완료의 정의'.
// 이 스키마가 곧 두 에이전트가 주고받는 서류 양식이다 (claude -p --json-schema 로 강제됨).
//
// 정해진 것: criteria 배열, 각 항목의 id (Evaluator 판정을 항목별로 맞춰보는 키).
// 직접 정할 것: 각 항목에 어떤 필드가 있어야 "애매하지 않은 기준"이 되는가?
//   힌트 — Evaluator가 curl만 들고 이 항목을 읽었을 때 바로 검증할 수 있어야 한다.
//   harness/acceptance.json 의 필드 구성이 하나의 예시다.
//   필드를 추가하면 properties에 넣고, 반드시 채워야 하면 required에도 넣는다.
export const CONTRACT_SCHEMA = {
  type: 'object',
  properties: {
    criteria: {
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
  required: ['criteria'],
};
