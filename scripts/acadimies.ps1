[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("Sprint01Verify", "Sprint02Verify", "Sprint03Verify", "Sprint04Verify", "Sprint05Verify", "Sprint06Verify", "Sprint07Verify", "Sprint08AVerify", "Sprint08BVerify", "Sprint08CVerify", "Sprint08DVerify", "Sprint08EVerify", "Sprint08FVerify", "Sprint10AVerify", "Sprint10BVerify", "Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify", "Sprint15Verify", "Sprint16Verify", "Sprint17Verify", "Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify", "Sprint08GVerify", "Sprint08HVerify", "Sprint09AVerify", "Sprint09BVerify", "Sprint09CVerify", "Sprint09DVerify", "Sprint09EVerify", "Sprint09FVerify")]
    [string]$Action
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ArtifactDirectory = Join-Path $ProjectRoot "artifacts\verification"
$SprintNumber = switch ($Action) {
    "Sprint01Verify" { "01" }
    "Sprint02Verify" { "02" }
    "Sprint03Verify" { "03" }
    "Sprint04Verify" { "04" }
    "Sprint05Verify" { "05" }
    "Sprint06Verify" { "06" }
    "Sprint07Verify" { "07" }
    "Sprint08AVerify" { "08A" }
    "Sprint08BVerify" { "08B" }
    "Sprint08CVerify" { "08C" }
    "Sprint08DVerify" { "08D" }
    "Sprint08EVerify" { "08E" }
    "Sprint08FVerify" { "08F" }
    "Sprint08GVerify" { "08G" }
    "Sprint08HVerify" { "08H" }
    "Sprint09AVerify" { "09A" }
    "Sprint09BVerify" { "09B" }
    "Sprint09CVerify" { "09C" }
    "Sprint09DVerify" { "09D" }
    "Sprint09EVerify" { "09E" }
    "Sprint09FVerify" { "09F" }
    "Sprint10AVerify" { "10A" }
    "Sprint10BVerify" { "10B" }
    "Sprint10CVerify" { "10C" }
    "Sprint10DVerify" { "10D" }
    "Sprint10EVerify" { "10E" }
    "Sprint10GVerify" { "10G" }
    "Sprint10HVerify" { "10H" }
    "Sprint10IVerify" { "10I" }
    "Sprint10JVerify" { "10J" }
    "Sprint10KVerify" { "10K" }
    "Sprint11Verify" { "11" }
    "Sprint12Verify" { "12" }
    "Sprint12AVerify" { "12A" }
    "Sprint12BVerify" { "12B" }
    "Sprint12CVerify" { "12C" }
    "Sprint13Verify" { "13" }
    "Sprint14Verify" { "14" }
    "Sprint15Verify" { "15" }
    "Sprint16Verify" { "16" }
    "Sprint17Verify" { "17" }
    "Sprint18Verify" { "18" }
    "Sprint19Verify" { "19" }
    "Sprint20Verify" { "20" }
    "Sprint21Verify" { "21" }
    "Sprint22Verify" { "22" }
    "Sprint23Verify" { "23" }
    "Sprint24Verify" { "24" }
}
$ResultsPath = Join-Path $ArtifactDirectory "sprint-$SprintNumber-results.txt"
$FailuresPath = Join-Path $ArtifactDirectory "sprint-$SprintNumber-failures.txt"
$WordPressSource = Join-Path $ProjectRoot "WordPress.2026-09-14.xml"
$InspectionPath = Join-Path $ArtifactDirectory "sprint-$SprintNumber-wordpress-inspection.json"
$RequestedAction = $Action
if ($RequestedAction -in @("Sprint15Verify", "Sprint16Verify", "Sprint17Verify", "Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) { $Action = "Sprint14Verify" }

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue
& chcp.com 65001 | Out-Null

New-Item -ItemType Directory -Path $ArtifactDirectory -Force | Out-Null
Set-Content -LiteralPath $ResultsPath -Value "Acadimies Sprint $SprintNumber verification`nStarted: $([DateTimeOffset]::Now.ToString('o'))" -Encoding utf8
Set-Content -LiteralPath $FailuresPath -Value "" -Encoding utf8 -NoNewline

function Write-Result {
    param([string]$Message)
    Write-Host $Message
    Add-Content -LiteralPath $ResultsPath -Value $Message -Encoding utf8
}

function ConvertTo-EnglishLogLine {
    param([string]$Text)

    if ($null -eq $Text) { return "" }

    $plain = [string]$Text
    $replacements = @(
        @(([char]0x2713).ToString(), "PASS"),
        @(([char]0x25CB).ToString(), "STATIC"),
        @(([char]0x251C).ToString(), "|"),
        @(([char]0x2514).ToString(), "|"),
        @(([char]0x250C).ToString(), ""),
        @(([char]0x2500).ToString(), "-"),
        @(([char]0x2593).ToString(), ""),
        @(([char]0x25B2).ToString(), "NEXT")
    )

    foreach ($replacement in $replacements) {
        $plain = [regex]::Replace(
            $plain,
            [regex]::Escape([string]$replacement[0]),
            [string]$replacement[1]
        )
    }
    return $plain
}

function Invoke-NpmStep {
    param(
        [string]$Name,
        [string[]]$Arguments
    )

    Write-Result "`n--- $Name ---"
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & npm.cmd @Arguments 2>&1 | ForEach-Object {
            $rawLine = if ($_ -is [System.Management.Automation.ErrorRecord]) {
                [string]$_.Exception.Message
            } else {
                [string]$_
            }
            if ($rawLine -ne "System.Management.Automation.RemoteException") {
                $plainLine = ConvertTo-EnglishLogLine -Text $rawLine
                Write-Host $plainLine
                Add-Content -LiteralPath $ResultsPath -Value $plainLine -Encoding utf8
            }
        }
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($exitCode -ne 0) {
        "FAIL: $Name (exit $exitCode)" | Set-Content -LiteralPath $FailuresPath -Encoding utf8
        Write-Result "FAIL: $Name"
        throw "$Name failed. Review $FailuresPath and $ResultsPath."
    }

    Write-Result "PASS: $Name"
}

Push-Location $ProjectRoot
try {
    if (-not (Test-Path -LiteralPath $WordPressSource -PathType Leaf)) {
        throw "Required WordPress source is missing: $WordPressSource"
    }

    # Dependency synchronization is owner-run through this script. It does not
    # create or migrate a database and never prints environment file contents.
    Invoke-NpmStep -Name "Dependency synchronization" -Arguments @("install", "--no-audit", "--no-fund")
    Invoke-NpmStep -Name "TypeScript strict check" -Arguments @("run", "typecheck")
    Invoke-NpmStep -Name "ESLint" -Arguments @("run", "lint")
    Invoke-NpmStep -Name "Vitest" -Arguments @("run", "test")
    Invoke-NpmStep -Name "Production build" -Arguments @("run", "build")
    if ($Action -in @("Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Production homepage asset budget" -Arguments @("run", "performance:inspect")
    }
    if ($Action -in @("Sprint08CVerify", "Sprint08DVerify", "Sprint08EVerify", "Sprint08GVerify", "Sprint08HVerify", "Sprint09AVerify", "Sprint09BVerify", "Sprint09CVerify", "Sprint09DVerify", "Sprint09EVerify", "Sprint09FVerify", "Sprint10AVerify", "Sprint10BVerify", "Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify", "Sprint08FVerify")) {
        Invoke-NpmStep -Name "Admin backend configuration" -Arguments @("run", "admin:inspect")
    }
    if ($Action -in @("Sprint10BVerify", "Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Public search FULLTEXT readiness" -Arguments @("run", "search:index:inspect")
    }
    if ($Action -in @("Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Article template enum readiness" -Arguments @("run", "article:templates:inspect")
    }
    if ($Action -in @("Sprint08EVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Newsletter backend configuration" -Arguments @("run", "newsletter:inspect")
    }
    if ($Action -eq "Sprint09CVerify") {
        Invoke-NpmStep -Name "Editorial media database readiness" -Arguments @("run", "editor:media:inspect")
        Invoke-NpmStep -Name "Local WEBP media registration dry run" -Arguments @("run", "editor:media:register-demo")
    }
    if ($Action -in @("Sprint03Verify", "Sprint04Verify", "Sprint05Verify", "Sprint06Verify", "Sprint07Verify", "Sprint08AVerify", "Sprint08BVerify", "Sprint08CVerify", "Sprint08DVerify", "Sprint08EVerify", "Sprint08FVerify", "Sprint08GVerify", "Sprint08HVerify", "Sprint09AVerify", "Sprint09BVerify", "Sprint09CVerify", "Sprint09DVerify", "Sprint09EVerify", "Sprint09FVerify", "Sprint10AVerify", "Sprint10BVerify", "Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Editorial browser contracts" -Arguments @("run", "test:e2e")
    }
    if ($Action -in @("Sprint08GVerify", "Sprint08HVerify", "Sprint09AVerify", "Sprint09BVerify", "Sprint09CVerify", "Sprint09DVerify", "Sprint09EVerify", "Sprint09FVerify", "Sprint10AVerify", "Sprint10BVerify", "Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "WordPress staging dry run" -Arguments @("run", "wp:stage", "--", "--source", $WordPressSource)
    }
    if ($Action -in @("Sprint10CVerify", "Sprint10DVerify", "Sprint10EVerify", "Sprint10GVerify", "Sprint10HVerify", "Sprint10IVerify", "Sprint10JVerify", "Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "WordPress editorial content and media audit" -Arguments @("run", "wp:editorial-audit", "--", "--source", $WordPressSource, "--samples", "12")
        Invoke-NpmStep -Name "WordPress media import dry run" -Arguments @("run", "wp:media", "--", "--source", $WordPressSource)
        Invoke-NpmStep -Name "WordPress editorial draft preflight" -Arguments @("run", "wp:drafts", "--", "--source", $WordPressSource)
    }
    if ($Action -eq "Sprint10JVerify") {
        Invoke-NpmStep -Name "WordPress publication reconciliation" -Arguments @("run", "wp:reconcile", "--", "--source", $WordPressSource)
    }
    if ($Action -in @("Sprint10KVerify", "Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Readership analytics schema readiness" -Arguments @("run", "analytics:inspect")
        Invoke-NpmStep -Name "WordPress publication reconciliation" -Arguments @("run", "wp:reconcile", "--", "--source", $WordPressSource)
    }
    if ($Action -in @("Sprint11Verify", "Sprint12Verify", "Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
      Invoke-NpmStep -Name "Release readiness and restore baseline" -Arguments @("run", "release:inspect")
    }
    if ($Action -in @("Sprint12AVerify", "Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Editorial author and SEO repair dry run" -Arguments @("run", "content:repair:inspect")
    }
    if ($Action -in @("Sprint12BVerify", "Sprint12CVerify", "Sprint13Verify", "Sprint14Verify")) {
        Invoke-NpmStep -Name "Golden Cup template fixtures dry run" -Arguments @("run", "demo:golden-cup:inspect")
    }
    if ($Action -eq "Sprint14Verify") {
        Invoke-NpmStep -Name "Post redirect schema readiness" -Arguments @("run", "redirects:inspect")
    }
    if ($RequestedAction -in @("Sprint15Verify", "Sprint16Verify", "Sprint17Verify", "Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Scheduled article publication dry run" -Arguments @("run", "articles:scheduled:inspect")
    }
    if ($RequestedAction -in @("Sprint16Verify", "Sprint17Verify", "Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Scheduled publisher endpoint readiness" -Arguments @("run", "articles:scheduler:inspect")
    }
    if ($RequestedAction -in @("Sprint17Verify", "Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Publication queue readiness" -Arguments @("run", "articles:queue:inspect")
    }
    if ($RequestedAction -in @("Sprint18Verify", "Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Editorial syndication readiness" -Arguments @("run", "syndication:inspect")
    }
    if ($RequestedAction -in @("Sprint19Verify", "Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Public author archive readiness" -Arguments @("run", "authors:inspect")
    }
    if ($RequestedAction -in @("Sprint20Verify", "Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Public topic archive readiness" -Arguments @("run", "topics:inspect")
    }
    if ($RequestedAction -in @("Sprint21Verify", "Sprint22Verify", "Sprint23Verify", "Sprint24Verify")) {
        Invoke-NpmStep -Name "Newsletter confirmation delivery dry run" -Arguments @("run", "newsletter:confirmations:inspect")
    }
    if ($RequestedAction -eq "Sprint24Verify") {
        Write-Result "`n--- Production smoke script syntax ---"
        & node.exe --check (Join-Path $ProjectRoot "scripts\production-smoke.mjs")
        if ($LASTEXITCODE -ne 0) { throw "Production smoke script syntax failed." }
        Write-Result "PASS: Production smoke script syntax"
        if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "docs\papaki-rollback.md") -PathType Leaf)) {
            throw "Papaki rollback guide is missing."
        }
        Write-Result "PASS: Papaki rollback guide present"
    }
    if ($Action -eq "Sprint09DVerify") {
        Invoke-NpmStep -Name "WordPress media import dry run" -Arguments @("run", "wp:media", "--", "--source", $WordPressSource)
    }
    if ($Action -eq "Sprint09EVerify") {
        Invoke-NpmStep -Name "WordPress media import dry run" -Arguments @("run", "wp:media", "--", "--source", $WordPressSource)
        Invoke-NpmStep -Name "WordPress editorial draft preflight" -Arguments @("run", "wp:drafts", "--", "--source", $WordPressSource)
    }
    if ($Action -eq "Sprint01Verify") {
        Invoke-NpmStep -Name "WordPress dry-run inspection" -Arguments @(
            "run", "wp:inspect", "--",
            "--source", $WordPressSource,
            "--output", $InspectionPath
        )
    }

    Set-Content -LiteralPath $FailuresPath -Value "PASS - no failed steps." -Encoding utf8
    Write-Result "`nPASS: Sprint $SprintNumber verification completed."
    if ($Action -eq "Sprint01Verify") {
        Write-Result "Inspection report: $InspectionPath"
    }
    Write-Result "Completed: $([DateTimeOffset]::Now.ToString('o'))"
}
catch {
    $failureMessage = ($_.Exception.Message | Out-String).Trim()
    if ([string]::IsNullOrWhiteSpace($failureMessage)) {
        $failureMessage = ($_ | Out-String).Trim()
    }
    if ([string]::IsNullOrWhiteSpace($failureMessage)) {
        $failureMessage = "Unknown verification runner failure."
    }

    if ((Get-Item -LiteralPath $FailuresPath).Length -le 3) {
        $failureMessage | Set-Content -LiteralPath $FailuresPath -Encoding utf8
    }
    Write-Result "`nFAIL: $failureMessage"
    exit 1
}
finally {
    Pop-Location
}
