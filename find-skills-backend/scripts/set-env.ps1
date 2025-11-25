<#
.\set-env.ps1
Sets recommended DB environment variables for the current PowerShell session.
Usage (PowerShell):
  .\scripts\set-env.ps1
Or provide custom values:
  .\scripts\set-env.ps1 -DBUser 'findskills' -DBPassword 'pw'
#>

param(
  [string] $DBHost = 'localhost',
  [int] $DBPort = 3306,
  [string] $DBUser = 'findskills_user',
  [string] $DBPassword = 'findskills_pass',
  [string] $DBName = 'findskills_dev'
)

$env:DB_HOST = $DBHost
$env:DB_PORT = $DBPort.ToString()
$env:DB_USER = $DBUser
$env:DB_PASSWORD = $DBPassword
$env:DB_NAME = $DBName

Write-Host "Set DB env: $($env:DB_USER)@$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)"
