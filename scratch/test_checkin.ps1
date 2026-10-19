$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

Write-Output "=== SERVICE_ATTENDANCE EXISTING ROWS ==="
$resp = Invoke-RestMethod -Uri "$baseUrl/service_attendance?limit=5" -Headers $headers -Method Get
$resp | Format-Table

Write-Output "`n=== TRY INSERTING A TEST ROW ==="
$body = @{
    member_id = "286"
    member_name = "Meniru Chioma"
    service_date = "2026-10-18"
    service_type = "Sunday Service"
    zone = "Hilltop"
    department = "Administration"
} | ConvertTo-Json

try {
    $insertResp = Invoke-RestMethod -Uri "$baseUrl/service_attendance" -Headers $headers -Method Post -Body $body -ContentType "application/json"
    Write-Output "Insert success!"
    Write-Output $insertResp
} catch {
    Write-Output "Insert failed:"
    Write-Output $_.Exception.Response.StatusCode
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Output $reader.ReadToEnd()
}
