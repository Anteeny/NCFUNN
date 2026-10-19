$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'
$headers = @{ 'apikey' = $key; 'Authorization' = "Bearer $key" }
$baseUrl = 'https://cjbedftdexzcsydwayig.supabase.co/rest/v1'

Write-Output '=== SERVICE REPORTS (Recent 10) ==='
$sr = Invoke-RestMethod -Uri "$baseUrl/service_reports?select=id,date,service_type,total_attendance,new_converts,mvp,male,female,children&order=date.desc&limit=10" -Headers $headers
$sr | Format-Table id,date,service_type,total_attendance,new_converts,mvp,male,female,children

Write-Output '=== CELL REPORTS (Recent 5) ==='
$cr = Invoke-RestMethod -Uri "$baseUrl/cell_reports?select=id,report_date,leader_name,attendance,new_converts&order=report_date.desc&limit=5" -Headers $headers
$cr | Format-Table id,report_date,leader_name,attendance,new_converts
