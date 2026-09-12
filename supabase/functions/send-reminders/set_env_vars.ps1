# PowerShell script to set Supabase Edge Function environment variables for send-reminders
# Run this script from the root of your Attendance Tracker project.
# Prerequisites:
#   - Supabase CLI installed (npm i -g supabase)
#   - Logged in (`supabase login`)
#   - Linked to your project (`supabase link --project-ref cjbedftdexzcsydwayig`)

$envVars = @{
    "WHAPI_API_KEY"             = "YOUR_WHAPI_API_TOKEN"            # Whapi.cloud API Token for admin@ncf channel
    "ADMIN_PHONE"               = "2348106939820"                   # Tony Ubagu (NCF Admin Phone)
    "NCF_PORTAL_URL"            = "https://reports.ncfunn.site"     # Base URL for attendance reporting portal
    "SUPABASE_URL"              = "https://cjbedftdexzcsydwayig.supabase.co"
    "SUPABASE_SERVICE_ROLE_KEY" = "YOUR_SERVICE_ROLE_KEY"           # Service Role Key for background queries
    # "MAKE_WEBHOOK_URL"        = "https://hook.eu2.make.com/..."   # Optional Make.com webhook URL
}

Write-Host "`n=== Setting Supabase Edge Function Secrets ===" -ForegroundColor Cyan

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if ($value.StartsWith("YOUR_")) {
        Write-Host "⚠️  Please replace the placeholder for $key before setting." -ForegroundColor Yellow
        continue
    }
    Write-Host "Setting $key..." -NoNewline
    supabase secrets set "${key}=${value}"
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ (error)" -ForegroundColor Red
    }
}

Write-Host "`nAll done! Deploy or redeploy the function to apply changes:"
Write-Host "   supabase functions deploy send-reminders" -ForegroundColor Cyan
Write-Host "`nTo trigger a test run:"
Write-Host "   curl -X POST https://cjbedftdexzcsydwayig.supabase.co/functions/v1/send-reminders?force=true&dryRun=true" -ForegroundColor Yellow
Write-Host "   curl -X POST https://cjbedftdexzcsydwayig.supabase.co/functions/v1/send-reminders?action=birthdays&dryRun=true`n" -ForegroundColor Yellow
