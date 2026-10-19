$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'
$headers = @{ 'apikey' = $key; 'Authorization' = "Bearer $key" }
$baseUrl = 'https://cjbedftdexzcsydwayig.supabase.co/rest/v1'

Write-Output '=== MEMBERSHIP LEVEL COUNTS IN MEMBERS ==='
$members = Invoke-RestMethod -Uri "$baseUrl/members?select=id,membership_level,department,joined_date" -Headers $headers
$grouped = $members | Group-Object -Property membership_level
$grouped | Select-Object Name, Count | Format-Table

Write-Output "Total Members in Table: $($members.Count)"
$withDept = $members | Where-Object { $_.department -and $_.department.Trim() -ne '' }
Write-Output "Members with Department (Workers): $($withDept.Count)"

Write-Output '=== SERVICE ATTENDANCE TABLE (Check-ins) ==='
$sa = Invoke-RestMethod -Uri "$baseUrl/service_attendance?select=id,member_id,service_date,service_type&limit=10" -Headers $headers
$sa | Format-Table
