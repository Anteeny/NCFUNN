$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Prefer" = "resolution=merge-duplicates"
}

Write-Output "=== TRY UPSERTING VIA REST ==="
$body = @{
    member_id = "286"
    member_name = "Meniru Chioma"
    service_date = "2026-10-18"
    service_type = "Sunday Service"
    zone = "Hilltop"
    department = "Administration"
    checked_in_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

try {
    # PostgREST on_conflict parameter is passed as query parameter ?on_conflict=member_id,service_date,service_type
    $upsertResp = Invoke-RestMethod -Uri "$baseUrl/service_attendance?on_conflict=member_id,service_date,service_type" -Headers $headers -Method Post -Body $body -ContentType "application/json"
    Write-Output "Upsert success!"
    Write-Output $upsertResp
} catch {
    Write-Output "Upsert failed:"
    Write-Output $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $reader.ReadToEnd()
}
