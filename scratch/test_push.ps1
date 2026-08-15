$apiKey = $env:ONESIGNAL_API_KEY
if (-not $apiKey) { $apiKey = "YOUR_ONESIGNAL_API_KEY" }

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Basic $apiKey"
}

$body = @{
    app_id = "031e7145-9dec-47e3-9020-9ccd9658bdaa"
    include_external_user_ids = @("tubagu6@gmail.com")
    headings = @{ en = "NCF Report Reminder" }
    contents = @{ en = "Hi! Your NCF folder report for today's service is still pending. Please submit it now." }
    url = "http://localhost:55623"
} | ConvertTo-Json -Depth 3

$response = Invoke-RestMethod -Uri "https://onesignal.com/api/v1/notifications" -Method Post -Headers $headers -Body $body
$response | ConvertTo-Json
