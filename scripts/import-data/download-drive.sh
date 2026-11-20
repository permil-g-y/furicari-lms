#!/bin/bash
# Google Drive の公開共有ファイルを、確認トークンを通して取得する。
#
# ■ なぜ専用スクリプトなのか
#   100MB を超えるファイルは「ウイルススキャン警告」の HTML が返り、
#   そのままでは MP4 が落ちてこない。警告ページのフォームを辿る必要がある。
#
# ■ 途中再開
#   curl -C - で追記再開する。完了済みのファイルはサイズ一致で判定して飛ばす。
#
# ■ curl の stdin を必ず切る
#   while read がマニフェストを stdin から読んでいるので、
#   stdin を開けたままの curl が残りの行を食い潰して 2 本目以降が消える。
set -u
OUT_DIR="$1"
MANIFEST="$2"
mkdir -p "$OUT_DIR"

python3 -c "import json,sys;[print(o['code'],o['driveFileId'],o['driveFileName'],sep='\t') for o in json.load(open(sys.argv[1]))]" "$MANIFEST" |
while IFS=$'\t' read -r CODE FID NAME; do
  DEST="$OUT_DIR/$CODE.mp4"
  COOKIE="$OUT_DIR/.$CODE.cookie"

  # 警告ページから確認トークン付きの実 URL を組み立てる
  WARN="$OUT_DIR/.$CODE.html"
  curl -sL </dev/null -c "$COOKIE" -o "$WARN" --max-time 60 \
    "https://drive.usercontent.google.com/download?id=$FID&export=download"

  if [ "$(file -b --mime-type "$WARN")" = "video/mp4" ]; then
    mv "$WARN" "$DEST"; echo "DONE_SMALL $CODE"; continue
  fi

  ACTION=$(sed -e 's/</\n</g' "$WARN" | grep -o 'action="[^"]*"' | head -1 | sed 's/action="//; s/"//' | sed 's/&amp;/\&/g')
  PARAMS=$(sed -e 's/</\n</g' "$WARN" | grep -o '<input type="hidden" name="[^"]*" value="[^"]*"' \
    | sed -E 's/.*name="([^"]*)" value="([^"]*)"/\1=\2/' | paste -sd'&' -)
  rm -f "$WARN"

  if [ -z "$ACTION" ] || [ -z "$PARAMS" ]; then
    echo "FAIL_TOKEN $CODE"; continue
  fi
  URL="${ACTION}?${PARAMS}"

  EXPECT=$(curl -sI </dev/null -b "$COOKIE" --max-time 60 "$URL" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}' | tail -1)
  HAVE=$( [ -f "$DEST" ] && stat -f%z "$DEST" || echo 0 )

  if [ -n "$EXPECT" ] && [ "$HAVE" = "$EXPECT" ]; then
    echo "SKIP $CODE ($HAVE bytes)"; rm -f "$COOKIE"; continue
  fi

  curl -sL </dev/null -b "$COOKIE" -C - -o "$DEST" --max-time 1800 --retry 3 --retry-delay 5 "$URL"
  GOT=$( [ -f "$DEST" ] && stat -f%z "$DEST" || echo 0 )
  rm -f "$COOKIE"

  if [ -n "$EXPECT" ] && [ "$GOT" != "$EXPECT" ]; then
    echo "FAIL_SIZE $CODE got=$GOT expect=$EXPECT"
  else
    echo "OK $CODE $GOT bytes  ($NAME)"
  fi
done
