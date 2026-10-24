# Run from PowerShell; works from any current directory.
$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot
try {
    docker info --format '{{.ServerVersion}}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Abra o Docker Desktop e tente novamente." }
    docker compose up --build -d --wait --wait-timeout 600
    if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel iniciar. Confira docker compose logs --tail=80." }
    Write-Host "Sistema disponivel em http://localhost:5173"
} finally {
    Pop-Location
}
