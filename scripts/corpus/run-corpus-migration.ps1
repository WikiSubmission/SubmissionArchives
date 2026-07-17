param(
  [ValidateSet("audit", "stage", "verify", "cleanup")]
  [string]$Command = "audit",
  [string]$Package = ""
)

$ErrorActionPreference = "Stop"

$argsList = @("scripts/corpus/integrate-complete-corpus.mjs", $Command)
if ($Package) {
  $argsList += "--package=$Package"
}

Write-Host "Running AskArchives corpus migration: $Command" -ForegroundColor Cyan
node @argsList
if ($LASTEXITCODE -ne 0) {
  throw "Corpus migration failed with exit code $LASTEXITCODE"
}
