#!/bin/sh
# afterFileEdit 훅: TS/TSX 파일이 수정될 때마다 타입체크를 실행해
# 에이전트가 다음 턴으로 넘어가기 전에 즉시 피드백을 받게 합니다.
# (하네스 엔지니어링에서 말하는 "연산적 피드백 루프"를 시스템 레벨에서 강제하는 부분)

payload=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

file_path=$(echo "$payload" | jq -r '.file_path // empty')

case "$file_path" in
  *.ts|*.tsx)
    if [ -x "node_modules/.bin/tsc" ] || command -v npx >/dev/null 2>&1; then
      if npx --no-install tsc --noEmit --pretty false > /tmp/gilmoa-tsc.log 2>&1; then
        exit 0
      else
        summary=$(tail -n 20 /tmp/gilmoa-tsc.log)
        jq -n --arg msg "타입 에러가 발견되었습니다. 다음 턴에서 고쳐주세요:
$summary" '{agentMessage:$msg}'
      fi
    fi
    ;;
esac

exit 0
