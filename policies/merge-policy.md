# merge-policy.md — 이 파일은 PR 병합 정책입니다. 실제 팀 규칙으로 교체하세요.

## 자동 병합 조건 (예시 — 실제 기준으로 교체)

- [ ] `.github/workflows/ci.yaml`의 모든 체크 통과 (lint, test, build)
- [ ] `scripts/collect_metrics.sh` 기준 통과
- [ ] PR 본문에 변경 요약 + 테스트 결과 + 메트릭 스냅샷 포함 (`devtools/pr_template.md` 형식)

## 사람 리뷰가 필요한 경우 (예시 — 실제 기준으로 교체)

- [ ] `policies/**`, `.github/workflows/**`, `hooks/**` 변경
- [ ] 새 외부 의존성 추가
