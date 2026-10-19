$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$resp = Invoke-WebRequest -Uri "$baseUrl/dept_reports?select=dept_name,status,report_date&order=report_date.desc&limit=1000" -Headers $headers -Method Get
$reports = $resp.Content | ConvertFrom-Json

# Group by date
$byDate = @{}
foreach ($r in $reports) {
    $d = $r.report_date
    if (-not $byDate.ContainsKey($d)) {
        $byDate[$d] = @{ present = 0; total = 0; depts = @{} }
    }
    $byDate[$d].total++
    if ($r.status -eq 'Present') { $byDate[$d].present++ }
    
    $dn = $r.dept_name
    if (-not $byDate[$d].depts.ContainsKey($dn)) {
        $byDate[$d].depts[$dn] = @{ present = 0; total = 0 }
    }
    $byDate[$d].depts[$dn].total++
    if ($r.status -eq 'Present') { $byDate[$d].depts[$dn].present++ }
}

Write-Output "Overall Workforce Attendance by Date:"
$byDate.Keys | Sort-Object -Descending | Select-Object -First 5 | ForEach-Object {
    $d = $_
    $item = $byDate[$d]
    $pct = [math]::Round(($item.present / $item.total) * 100)
    Write-Output "Date: $d | Total Workforce: $($item.present) / $($item.total) ($pct%) | Units reporting: $($item.depts.Keys.Count)"
}
