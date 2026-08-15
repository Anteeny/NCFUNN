import urllib.request
import json

URL = 'https://cjbedftdexzcsydwayig.supabase.co'
KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg'

for table in ['mvp', 'mvps', 'members']:
    req = urllib.request.Request(
        f'{URL}/rest/v1/{table}?select=*&limit=5',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(f"Table '{table}' -> Rows: {len(data)}")
            if data:
                print(f"Sample row keys for '{table}':", list(data[0].keys()))
    except Exception as e:
        print(f"Table '{table}' -> Error:", e)
