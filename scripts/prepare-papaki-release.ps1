[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseRoot = Join-Path $ProjectRoot "artifacts\release"
$StageRoot = Join-Path $ReleaseRoot "acadimies-app"
$ArchivePath = Join-Path $ReleaseRoot "acadimies-papaki-release.zip"

$resolvedProject = [IO.Path]::GetFullPath($ProjectRoot)
$resolvedRelease = [IO.Path]::GetFullPath($ReleaseRoot)
if (-not $resolvedRelease.StartsWith($resolvedProject + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Release directory escaped the project root."
}

if (Test-Path -LiteralPath $StageRoot) { Remove-Item -LiteralPath $StageRoot -Recurse -Force }
if (Test-Path -LiteralPath $ArchivePath) { Remove-Item -LiteralPath $ArchivePath -Force }
New-Item -ItemType Directory -Path $StageRoot -Force | Out-Null

$excludedDirectories = @(".git", ".next", ".next-playwright", "node_modules", "artifacts", "coverage", "e2e", "test-results", "playwright-report")
$excludedFiles = @(".env", ".env.local", ".env.production", ".env.production.local", "WordPress*.xml", "*.sql", "*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx", "*.tsbuildinfo", "npm-debug.log*", "playwright.config.ts", "vitest.config.mts")

$robocopyArguments = @($ProjectRoot, $StageRoot, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/R:1", "/W:1", "/XD") +
    ($excludedDirectories | ForEach-Object { Join-Path $ProjectRoot $_ }) + @("/XF") + $excludedFiles
& robocopy.exe @robocopyArguments | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Release staging failed with robocopy exit code $LASTEXITCODE." }

$requiredFiles = @(
    ".node-version", ".env.production.example", "start.js", "package.json", "package-lock.json", "next.config.ts", "drizzle.config.ts",
    "src\db\schema\index.ts", "scripts\production-preflight.mjs", "scripts\production-schema-check.mjs",
    "scripts\lib\load-production-env.ts", "scripts\repair-release-permissions.sh", "scripts\production-smoke.mjs",
    "PAPAKI_PRODUCTION_DEPLOYMENT.md", "docs\papaki-rollback.md", "src\app\api\health\live\route.ts"
)
foreach ($relativePath in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $StageRoot $relativePath) -PathType Leaf)) {
        throw "Required release file is missing: $relativePath"
    }
}

$forbidden = Get-ChildItem -LiteralPath $StageRoot -Recurse -Force -File | Where-Object {
    ($_.Name -like ".env*" -and $_.Name -notin @(".env.example", ".env.production.example")) -or
    $_.Extension -in @(".sql", ".xml") -or
    $_.Name -match "\.(test|spec)\.(ts|tsx|js|jsx)$"
}
if ($forbidden) { throw "Forbidden release files found: $($forbidden.FullName -join ', ')" }

$manifestLines = Get-ChildItem -LiteralPath $StageRoot -Recurse -File | Sort-Object FullName | ForEach-Object {
    $relative = $_.FullName.Substring($StageRoot.Length).TrimStart("\", "/").Replace("\", "/")
    "$(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName | Select-Object -ExpandProperty Hash)  $relative"
}
$manifestPath = Join-Path $StageRoot "RELEASE-MANIFEST.sha256"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($manifestPath, (($manifestLines -join "`n") + "`n"), $utf8NoBom)

& tar.exe -a -c -f $ArchivePath -C $StageRoot .
if ($LASTEXITCODE -ne 0) { throw "ZIP creation failed with tar exit code $LASTEXITCODE." }
$archiveEntries = @(& tar.exe -tf $ArchivePath) | ForEach-Object { $_.Replace("\", "/") -replace "^\./", "" }
foreach ($relativePath in @($requiredFiles + "RELEASE-MANIFEST.sha256")) {
    $portablePath = $relativePath.Replace("\", "/")
    if ($portablePath -notin $archiveEntries) { throw "Required file is absent from ZIP: $portablePath" }
}
$forbiddenArchiveEntry = $archiveEntries | Where-Object {
    $_ -match "(^|/)(node_modules|\.next|\.next-playwright|artifacts|e2e|test-results)(/|$)" -or
    $_ -match "(^|/)\.env\.production\.local$" -or $_ -match "\.(sql|xml)$" -or
    $_ -match "\.(test|spec)\.(ts|tsx|js|jsx)$"
}
if ($forbiddenArchiveEntry) { throw "Forbidden ZIP entry found: $($forbiddenArchiveEntry -join ', ')" }
$archiveHash = Get-FileHash -Algorithm SHA256 -LiteralPath $ArchivePath
$archiveHash | Format-List Algorithm,Hash,Path
Write-Host "Verified release archive: $ArchivePath"
Write-Host "The archive contains source and lockfiles only. Build it on Papaki/Linux with Node 22."
