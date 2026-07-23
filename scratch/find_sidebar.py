with open('Website/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'sidebar' in l.lower():
        print(f'L{i+1}: {l.strip()[:150]}')
