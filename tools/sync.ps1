# =====================================================================
# シート同期のワンボタンスクリプト (Windows PowerShell)。tale から移植
#
#   .\tools\sync.ps1            … 認証がなければブラウザで認証 → シート取得 → masterdata 生成 → selftest
#                                  (シート自体がまだ無ければ新規作成して初期投入)
#   .\tools\sync.ps1 -Push      … ローカルの data/*.csv をシートへ書き込み
#   .\tools\sync.ps1 -Watch     … 15 秒ごとにシートを監視して自動取り込み
#   .\tools\sync.ps1 -Relogin   … 認証をやりなおす (スコープ不足 / リフレッシュトークン失効 (7 日) のとき)
#                                  ※ 認証後にシート取り込みを走らせるので、未 push の CSV 編集は先に stash
#
# ※ このファイルは UTF-8 BOM 付きで保存すること (Windows PowerShell 5.1 は BOM 無しを Shift-JIS として読み、日本語コメントが引用符を壊す)
# 認証は gcloud の Application Default Credentials。spreadsheets スコープが要るので必ずこのスクリプト経由で認証すること。
# gcloud 内蔵の OAuth クライアントは sheets スコープで弾かれるため、自前の OAuth クライアント ID (デスクトップアプリ) の
# JSON を tools/client_secret.json に置く (作り方は librarian/tale/README.md の「データ入稿ワークフロー」)。
# =====================================================================
param(
  [switch]$Push,
  [switch]$Watch,
  [switch]$Relogin
)
$ErrorActionPreference = "Stop"

$gcloud = $null
$cmd = Get-Command gcloud -ErrorAction SilentlyContinue
if ($cmd) { $gcloud = $cmd.Source }
if (-not $gcloud) {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"),
    (Join-Path $env:ProgramFiles "Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd")
  )
  foreach ($c in $candidates) { if (Test-Path $c) { $gcloud = $c; break } }
}
if (-not $gcloud) { Write-Host "gcloud が見つからない。Google Cloud SDK を入れて"; exit 1 }

$adc = Join-Path $env:APPDATA "gcloud\application_default_credentials.json"
if ($Relogin -or -not (Test-Path $adc)) {
  $clientSecret = Join-Path $PSScriptRoot "client_secret.json"
  if (-not (Test-Path $clientSecret)) {
    Write-Host "tools\client_secret.json がありません。"
    Write-Host "自前の OAuth クライアント ID (デスクトップアプリ) の JSON をそこに置いてください (librarian/tale/README.md 参照)。"
    exit 1
  }
  Write-Host "Google 認証をブラウザで開きます (spreadsheets スコープ付き)..."
  Write-Host "「Google による確認が済んでいません」と出たら、詳細 > 続行で OK (自分がテストユーザーなので)"
  # PowerShell では --scopes の値をクォートする (カンマで配列化されるため)
  & $gcloud auth application-default login --client-id-file="$clientSecret" --scopes="https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/cloud-platform"
  if ($LASTEXITCODE -ne 0) { Write-Host "認証に失敗した"; exit 1 }
}

$toolsDir = $PSScriptRoot
$sheetIdFile = Join-Path $toolsDir "..\data\sheet_id.txt"

if ($Push) {
  node (Join-Path $toolsDir "push.js")
} elseif ($Watch) {
  node (Join-Path $toolsDir "import.js") --watch
} elseif (-not (Test-Path $sheetIdFile)) {
  Write-Host "シートがまだ無いので新規作成して初期データを投入します..."
  node (Join-Path $toolsDir "push.js") --create
} else {
  node (Join-Path $toolsDir "import.js")
}
exit $LASTEXITCODE
