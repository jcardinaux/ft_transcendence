<#
.SYNOPSIS
    Prepara e avvia l'app ft_transcendence in ambiente locale senza Docker.

.DESCRIPTION
    - Crea automaticamente il file .env partendo da .env.example e genera un JWT_SECRET casuale.
    - Genera (o rigenera) i certificati HTTPS self-signed richiesti da Fastify.
    - Esegue npm install nel sottoprogetto app/ se necessario.
    - Opzionalmente builda gli asset o avvia il server in modalità dev/prod.

.PARAMETER ForceEnv
    Ricrea il file .env e forza la rigenerazione del JWT_SECRET anche se il file esiste già.

.PARAMETER ForceCerts
    Rigenera i certificati HTTPS anche se già presenti.

.PARAMETER ForceInstall
    Esegue npm install anche se node_modules è già presente.

.PARAMETER BuildAssets
    Lancia "npm run build" dopo l'installazione delle dipendenze.

.PARAMETER StartDev
    Avvia "npm run dev" (watcher + Fastify). Bloccante finché non si interrompe il processo.

.PARAMETER StartProd
    Avvia "npm start" (Fastify senza watcher). Non combinabile con -StartDev.

.EXAMPLE
    # Prepara ambiente + asset e avvia dev server
    pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -BuildAssets -StartDev

.EXAMPLE
    # Solo setup (env, certs, deps)
    pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1
#>
[CmdletBinding()]
param(
    [switch]$ForceEnv,
    [switch]$ForceCerts,
    [switch]$ForceInstall,
    [switch]$BuildAssets,
    [switch]$StartDev,
    [switch]$StartProd
)

if ($StartDev -and $StartProd) {
    throw "Non puoi usare -StartDev e -StartProd insieme."
}

$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Message, [ConsoleColor]$Color = [ConsoleColor]::Cyan)
    Write-Host "`n==> $Message" -ForegroundColor $Color
}

function Ensure-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Comando '$Name' non trovato. Installalo e riprova."
    }
}

function New-JwtSecret {
    param([int]$Bytes = 32)
    $buffer = New-Object byte[] $Bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($buffer)
    return [Convert]::ToBase64String($buffer)
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$appDir = Join-Path $repoRoot 'app'

if (-not (Test-Path $appDir)) {
    throw "Cartella 'app' non trovata. Esegui lo script dalla root del repository."
}

Write-Section "Verifica prerequisiti"
Ensure-Command -Name 'node'
Ensure-Command -Name 'npm'

# 1. File .env
Write-Section "Preparazione file .env"
$envExample = Join-Path $appDir '.env.example'
$envFile = Join-Path $appDir '.env'
if (-not (Test-Path $envExample)) {
    throw ".env.example mancante in app/."
}

if ($ForceEnv -or -not (Test-Path $envFile)) {
    Copy-Item -Path $envExample -Destination $envFile -Force
    Write-Host ".env creato/rigenerato" -ForegroundColor Green
} else {
    Write-Host ".env già presente (usa -ForceEnv per rigenerarlo)" -ForegroundColor Yellow
}

$envLines = Get-Content -Path $envFile -Encoding UTF8
$secretNeedsUpdate = $ForceEnv -or ($envLines | Where-Object { $_ -match '^JWT_SECRET=devJWT' })
if ($secretNeedsUpdate) {
    $newSecret = New-JwtSecret
    $envLines = $envLines | ForEach-Object {
        if ($_ -match '^JWT_SECRET=') { "JWT_SECRET=$newSecret" } else { $_ }
    }
    $envLines | Set-Content -Path $envFile -Encoding UTF8
    Write-Host "JWT_SECRET aggiornato" -ForegroundColor Green
} else {
    Write-Host "JWT_SECRET già personalizzato" -ForegroundColor Yellow
}

# 2. Certificati HTTPS
Write-Section "Generazione certificati HTTPS"
$certDir = Join-Path $appDir 'certs'
$certKey = Join-Path $certDir 'server.key'
$certCrt = Join-Path $certDir 'server.crt'
if (-not (Test-Path $certDir)) {
    New-Item -Path $certDir -ItemType Directory | Out-Null
}

if ($ForceCerts -or -not (Test-Path $certKey) -or -not (Test-Path $certCrt)) {
    Ensure-Command -Name 'openssl'
    Write-Host "Rigenero certificati..." -ForegroundColor Green
    & openssl genrsa -out $certKey 2048 | Out-Null
    & openssl req -new -x509 -key $certKey `
        -out $certCrt `
        -days 365 `
        -subj "/C=IT/ST=Rome/L=Rome/O=42Roma/OU=ft_transcendence/CN=localhost" `
        -addext "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1" | Out-Null
    Write-Host "Certificati pronti in $certDir" -ForegroundColor Green
} else {
    Write-Host "Certificati già presenti (usa -ForceCerts per rigenerarli)" -ForegroundColor Yellow
}

# 3. npm install
Write-Section "Installazione dipendenze npm"
$nodeModules = Join-Path $appDir 'node_modules'
$shouldInstall = $ForceInstall -or -not (Test-Path $nodeModules)
if ($shouldInstall) {
    Push-Location $appDir
    try {
        npm install
    }
    finally {
        Pop-Location
    }
} else {
    Write-Host "Dipendenze già installate (usa -ForceInstall per reinstallare)" -ForegroundColor Yellow
}

# 4. Build opzionale
if ($BuildAssets) {
    Write-Section "Build asset frontend"
    Push-Location $appDir
    try {
        npm run build
    }
    finally {
        Pop-Location
    }
}

# 5. Avvio server opzionale
if ($StartDev -or $StartProd) {
    $command = if ($StartDev) { 'npm run dev' } else { 'npm start' }
    $label = if ($StartDev) { 'dev server (watcher)' } else { 'Fastify (prod-like)' }
    Write-Section "Avvio $label"
    Push-Location $appDir
    try {
        iex $command
    }
    finally {
        Pop-Location
    }
} else {
    Write-Section "Setup completato"
    Write-Host "Ora puoi eseguire uno dei seguenti comandi:" -ForegroundColor Green
    Write-Host "  pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -StartDev" -ForegroundColor Cyan
    Write-Host "  pwsh -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -StartProd" -ForegroundColor Cyan
}
