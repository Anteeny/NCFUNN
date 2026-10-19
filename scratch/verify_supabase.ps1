$url = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1/"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Prefer" = "count=exact"
}

$tables = @(
    "members",
    "mvps",
    "g12_leaders",
    "attendance",
    "service_attendance",
    "service_reports",
    "dept_reports",
    "g12_reports",
    "cell_reports",
    "cell_leaders",
    "department_leaders"
)

Write-Output "=== TABLE COUNTS AND SCHEMA SAMPLES ==="
foreach ($tbl in $tables) {
    try {
        $tableUrl = "$url$tbl`?select=*&limit=1"
        $resp = Invoke-WebRequest -Uri $tableUrl -Headers $headers -Method Get
        $count = $resp.Headers["Content-Range"]
        $data = $resp.Content | ConvertFrom-Json
        $cols = ""
        if ($data -and $data.Count -gt 0) {
            $cols = ($data[0].PSObject.Properties.Name) -join ', '
        }
        Write-Output "[$tbl] Count/Range: $count | Columns: $cols"
    } catch {
        Write-Output "[$tbl] Error: $($_.Exception.Message)"
    }
}

Write-Output "`n=== TESTING RPC FUNCTIONS ==="
$candidateRpcs = @("get_dashboard_stats", "check_in_member", "get_members_count", "execute_sql", "health_check")
foreach ($rpc in $candidateRpcs) {
    try {
        $rpcUrl = "$url" + "rpc/$rpc"
        $resp = Invoke-WebRequest -Uri $rpcUrl -Headers $headers -Method Post -Body "{}" -ContentType "application/json"
        Write-Output "RPC [$rpc]: Available! Result: $($resp.Content)"
    } catch {
        $msg = $_.Exception.Message
        if ($msg -match "404") {
            Write-Output "RPC [$rpc]: Not Found (404)"
        } else {
            Write-Output "RPC [$rpc]: Response - $msg"
        }
    }
}
