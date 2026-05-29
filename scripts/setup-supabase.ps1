param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,

  [Parameter(Mandatory = $true)]
  [string]$DbPassword,

  [Parameter(Mandatory = $false)]
  [string]$AccessToken
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ($AccessToken) {
  npx supabase login --token $AccessToken --name flowimage
}

npx supabase link --project-ref $ProjectRef --password $DbPassword
npx supabase db push --linked --include-seed --password $DbPassword

Write-Host "Supabase configurado e migrations aplicadas." -ForegroundColor Green
