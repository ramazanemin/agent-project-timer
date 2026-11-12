# Starts the dashboard without npm. Records remain inside this D: project.
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22.13+ kurulumu gerekiyor.' }
$env:AGENT_TIMER_DB = Join-Path $PSScriptRoot '.data\timer.sqlite'
Write-Host 'Ayni veritabanini kullanmasi icin agentlari da bu terminalden baslatin.'
& node (Join-Path $PSScriptRoot 'src\cli.js') serve
