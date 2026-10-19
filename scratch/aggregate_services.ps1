$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$resp = Invoke-WebRequest -Uri "$baseUrl/service_reports?select=date,service_type,total_attendance,male,female,children,mvp,new_converts&order=date.asc" -Headers $headers -Method Get
$reports = $resp.Content | ConvertFrom-Json

$byDate = @{}
foreach ($r in $reports) {
    $d = $r.date
    if (-not $byDate.ContainsKey($d)) {
        $byDate[$d] = @{
            date = $d
            service_type = $r.service_type
            total_attendance = 0
            mvp = 0
            new_converts = 0
            count = 0
        }
    }
    $byDate[$d].total_attendance += ($r.total_attendance -as [int])
    $byDate[$d].mvp += ($r.mvp -as [int])
    $byDate[$d].new_converts += ($r.new_converts -as [int])
    $byDate[$d].count++
}

Write-Output "Aggregated Service Reports by Date (Last 15 dates):"
$sortedDates = $byDate.Keys | Sort-Object
$last15 = $sortedDates | Select-Object -Last 15
foreach ($d in $last15) {
    $item = $byDate[$d]
    Write-Output "$d ($($item.service_type)): Total Att=$($item.total_attendance), MVPs=$($item.mvp), New Converts=$($item.new_converts), Submissions=$($item.count)"
}
