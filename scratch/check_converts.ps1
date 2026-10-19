$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'
$headers = @{ 'apikey' = $key; 'Authorization' = "Bearer $key" }
$baseUrl = 'https://cjbedftdexzcsydwayig.supabase.co/rest/v1'

Write-Output '=== SERVICE REPORTS CONVERTS ==='
$sr = Invoke-RestMethod -Uri "$baseUrl/service_reports?select=date,service_type,new_converts" -Headers $headers
$srConverts = $sr | Where-Object { $_.new_converts -gt 0 }
Write-Output "Service reports with converts > 0: $($srConverts.Count)"
$srConverts | Format-Table

Write-Output '=== CELL REPORTS CONVERTS ==='
$cr = Invoke-RestMethod -Uri "$baseUrl/cell_reports?select=report_date,leader_name,new_converts" -Headers $headers
$crConverts = $cr | Where-Object { $_.new_converts -gt 0 }
Write-Output "Cell reports with converts > 0: $($crConverts.Count)"
$crConverts | Format-Table

Write-Output '=== G12 REPORTS SAMPLE ==='
$g12 = Invoke-RestMethod -Uri "$baseUrl/g12_reports?limit=1" -Headers $headers
$g12 | Get-Member -MemberType NoteProperty | Select-Object Name
