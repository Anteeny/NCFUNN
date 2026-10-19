$baseUrl = "https://cjbedftdexzcsydwayig.supabase.co/rest/v1"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

# 1. Check members in a department (workers)
$respMembers = Invoke-WebRequest -Uri "$baseUrl/members?select=id,member_name,department,membership_level" -Headers $headers -Method Get
$members = $respMembers.Content | ConvertFrom-Json

$withDept = $members | Where-Object { $_.department -and $_.department.Trim() -ne '' }
Write-Output "Total members with department assigned (Workers): $($withDept.Count)"

$byLvl = @{}
foreach ($m in $members) {
    $lvl = if ($m.membership_level) { $m.membership_level.Trim() } else { 'Blank' }
    if (-not $byLvl.ContainsKey($lvl)) { $byLvl[$lvl] = 0 }
    $byLvl[$lvl]++
}
Write-Output "`nMembership levels in DB:"
$byLvl.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {
    Write-Output "  $($_.Key): $($_.Value)"
}

# 2. Check dept_reports latest dates and attendance
$respDeptReports = Invoke-WebRequest -Uri "$baseUrl/dept_reports?select=dept_name,status,report_date&order=report_date.desc&limit=100" -Headers $headers -Method Get
$deptReports = $respDeptReports.Content | ConvertFrom-Json

$latestDeptDates = $deptReports | Select-Object -ExpandProperty report_date -Unique | Select-Object -First 5
Write-Output "`nLatest Dept Report Dates: $($latestDeptDates -join ', ')"

# 3. Check souls won in the latest week vs all time
$respServices = Invoke-WebRequest -Uri "$baseUrl/service_reports?select=date,new_converts&order=date.desc" -Headers $headers -Method Get
$services = $respServices.Content | ConvertFrom-Json
$latestDate = $services[0].date
Write-Output "`nLatest Service Date: $latestDate"
$thisWeekDate = [DateTime]::Parse($latestDate).AddDays(-7).ToString('yyyy-MM-dd')
$thisWeekConverts = 0
foreach ($s in $services) {
    if ($s.date -ge $thisWeekDate) {
        $thisWeekConverts += ($s.new_converts -as [int])
    }
}
Write-Output "Souls won in last 7 days ($thisWeekDate to $latestDate): $thisWeekConverts"

# Check total souls won
$totalConverts = ($services | Measure-Object -Property new_converts -Sum).Sum
Write-Output "Total Souls won all time: $totalConverts"
