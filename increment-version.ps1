# Script to increment build number for DnD Map Viewer
param(
    [switch]$reset
)

# Read current version
$versionPath = "version.json"
if (Test-Path $versionPath) {
    $versionData = Get-Content $versionPath | ConvertFrom-Json
} else {
    # Create default version if file doesn't exist
    $versionData = @{
        build = 1
        buildDate = Get-Date -Format "yyyy-MM-dd HH:mm"
    }
}

# Increment build number or reset
if ($reset) {
    $buildNumber = 1
} else {
    $buildNumber = if ($versionData.build) { $versionData.build + 1 } else { 1 }
}

# Update version data - create new object to avoid PowerShell property issues
$newVersionData = @{
    build = $buildNumber
    buildDate = Get-Date -Format "yyyy-MM-dd HH:mm"
}

# Save to file
$newVersionData | ConvertTo-Json | Set-Content $versionPath

# Update version in HTML file
$htmlPath = "src\main\resources\templates\index.html"
if (Test-Path $htmlPath) {
    $htmlContent = Get-Content $htmlPath -Raw
    $htmlContent = $htmlContent -replace '<span id="appVersion" class="version-value">1\.\d+</span>', "<span id=`"appVersion`" class=`"version-value`">1.$buildNumber</span>"
    $htmlContent = $htmlContent -replace '<span id="buildDate" class="version-value">[^<]+</span>', "<span id=`"buildDate`" class=`"version-value`">$($newVersionData.buildDate)</span>"
    Set-Content $htmlPath $htmlContent -NoNewline
}

Write-Host "Build updated to: 1.$buildNumber (Date: $($newVersionData.buildDate))" -ForegroundColor Green
Write-Host "Updated files: version.json, index.html" -ForegroundColor Yellow
