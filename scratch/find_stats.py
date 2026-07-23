with open('Website/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    low = l.lower()
    if any(x in low for x in ['present-count', 'absent-count', 'dh-count', 'dh-submitted', 'live-present', 'live-absent', 'report-stat', 'stat-present', 'stat-absent', 'stat-submitted', 'folder-count', 'submitted-count', 'total-present', 'total-absent', 'loaddashlive', 'renderlive', 'loadlive', 'live-stats', 'live_stats', 'g12-stat', 'submissionstat', 'servicestats']):
        print(f'L{i+1}: {l.strip()[:150]}')
