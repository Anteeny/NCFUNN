$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

Write-Output "=== SERVICE REPORTS (LATEST 10) ==="
$respReports = Invoke-WebRequest -Uri "$baseUrl/service_reports?select=id,date,service_type,total_attendance,male,female,children,mvp,new_converts&order=date.desc&limit=10" -Headers $headers -Method Get
Write-Output $respReports.Content

Write-Output "`n=== SERVICE REPORTS (EARLIEST 3) ==="
$respEarliest = Invoke-WebRequest -Uri "$baseUrl/service_reports?select=date&order=date.asc&limit=3" -Headers $headers -Method Get
Write-Output $respEarliest.Content

Write-Output "`n=== MEMBERSHIP LEVELS IN MEMBERS ==="
$respMembers = Invoke-WebRequest -Uri "$baseUrl/members?select=membership_level" -Headers $headers -Method Get
# Use raw string parsing to avoid case collision
$levels = @{}
$respMembers.Content -split '\{' | ForEach-Object {
    if ($_ -match '"membership_level":\s*"([^"]+)"') {
        $lvl = $matches[1]
        if (-not $levels.ContainsKey($lvl)) { $levels[$lvl] = 0 }
        $levels[$lvl]++
    } elseif ($_ -match '"membership_level":\s*null') {
        if (-not $levels.ContainsKey('(null)')) { $levels['(null)'] = 0 }
        $levels['(null)']++
    }
}
$levels.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Output "$($_.Key): $($_.Value)"
}
