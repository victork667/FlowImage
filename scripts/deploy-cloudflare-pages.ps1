param(
  [Parameter(Mandatory = $true)]
  [string]$BackendUrl,

  [Parameter(Mandatory = $false)]
  [string]$ProjectName = "flowimage",

  [Parameter(Mandatory = $false)]
  [string]$SupabaseUrl = $env:VITE_SUPABASE_URL,

  [Parameter(Mandatory = $false)]
  [string]$SupabaseAnonKey = $env:VITE_SUPABASE_ANON_KEY
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

$envLines = @("VITE_API_BASE_URL=$BackendUrl")
if ($SupabaseUrl) {
  $envLines += "VITE_SUPABASE_URL=$SupabaseUrl"
}
if ($SupabaseAnonKey) {
  $envLines += "VITE_SUPABASE_ANON_KEY=$SupabaseAnonKey"
}

Set-Content -Path (Join-Path $frontend ".env.production") -Value $envLines -Encoding utf8

Set-Location $frontend
npm run build
wrangler pages deploy dist --project-name $ProjectName --commit-dirty=true

Write-Host "Cloudflare Pages publicado." -ForegroundColor Green
