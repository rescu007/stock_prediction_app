@echo off
color 0b
echo ========================================================
echo   Starting the Advanced Indian Stock Dashboard Platform
echo ========================================================
echo.
echo Launching local server...
echo The Terminal will remain open while the server runs.
echo To shut down the app, press CTRL + C or close this window.
echo.

:: Automatically open the default web browser to the dashboard
start http://127.0.0.1:5000

:: Run the Flask Application using the proper Python environment on your machine
"C:\Users\Girish Deshmukh\AppData\Local\Python\pythoncore-3.14-64\python.exe" app.py

pause
