@echo off
cd /d "%~dp0"
if not exist node_modules\.bin\vite.cmd (
  call npm ci
  if errorlevel 1 goto end
)
call npm run build
if errorlevel 1 goto end
call npm run preview -- --open
:end
pause

