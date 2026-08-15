# PowerShell script to set Supabase Edge Function environment variables
# Run this script from the root of your Attendance Tracker project.
# Prerequisites:
#   - Supabase CLI installed (npm i -g supabase)
#   - Logged in (`supabase login`)
#   - You are in the project directory containing supabase/config.toml

# Define your variables below. Replace the placeholder values with the real ones.
$envVars = @{
    "META_ACCESS_TOKEN"         = "YOUR_META_ACCESS_TOKEN"  # Paste token from Meta Dev Console
    "META_PHONE_NUMBER_ID"      = "1242999625564267"       # NCF UNN App Phone Number ID
    "META_TEMPLATE_NAME"        = "hello_world"            # Use 'hello_world' for dev testing, or 'ncf_report_reminder'
    "NCF_PORTAL_URL"            = "http://localhost:8000"
    "SUPABASE_URL"              = "https://cjbedftdexzcsydwayig.supabase.co"
    "SUPABASE_SERVICE_ROLE_KEY" = "YOUR_SERVICE_ROLE_KEY"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if ($value.StartsWith("YOUR_")) {
        Write-Host "⚠️  Please replace the placeholder for $key before running the script." -ForegroundColor Yellow
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

Write-Host "All done. You may need to redeploy the function to apply the new env vars:"
Write-Host "   supabase functions deploy send-reminders" -ForegroundColor Cyan
