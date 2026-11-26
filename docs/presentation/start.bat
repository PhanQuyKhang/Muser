@echo off
rem Serves the deck on http://localhost:8765 (needs Python). The 3D backdrop needs a server; file:// will not load it.
cd /d "%~dp0"
start "" http://localhost:8765/index.html
python -m http.server 8765
