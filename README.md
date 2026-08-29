# README.md — 이 파일은 레포 목적과 바로 해야 할 일(사용자가 채울 항목)을 간단히 적으세요. (필수)

## 이 레포는 무엇인가

OpenAI 하네스 엔지니어링(https://openai.com/ko-KR/index/harness-engineering/) 방식을
따르는 **범용 스캐폴드**입니다. 특정 프로젝트에 종속되지 않은 빈 뼈대이며, 클론한 뒤
아래 항목을 채워서 실제 프로젝트로 만드는 것을 전제로 합니다.

## 사용자가 채워야 할 것 (TODO)

- [ ] `AGENTS.md` — 각 에이전트의 `allowed_paths`/`verification`/`owner`를 프로젝트에 맞게 수정
- [ ] `AGENTS/<agent-name>/prompt.txt` — 각 에이전트에게 줄 상세 프롬프트 작성
- [ ] `docs/index.md`, `docs/architecture.md`, `docs/agent-design.md`, `docs/observability.md` — 실제 시스템 설명으로 채우기
- [ ] `src/sample_app/` — 실제(또는 샘플) 애플리케이션 코드 채우기
- [ ] `scripts/run_local.sh`, `scripts/run_smoke.sh`, `scripts/collect_metrics.sh` — 스텁을 실제 명령으로 교체
- [ ] `tests/smoke_test.sh` — 실제 헬스체크/스모크 테스트로 교체
- [ ] `observability/prometheus.yml` — 실제 스크레이프 대상으로 교체
- [ ] `infra/terraform/example.tf` — 실제 배포 대상으로 교체
- [ ] `secrets.example.env` — 실제로 필요한 환경변수 키로 교체(값은 절대 커밋 금지)
- [ ] `.github/workflows/ci.yaml` — 실제 lint/test/build 명령으로 교체
- [ ] `policies/merge-policy.md` — 실제 병합 정책으로 교체

## 로컬 재현 명령 (스텁 기준)

```bash
./scripts/run_local.sh   # 앱 기동(스텁: 실제 서비스 없으면 stub 메시지 출력 후 정상 종료)
./scripts/run_smoke.sh   # 스모크 테스트
./scripts/collect_metrics.sh
```

## 원본 요구사항

이 스캐폴드가 어떤 프롬프트에서 나왔는지는 [docs/original-spec.md](docs/original-spec.md) 참고.
