#!/bin/sh
# stop 훅: 에이전트 세션이 끝날 때, docs/TASKS.md 갱신을 잊지 않도록 상기시킵니다.

if command -v jq >/dev/null 2>&1; then
  jq -n '{agentMessage:"세션을 마치기 전에 docs/TASKS.md 체크리스트를 갱신했는지 확인하세요."}'
fi

exit 0
