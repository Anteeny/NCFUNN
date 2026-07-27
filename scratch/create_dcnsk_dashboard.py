import re

with open('Website/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rebrand titles and text
content = content.replace('New Covenant Family', 'Dominion City Nsukka')
content = content.replace('NCF · UNN', 'DC NSK · Nsukka')
content = content.replace('NCF UNN', 'DC NSK')
content = content.replace('Follow NCF UNN', 'Follow DC NSK')
content = content.replace('ncfunn_', 'dcnsk_')

# 2. Update page titles
content = content.replace('<title>NCF UNN Admin Portal</title>', '<title>DC NSK — Dominion City Nsukka Portal</title>')

# 3. Inject campus filter into queries:
# Replace member selects to filter by campus='DC_NSK' or create campus-scoped fetcher
# Replace insert member to include campus: 'DC_NSK'

# Modify supabase queries for members
content = re.sub(
    r"\.from\('members'\)\.select\(([^)]+)\)",
    r".from('members').select(\1).eq('campus', 'DC_NSK')",
    content
)

# Modify supabase queries for g12_reports
content = re.sub(
    r"\.from\('g12_reports'\)\.select\(([^)]+)\)",
    r".from('g12_reports').select(\1).eq('campus', 'DC_NSK')",
    content
)

# Modify supabase queries for cell_reports
content = re.sub(
    r"\.from\('cell_reports'\)\.select\(([^)]+)\)",
    r".from('cell_reports').select(\1).eq('campus', 'DC_NSK')",
    content
)

# Modify supabase queries for dept_reports / department_reports
content = re.sub(
    r"\.from\('dept_reports'\)\.select\(([^)]+)\)",
    r".from('dept_reports').select(\1).eq('campus', 'DC_NSK')",
    content
)

# Modify supabase queries for mvps
content = re.sub(
    r"\.from\('mvps'\)\.select\(([^)]+)\)",
    r".from('mvps').select(\1).eq('campus', 'DC_NSK')",
    content
)

# Ensure member inserts include campus: 'DC_NSK'
content = content.replace("leader_type: leaderType", "leader_type: leaderType, campus: 'DC_NSK'")

# Write to DCNSK/Website/index.html
with open('DCNSK/Website/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Created DCNSK/Website/index.html successfully!")
