$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$resp = Invoke-RestMethod -Uri "$baseUrl/service_attendance?member_id=eq.286&service_date=eq.2026-10-18" -Headers $headers -Method Delete
Write-Output "Cleaned up test row for member 286 on 2026-10-18"
