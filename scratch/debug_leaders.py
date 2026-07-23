import urllib.request
import json

URL = 'https://cjbedftdexzcsydwayig.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'

req = urllib.request.Request(
    f'{URL}/rest/v1/members?select=g12_leader,leader_type,g12_phone,member_name',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

print(f"Total members: {len(data)}")

# Simulate the dashboard's expected leader calculation
expectedG12 = set()
expectedDH = set()

for m in data:
    g12_leader = m.get('g12_leader')
    if g12_leader:
        canonical = g12_leader.strip()
        if canonical and canonical != 'Unassigned':
            leader_type = m.get('leader_type') or 'G12'
            if leader_type == 'G12':
                expectedG12.add(canonical)
            elif leader_type == 'DH':
                expectedDH.add(canonical)

print(f"\nExpected G12 leaders (from member rows with leader_type='G12'): {len(expectedG12)}")
for l in sorted(expectedG12):
    print(f"  - {l}")

print(f"\nExpected DH leaders (from member rows with leader_type='DH'): {len(expectedDH)}")
for l in sorted(expectedDH):
    print(f"  - {l}")

print(f"\nTotal expected leaders (G12 + DH): {len(expectedG12) + len(expectedDH)}")

# Now check: which members have leader_type set?
leaders_with_type = [(m.get('member_name'), m.get('g12_leader'), m.get('leader_type')) for m in data if m.get('leader_type')]
print(f"\nMembers with leader_type set: {len(leaders_with_type)}")
for name, g12l, lt in sorted(leaders_with_type, key=lambda x: x[0] or ''):
    print(f"  {name} -> g12_leader={g12l}, leader_type={lt}")
