# Makefile — 이 파일은 test/build/clean 기본 명령 스텁입니다. 실제 빌드/테스트 명령으로 교체하세요.

.PHONY: test build clean

test:
	./tests/smoke_test.sh

build:
	@echo "stub: no build command configured"

clean:
	rm -rf logs/* artifacts/*
	@touch logs/.gitkeep artifacts/.gitkeep
