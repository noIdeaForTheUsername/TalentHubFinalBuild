@echo off
REM Run the full setup (drop/create/clean/seed), build and start, capturing output to logs/setup-start.log
REM Usage: open cmd.exe, cd to repository root, then: scripts\run-and-capture.cmd

cd /d %~dp0\..
if not exist logs mkdir logs
set LOGFILE=logs\setup-start.log

echo ===== Running setup-all.js (drop/create/clean/seed) =====> %LOGFILE%
node .\scripts\setup-all.js > %LOGFILE% 2>&1

echo ===== Running npm run build =====>> %LOGFILE%
npm.cmd run build >> %LOGFILE% 2>&1

echo ===== Running npm start =====>> %LOGFILE%
npm.cmd start >> %LOGFILE% 2>&1

echo Done. Log saved to %LOGFILE%
pause
