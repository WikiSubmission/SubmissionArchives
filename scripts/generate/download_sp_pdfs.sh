#!/usr/bin/env bash
set -euo pipefail

DEST="$(cd "$(dirname "$0")/../.." && pwd)/public/content/written/newsletters/pdfs"
BASE="https://docs.quraniclabs.com/sp"

declare -A MONTH_ABBR=(
  [January]=jan [February]=feb [March]=mar [April]=apr [May]=may [June]=jun
  [July]=jul [August]=aug [September]=sep [October]=oct [November]=nov [December]=dec
)

fail=0

for filepath in "$DEST"/*.pdf; do
  filename="$(basename "$filepath")"
  base="${filename%.pdf}"

  year="${base:0:4}"
  rest="${base:8}" # strip "YYYY_MM_"
  monthname="${rest%%_*}"
  suffix="${rest#"$monthname"}" # e.g. "_Bulletin" or "_Bonus_Issue" or ""

  abbr="${MONTH_ABBR[$monthname]:-}"
  if [[ -z "$abbr" ]]; then
    echo "SKIP (unknown month): $filename"
    fail=1
    continue
  fi

  slug="${year}_${abbr}"
  case "$suffix" in
    "_Bulletin"|"_Bonus_Issue") slug="${slug}2" ;;
    "") : ;;
    *) echo "SKIP (unrecognized suffix '$suffix'): $filename"; fail=1; continue ;;
  esac

  url="${BASE}/${slug}"
  tmpfile="${filepath}.download"

  echo "Fetching $url -> $filename"
  if ! curl -fsSL "$url" -o "$tmpfile"; then
    echo "FAILED download: $filename ($url)"
    rm -f "$tmpfile"
    fail=1
    continue
  fi

  if ! head -c4 "$tmpfile" | grep -q "%PDF"; then
    echo "FAILED (not a PDF): $filename ($url)"
    rm -f "$tmpfile"
    fail=1
    continue
  fi

  mv "$tmpfile" "$filepath"
  echo "OK: $filename ($(du -h "$filepath" | cut -f1))"
done

if [[ "$fail" -ne 0 ]]; then
  echo "One or more files failed. Old versions were left in place for those."
  exit 1
fi

echo "All newsletter PDFs downloaded and replaced successfully."
