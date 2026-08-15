import re

with open(r'c:\Users\USER\Desktop\ATTENDANCE TRACKER\Website\index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'dept' in line.lower() and ('report' in line.lower() or 'table' in line.lower() or 'page' in line.lower()):
        print(f"Line {i+1}: {line.strip()[:120]}")
