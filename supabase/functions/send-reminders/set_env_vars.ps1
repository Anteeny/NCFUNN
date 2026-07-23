# PowerShell script to set Supabase Edge Function environment variables
# Run this script from the root of your Attendance Tracker project.
# Prerequisites:
#   - Supabase CLI installed (npm i -g supabase)
#   - Logged in (`supabase login`)
#   - You are in the project directory containing supabase/config.toml

# Define your variables below. Replace the placeholder values with the real ones.
$envVars = @{
    "META_ACCESS_TOKEN"      = "YOUR_META_ACCESS_TOKEN"
    "META_PHONE_NUMBER_ID"   = "YOUR_META_PHONE_NUMBER_ID"
    "META_TEMPLATE_NAME"     = "ncf_report_reminder"  # optional – change if you use another template
    "NCF_PORTAL_URL"         = "https://your-portal.example.com"  # optional
    "SUPABASE_URL"           = "https://YOUR_PROJECT.supabase.co"
    "SUPABASE_SERVICE_ROLE_KEY" = "YOUR_SERVICE_ROLE_KEY"
    # "SUPABASE_ANON_KEY"    = "YOUR_ANON_KEY"   # use only if you prefer anon access
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if ($value -eq "YOUR_*") {
        Write-Host "⚠️  Please replace the placeholder for $key before running the script." -ForegroundColor Yellow
        continue
    }
    Write-Host "Setting $key..." -NoNewline
    supabase functions env set $key $value
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ (error)" -ForegroundColor Red
    }
}

Write-Host "All done. You may need to redeploy the function to apply the new env vars:"
Write-Host "   supabase functions deploy send-reminders" -ForegroundColor Cyan
