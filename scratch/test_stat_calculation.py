import urllib.request
import json
from datetime import datetime, date, timedelta

URL = 'https://cjbedftdexzcsydwayig.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'

def get_service_date(report_date):
    if not report_date:
        return 'Unknown Date'
    try:
        parts = str(report_date).split('T')[0].split('-')
        if len(parts) == 3:
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            dt = date(y, m, d)
            # Python weekday: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
            # JS getDay: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
            # In JS dayOfWeek:
            # 0 (Sun): target
            # 1 (Mon): target - 1
            # 6 (Sat): target + 1
            # 3 (Wed): target
            # 4 (Thu): target - 1
            # 2 (Tue): target + 1
            py_dow = dt.weekday()
            target = dt
            if py_dow == 6: # Sun
                pass
            elif py_dow == 0: # Mon -> Sun
                target = dt - timedelta(days=1)
            elif py_dow == 5: # Sat -> Sun
                target = dt + timedelta(days=1)
            elif py_dow == 2: # Wed -> Wed
                pass
            elif py_dow == 3: # Thu -> Wed
                target = dt - timedelta(days=1)
            elif py_dow == 1: # Tue -> Wed
                target = dt + timedelta(days=1)
            return target.strftime('%Y-%m-%d')
    except Exception as e:
        return 'Unknown Date'
    return 'Unknown Date'

req = urllib.request.Request(
    f'{URL}/rest/v1/g12_reports?select=*&order=id.desc&limit=100',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)

with urllib.request.urlopen(req) as resp:
    reports = json.loads(resp.read().decode())

print(f"Total reports loaded: {len(reports)}")

service_dates = set()
for r in reports:
    sd = get_service_date(r.get('report_date') or r.get('meeting_date'))
    service_dates.add(sd)
    r['_service_date'] = sd

sorted_service_dates = sorted(list(service_dates), reverse=True)
print(f"Sorted Service Dates: {sorted_service_dates}")

target = sorted_service_dates[0]
print(f"\nTarget Service Date: {target}")

matching_reports = [r for r in reports if r['_service_date'] == target]
print(f"Total matching reports for target {target}: {len(matching_reports)}")

presents = [r for r in matching_reports if r.get('status') == 'Present']
absents = [r for r in matching_reports if r.get('status') == 'Absent']
leaders = set([r.get('leader_name') for r in matching_reports if r.get('leader_name')])

print(f"Presents count: {len(presents)}")
print(f"Absents count: {len(absents)}")
print(f"Unique leaders count: {len(leaders)}")
print(f"Leaders list: {sorted(list(leaders))}")

print("\nSample matching reports:")
for r in matching_reports[:10]:
    print(f"  ID: {r.get('id')} | Date: {r.get('report_date')} | ServiceDate: {r.get('_service_date')} | Leader: {r.get('leader_name')} | Status: '{r.get('status')}'")
