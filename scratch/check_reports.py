import urllib.request
import json

URL = 'https://cjbedftdexzcsydwayig.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'

req = urllib.request.Request(
    f'{URL}/rest/v1/g12_reports?select=*&order=id.desc&limit=40',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
)

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print(f"Total reports fetched: {len(data)}\n")
    for r in data:
        print(f"ID: {r.get('id')} | Leader: {r.get('leader_name')} | Member: {r.get('member_name')} | Status: {r.get('status')} | Date: {r.get('report_date')} | Created: {r.get('created_at')}")
