#!/bin/sh
# beforeShellExecution 훅: 프로젝트 차원에서 위험한 명령어를 자동 차단합니다.
# Cursor가 JSON 페이로드를 stdin으로 보내고, 이 스크립트는 stdout으로 JSON을 돌려줍니다.
# exit 2 = 차단(deny), exit 0 = 통과(allow)

payload=$(cat)

if ! command -v jq >/dev/null 2>&1; then
  # jq가 없으면 차단 로직을 실행할 수 없으니 일단 통과시키되, 콘솔에 경고를 남깁니다.
  echo "[hook] jq가 설치되어 있지 않아 명령어 검사를 건너뜁니다. 'brew install jq' 또는 'apt install jq'로 설치하세요." 1>&2
  echo '{"permission":"allow"}'
  exit 0
fi

cmd=$(echo "$payload" | jq -r '.command // empty')

deny() {
  jq -n --arg msg "$1" '{permission:"deny", userMessage:$msg, agentMessage:$msg}'
  exit 2
}

case "$cmd" in
  *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf ."*|*"rm -rf ios"*|*"rm -rf android"*)
    deny "위험한 삭제 명령이 차단되었습니다: $cmd (필요하면 사용자가 직접 실행하세요)" ;;
  *"git push --force"*|*"git push -f"*)
    deny "강제 푸시(force push)는 차단되었습니다. 사용자가 직접 실행해야 합니다." ;;
  *"git reset --hard"*)
    deny "git reset --hard 는 차단되었습니다. 변경사항을 잃을 수 있어 사용자 확인이 필요합니다." ;;
  *"eas submit"*|*"expo publish"*|*"npm publish"*|*" publish "*)
    deny "배포/퍼블리시 명령은 사용자가 직접 실행해야 합니다." ;;
  *)
    echo '{"permission":"allow"}' ;;
esac
