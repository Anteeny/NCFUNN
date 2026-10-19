$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/members?select=id,member_name,gender&limit=10" -Headers $headers -Method Get
    Write-Output "Gender column exists!"
    $resp | Format-Table
} catch {
    Write-Output "Gender select error:"
    Write-Output $_.Exception.Message
}
