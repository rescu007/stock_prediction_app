@echo off
color 0c
echo ========================================================
echo   Stopping the Advanced Indian Stock Dashboard...
echo ========================================================
echo.

:: Uses powershell to specifically single out the python.exe background task running "app.py" and stop only it.
powershell -Command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*app.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"

echo.
echo Dashboard Server has been successfully shut down!
pause
