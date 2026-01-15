@echo off
echo Building Cluadestrate Agent for Windows...
echo.

cd /d "%~dp0\.."

echo Installing dependencies...
call npm install

echo.
echo Compiling TypeScript...
call npm run build

echo.
echo Building Windows executable...
call npx pkg . --target node18-win-x64 --output dist\bin\cluadestrate-agent-win-x64.exe

echo.
echo Build complete!
echo Output: dist\bin\cluadestrate-agent-win-x64.exe
echo.

pause
