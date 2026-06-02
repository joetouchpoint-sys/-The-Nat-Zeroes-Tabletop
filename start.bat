@echo off
cd /d "%~dp0"
start "Nat Zeroes Server" python -m http.server 8787
timeout /t 1 /nobreak >nul
start "" "http://localhost:8787"
