@echo off
rem Usage: scripts\package.bat  ->  distventmind-DATE.zip without out/, inbox/, .env, __pycache__
cd /d "%~dp0.."
python scripts\package.py
