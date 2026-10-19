$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'
$headers = @{ 'apikey' = $key; 'Authorization' = "Bearer $key" }
$baseUrl = 'https://cjbedftdexzcsydwayig.supabase.co/rest/v1'

$sr = Invoke-RestMethod -Uri "$baseUrl/service_reports?select=id,date,service_type,mvp&order=date.desc" -Headers $headers
Write-Output "Total service reports: $($sr.Count)"

Write-Output "=== SERVICE REPORTS WITH MVP > 0 ==="
$withMvp = $sr | Where-Object { $_.mvp -gt 0 }
$withMvp | Format-Table

Write-Output "=== GROUPED BY MONTH (YYYY-MM) ==="
$monthly = $sr | Group-Object { $_.date.Substring(0, 7) } | ForEach-Object {
    $sum = ($_.Group | Measure-Object -Property mvp -Sum).Sum
    [PSCustomObject]@{
        Month = $_.Name
        ReportsCount = $_.Count
        TotalMvp = $sum
    }
}
$monthly | Format-Table
