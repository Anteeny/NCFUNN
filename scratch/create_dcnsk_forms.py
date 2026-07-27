import os, re

files = ['index.html', 'G12report.html', 'Department.html', 'connect.html', 'mvp.html', 'servicereport.html']

for fname in files:
    src_path = os.path.join('Ncfreport', fname)
    dst_path = os.path.join('DCNSK/Ncfreport', fname)

    if not os.path.exists(src_path):
        continue

    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rebrand
    content = content.replace('New Covenant Family', 'Dominion City Nsukka')
    content = content.replace('NCF · UNN', 'DC NSK · Nsukka')
    content = content.replace('NCF UNN', 'DC NSK')
    content = content.replace('NCF Report', 'DC NSK Report')
    content = content.replace('ncfreport', 'dcnskreport')
    content = content.replace('Follow NCF UNN', 'Follow DC NSK')
    content = content.replace('ncfunn_', 'dcnsk_')

    # Update page titles
    content = content.replace('NCF', 'DC NSK')

    # Inject campus='DC_NSK' filter into selects
    content = re.sub(
        r"\.from\('members'\)\.select\(([^)]+)\)",
        r".from('members').select(\1).eq('campus', 'DC_NSK')",
        content
    )
    content = re.sub(
        r"\.from\('g12_reports'\)\.select\(([^)]+)\)",
        r".from('g12_reports').select(\1).eq('campus', 'DC_NSK')",
        content
    )
    content = re.sub(
        r"\.from\('cell_reports'\)\.select\(([^)]+)\)",
        r".from('cell_reports').select(\1).eq('campus', 'DC_NSK')",
        content
    )
    content = re.sub(
        r"\.from\('dept_reports'\)\.select\(([^)]+)\)",
        r".from('dept_reports').select(\1).eq('campus', 'DC_NSK')",
        content
    )
    content = re.sub(
        r"\.from\('mvps'\)\.select\(([^)]+)\)",
        r".from('mvps').select(\1).eq('campus', 'DC_NSK')",
        content
    )

    # Ensure inserts include campus: 'DC_NSK'
    # Insert patterns into g12_reports, cell_reports, dept_reports, mvps
    content = content.replace("leader_name,", "leader_name, campus: 'DC_NSK',")
    content = content.replace("leader_name :", "campus: 'DC_NSK', leader_name :")
    content = content.replace("service_type,", "campus: 'DC_NSK', service_type,")

    # Clear hardcoded LEADER_DICTIONARY in G12report.html so it starts 100% blank
    if fname == 'G12report.html':
        content = re.sub(
            r"const LEADER_DICTIONARY = \[[\s\S]*?\n  \];",
            "const LEADER_DICTIONARY = [];",
            content
        )

    with open(dst_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Created {dst_path} successfully!")
