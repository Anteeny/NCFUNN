$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

# Fetch department leaders and dept_reports to see unit health
$respDepts = Invoke-WebRequest -Uri "$baseUrl/department_leaders" -Headers $headers -Method Get
$depts = $respDepts.Content | ConvertFrom-Json

$respDeptReports = Invoke-WebRequest -Uri "$baseUrl/dept_reports?select=dept_name,status,report_date&limit=1000" -Headers $headers -Method Get
$deptReports = $respDeptReports.Content | ConvertFrom-Json

Write-Output "=== UNIT HEALTH FROM 566 DEPT REPORTS ==="
$unitStats = @{}
foreach ($r in $deptReports) {
    $dn = $r.dept_name
    if (-not $unitStats.ContainsKey($dn)) {
        $unitStats[$dn] = @{ present = 0; total = 0 }
    }
    $unitStats[$dn].total++
    if ($r.status -eq 'Present') {
        $unitStats[$dn].present++
    }
}

foreach ($d in $depts) {
    $dn = $d.department_name
    $leader = $d.leader_name
    $st = $unitStats[$dn]
    if ($st -and $st.total -gt 0) {
        $pct = [math]::Round(($st.present / $st.total) * 100)
        Write-Output "$dn (Leader: $leader): $pct% attendance ($($st.present)/$($st.total))"
    } else {
        Write-Output "$dn (Leader: $leader): No reports recorded yet"
    }
}
