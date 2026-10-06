# =========================================================================
# Scrum Ceremonies Copilot - Servidor Local y Red Aptiv
# =========================================================================
$env:PYTHONPATH = "backend"

# Detectar IP de red local/intranet
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254*' } | Select-Object -First 1).IPAddress
if (-not $ip) { $ip = "127.0.0.1" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Scrum Ceremonies Copilot (Planning & Retrospective)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Acceso Local (Esta PC):       http://localhost:8000" -ForegroundColor White
Write-Host "  Acceso Equipo (Red Aptiv):    http://${ip}:8000" -ForegroundColor Yellow
Write-Host "  Forms Retro Móvil / Laptops:  http://${ip}:8000/?view=retro-live" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Escuchando en 0.0.0.0:8000 para permitir conexiones del equipo..." -ForegroundColor Gray
Write-Host ""

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
