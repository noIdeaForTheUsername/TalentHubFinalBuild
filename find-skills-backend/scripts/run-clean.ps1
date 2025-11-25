<#
run-clean.ps1
Opens a fresh PowerShell process with selected environment variables removed
and runs the repository setup (`scripts/setup-all.js`) there. This is useful to
test the full setup as if running on a machine without DB-related env vars.

Usage (PowerShell):
  .\scripts\run-clean.ps1

Notes:
- This does not permanently change your user/system environment variables.
- It runs a new PowerShell process so your current session stays unchanged.
#>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$inner = @"
Set-Location -Path '$root'
Remove-Item Env:DB_HOST -ErrorAction SilentlyContinue
Remove-Item Env:DB_PORT -ErrorAction SilentlyContinue
Remove-Item Env:DB_USER -ErrorAction SilentlyContinue
Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue
Remove-Item Env:DB_ADMIN_USER -ErrorAction SilentlyContinue
Remove-Item Env:DB_ADMIN_PASSWORD -ErrorAction SilentlyContinue
Write-Host 'Clean environment ready — running setup-all.js'
node .\scripts\setup-all.js
"@

Write-Host "Starting fresh PowerShell process to run setup with cleared env vars..."
& powershell -NoProfile -ExecutionPolicy Bypass -Command $inner
