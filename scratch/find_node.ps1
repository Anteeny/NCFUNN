$searchPaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs",
    "$env:APPDATA\npm",
    "$env:USERPROFILE\.nvm",
    "$env:USERPROFILE\scoop\apps\nodejs",
    "$env:ProgramData\chocolatey\bin"
)

Write-Output "=== SEARCHING FOR NODE.EXE ==="
foreach ($p in $searchPaths) {
    if (Test-Path $p) {
        Write-Output "Checking $p..."
        $found = Get-ChildItem -Path $p -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            Write-Output "FOUND NODE AT: $($found.FullName)"
        }
    }
}

# Also search standard drives
Write-Output "=== BROAD SEARCH ==="
$candidates = @(
    "C:\Program Files\nodejs\node.exe",
    "C:\Program Files (x86)\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\node\node.exe"
)
foreach ($c in $candidates) {
    if (Test-Path $c) {
        Write-Output "EXISTS: $c"
    }
}
