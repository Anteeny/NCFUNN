import urllib.request
import json

URL = 'https://cjbedftdexzcsydwayig.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'

# Fetch all reports
req = urllib.request.Request(
    f'{URL}/rest/v1/g12_reports?select=id,report_date,leader_name,member_name,status,service_type&order=id.desc',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

print(f"Total reports in DB: {len(data)}")

# Group by report_date
from collections import Counter, defaultdict
date_counts = Counter()
date_present = Counter()
date_absent = Counter()
date_leaders = defaultdict(set)

for r in data:
    d = r.get('report_date', 'Unknown')
    date_counts[d] += 1
    if r.get('status') == 'Present':
        date_present[d] += 1
    elif r.get('status') == 'Absent':
        date_absent[d] += 1
    if r.get('leader_name'):
        date_leaders[d].add(r['leader_name'])

print("\n--- Reports grouped by report_date ---")
for d in sorted(date_counts.keys(), reverse=True)[:15]:
    print(f"  {d}: {date_counts[d]} reports, {date_present[d]} Present, {date_absent[d]} Absent, {len(date_leaders[d])} leaders: {sorted(date_leaders[d])}")

# Now simulate getServiceDate logic (timezone-safe)
def get_service_date(report_date):
    if not report_date:
        return 'Unknown Date'
    parts = report_date.split('T')[0].split('-')
    if len(parts) == 3:
        from datetime import date
        y, m, d_val = int(parts[0]), int(parts[1]), int(parts[2])
        dt = date(y, m, d_val)
        dow = dt.weekday()  # 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
        
        from datetime import timedelta
        if dow == 6:  # Sunday
            pass
        elif dow == 0:  # Monday -> Sunday
            dt = dt - timedelta(days=1)
        elif dow == 5:  # Saturday -> Sunday
            dt = dt + timedelta(days=1)
        elif dow == 2:  # Wednesday
            pass
        elif dow == 3:  # Thursday -> Wednesday
            dt = dt - timedelta(days=1)
        elif dow == 1:  # Tuesday -> Wednesday
            dt = dt + timedelta(days=1)
        elif dow == 4:  # Friday -> just keep
            pass
        
        return dt.isoformat()
    return 'Unknown Date'

# Group by service date
svc_counts = Counter()
svc_present = Counter()
svc_leaders = defaultdict(set)

for r in data:
    sd = get_service_date(r.get('report_date'))
    svc_counts[sd] += 1
    if r.get('status') == 'Present':
        svc_present[sd] += 1
    if r.get('leader_name'):
        svc_leaders[sd].add(r['leader_name'])

print("\n--- Reports grouped by SERVICE DATE ---")
for d in sorted(svc_counts.keys(), reverse=True)[:10]:
    print(f"  {d}: {svc_counts[d]} reports, {svc_present[d]} Present, {len(svc_leaders[d])} leaders")

print(f"\nLatest service date: {sorted(svc_counts.keys(), reverse=True)[0]}")
latest = sorted(svc_counts.keys(), reverse=True)[0]
print(f"  Present: {svc_present[latest]}, Leaders: {len(svc_leaders[latest])}, Total reports: {svc_counts[latest]}")
print(f"  Leader names: {sorted(svc_leaders[latest])}")
