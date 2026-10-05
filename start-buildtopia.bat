@echo off
setlocal
cd /d "%~dp0"
set "PORT=4173"

where py >nul 2>&1
if %errorlevel%==0 (
  start "Buildtopia server" /b py -m http.server %PORT% --bind 127.0.0.1
  goto open_game
)

where python >nul 2>&1
if %errorlevel%==0 (
  start "Buildtopia server" /b python -m http.server %PORT% --bind 127.0.0.1
  goto open_game
)

echo Python was not found. Install Python, then run this file again.
pause
exit /b 1

:open_game
rem Start-Sleep works when this launcher is run from an editor or a redirected shell.
powershell -NoProfile -Command "Start-Sleep -Milliseconds 750" >nul 2>&1
start "" "http://127.0.0.1:%PORT%/?v=20261005wardrobe1"
