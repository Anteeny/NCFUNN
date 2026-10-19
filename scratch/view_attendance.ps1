$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$resp = Invoke-RestMethod -Uri "$baseUrl/service_attendance?order=checked_in_at.desc" -Headers $headers -Method Get
$resp | Format-Table id, member_id, member_name, service_date, service_type, checked_in_at
