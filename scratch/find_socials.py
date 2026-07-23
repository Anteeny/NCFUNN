with open('Website/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    low = l.lower()
    if any(x in low for x in ['mobile-social', 'social-card', 'instagram.com', 'youtube.com/@', 'whatsapp.com/channel', 'social-btn', 'social-follow']):
        print(f'L{i+1}: {l.strip()[:150]}')
