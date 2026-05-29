$ErrorActionPreference = "Stop"
$commands = @("node", "npm", "wrangler", "git")

foreach ($command in $commands) {
  $found = Get-Command $command -ErrorAction SilentlyContinue
  if ($found) {
    Write-Host "$command OK -> $($found.Source)" -ForegroundColor Green
  } else {
    Write-Host "$command NAO ENCONTRADO" -ForegroundColor Red
  }
}

$supabaseVersion = npx supabase --version
Write-Host "supabase OK -> $supabaseVersion" -ForegroundColor Green

wrangler whoami
