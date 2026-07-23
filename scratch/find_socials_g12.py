with open('Ncfreport/G12report.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    low = l.lower()
    if any(x in low for x in ['instagram.com', 'youtube.com/@', 'whatsapp.com/channel', 'social-btn', 'social-follow', 'social-card']):
        print(f'L{i+1}: {l.strip()[:150]}')
