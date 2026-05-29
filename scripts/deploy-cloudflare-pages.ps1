param(
  [Parameter(Mandatory = $true)]
  [string]$BackendUrl,

  [Parameter(Mandatory = $false)]
  [string]$ProjectName = "flowimage"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

Set-Content -Path (Join-Path $frontend ".env.production") -Value "VITE_API_BASE_URL=$BackendUrl" -Encoding utf8

Set-Location $frontend
npm run build
wrangler pages deploy dist --project-name $ProjectName

Write-Host "Cloudflare Pages publicado." -ForegroundColor Green
