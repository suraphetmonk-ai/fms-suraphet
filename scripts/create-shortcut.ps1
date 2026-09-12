param(
    [string]$AppUrl = "http://localhost:3010",
    [string]$AppName = "FMS-MCU"
)

$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "$AppName.lnk"

$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = "msedge.exe"
$s.Arguments = "--app=$AppUrl --window-size=1366,820"
$s.Description = "Faculty of Management Science MCU (FMS MCU)"
$s.Save()

Write-Host "Created Desktop shortcut: $shortcutPath" -ForegroundColor Green

$startMenu = Join-Path ([Environment]::GetFolderPath('StartMenu')) "Programs"
$startMenuPath = Join-Path $startMenu "$AppName.lnk"
$s2 = $ws.CreateShortcut($startMenuPath)
$s2.TargetPath = "msedge.exe"
$s2.Arguments = "--app=$AppUrl --window-size=1366,820"
$s2.Description = "Faculty of Management Science MCU (FMS MCU)"
$s2.Save()

Write-Host "Created Start Menu shortcut: $startMenuPath" -ForegroundColor Green
