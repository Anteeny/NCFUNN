# SQL Queries for Supabase - Leader Cleanup & Validation

These queries help identify and validate leader data in your `members` table. Run them in your Supabase SQL Editor at: https://app.supabase.com/project/cjbedftdexzcsydwayig/sql

--- 

## Query 1: Identify All Unique Leader Names (Current State)
Shows all unique leader names currently in the database with member count for each.

```sql
SELECT 
  g12_leader,
  COUNT(*) as member_count,
  CASE 
    WHEN g12_leader IS NULL THEN '⚠️ NULL/UNASSIGNED'
    WHEN g12_leader = '' THEN '⚠️ EMPTY STRING'
    ELSE '✓ HAS VALUE'
  END as status
FROM members
WHERE g12_leader IS NOT NULL
GROUP BY g12_leader
ORDER BY member_count DESC;
```

---

## Query 2: Find Exact Duplicate Names
Shows leaders with the exact same name appearing multiple times (accounting for case differences).

```sql
SELECT 
  LOWER(g12_leader) as leader_name_lower,
  COUNT(DISTINCT g12_leader) as distinct_spelling_count,
  COUNT(*) as total_members,
  STRING_AGG(DISTINCT g12_leader, ', ') as all_spellings
FROM members
WHERE g12_leader IS NOT NULL AND g12_leader != ''
GROUP BY LOWER(g12_leader)
HAVING COUNT(DISTINCT g12_leader) > 1
ORDER BY total_members DESC;
```

---

## Query 3: Find Leaders with Title Prefixes
Identifies leaders whose names start with common titles (Pastor, Pa, Pst, etc.).

```sql
SELECT 
  g12_leader,
  COUNT(*) as member_count,
  CASE 
    WHEN g12_leader ILIKE 'pastor %' THEN 'Pastor'
    WHEN g12_leader ILIKE 'pa %' THEN 'Pa'
    WHEN g12_leader ILIKE 'pst %' THEN 'Pst'
    WHEN g12_leader ILIKE 'mr %' THEN 'Mr'
    WHEN g12_leader ILIKE 'mrs %' THEN 'Mrs'
    WHEN g12_leader ILIKE 'dr %' THEN 'Dr'
    WHEN g12_leader ILIKE 'prof %' THEN 'Prof'
    WHEN g12_leader ILIKE 'brother %' THEN 'Brother'
    WHEN g12_leader ILIKE 'sister %' THEN 'Sister'
    WHEN g12_leader ILIKE 'mama %' THEN 'Mama'
    WHEN g12_leader ILIKE 'sis %' THEN 'Sis'
    ELSE 'Other'
  END as title_prefix
FROM members
WHERE g12_leader IS NOT NULL AND g12_leader != ''
  AND (
    g12_leader ILIKE 'pastor %'
    OR g12_leader ILIKE 'pa %'
    OR g12_leader ILIKE 'pst %'
    OR g12_leader ILIKE 'mr %'
    OR g12_leader ILIKE 'mrs %'
    OR g12_leader ILIKE 'dr %'
    OR g12_leader ILIKE 'prof %'
    OR g12_leader ILIKE 'brother %'
    OR g12_leader ILIKE 'sister %'
    OR g12_leader ILIKE 'mama %'
    OR g12_leader ILIKE 'sis %'
  )
GROUP BY g12_leader
ORDER BY member_count DESC;
```

---

## Query 4: Compare Against Canonical Names
Shows all unique leader names and flags which ones match the canonical list.

```sql
SELECT 
  g12_leader,
  COUNT(*) as member_count,
  CASE 
    WHEN g12_leader IN (
      'Ukay', 'Ebuka', 'Ndidi', 'Kene', 'Janefrancis', 'Precious Ubani',
      'Udochukwu', 'Nkechikwu', 'Favour', 'Chioma', 'Okezie', 'Tunde',
      'Emmanuel', 'Blessing', 'Victor', 'Mkechi', 'Success', 'Nneka',
      'Chidi', 'Tochukwu', 'Amarachi', 'Ifeanyi', 'Regina', 'Obinna',
      'Adaugo', 'Chidinma', 'Amara', 'Chukwuma'
    ) THEN '✓ CANONICAL'
    ELSE '⚠️ NEEDS REVIEW'
  END as verification
FROM members
WHERE g12_leader IS NOT NULL AND g12_leader != ''
GROUP BY g12_leader
ORDER BY 
  CASE 
    WHEN g12_leader IN (
      'Ukay', 'Ebuka', 'Ndidi', 'Kene', 'Janefrancis', 'Precious Ubani',
      'Udochukwu', 'Nkechikwu', 'Favour', 'Chioma', 'Okezie', 'Tunde',
      'Emmanuel', 'Blessing', 'Victor', 'Mkechi', 'Success', 'Nneka',
      'Chidi', 'Tochukwu', 'Amarachi', 'Ifeanyi', 'Regina', 'Obinna',
      'Adaugo', 'Chidinma', 'Amara', 'Chukwuma'
    ) THEN 0 ELSE 1
  END,
  member_count DESC;
```

---

## Query 5: Count Records per Leader (Before/After Cleanup Check)
Use this before and after running `cleanupLeaderNames()` to verify the cleanup worked.

```sql
SELECT 
  g12_leader as leader_name,
  COUNT(*) as member_count,
  COUNT(DISTINCT member_name) as unique_members
FROM members
WHERE g12_leader IS NOT NULL AND g12_leader != ''
  AND leader_type = 'G12'
GROUP BY g12_leader
ORDER BY member_count DESC;
```

---

## Query 6: Verify All 28 Canonical Leaders Have Members
Run this after cleanup to confirm all canonical leaders are assigned.

```sql
SELECT 
  canon.name,
  COALESCE(COUNT(m.id), 0) as member_count
FROM (
  VALUES 
    ('Ukay'), ('Ebuka'), ('Ndidi'), ('Kene'), ('Janefrancis'), ('Precious Ubani'),
    ('Udochukwu'), ('Nkechikwu'), ('Favour'), ('Chioma'), ('Okezie'), ('Tunde'),
    ('Emmanuel'), ('Blessing'), ('Victor'), ('Mkechi'), ('Success'), ('Nneka'),
    ('Chidi'), ('Tochukwu'), ('Amarachi'), ('Ifeanyi'), ('Regina'), ('Obinna'),
    ('Adaugo'), ('Chidinma'), ('Amara'), ('Chukwuma')
) AS canon(name)
LEFT JOIN members m ON m.g12_leader = canon.name
GROUP BY canon.name
ORDER BY member_count DESC;
```

---

## Query 7: Find Members Without a G12 Leader Assigned
```sql
SELECT 
  id,
  member_name,
  member_phone,
  leader_type,
  COUNT(*) OVER() as total_unassigned
FROM members
WHERE g12_leader IS NULL OR g12_leader = ''
ORDER BY member_name;
```

---

## Query 8: Bulk Update Example (if needed for specific cases)
This is a template to manually update specific leader names:

```sql
UPDATE members
SET g12_leader = 'CANONICAL_NAME'
WHERE LOWER(g12_leader) = 'wrong_spelling'
  AND leader_type = 'G12';
```

**Example:** Convert all "pastor mkechi" variants to "Mkechi":
```sql
UPDATE members
SET g12_leader = 'Mkechi'
WHERE LOWER(g12_leader) LIKE '%mkechi%'
  AND g12_leader != 'Mkechi';
```

---

## How to Use These Queries

1. **Before Cleanup:**
   - Run Query 1 to see all current names
   - Run Query 2 to find exact duplicates
   - Run Query 3 to find title prefixes
   
2. **Run Cleanup in UI:**
   - Go to G12report.html Admin section
   - Click "🔄 Cleanup Leader Names" button
   - Wait for completion and check console logs

3. **After Cleanup:**
   - Run Query 5 to compare member counts
   - Run Query 6 to verify all 28 leaders present
   - Run Query 7 to find unassigned members

4. **If Issues Found:**
   - Use Query 8 templates to make manual corrections
   - Document the changes in this file

---

## 28 Canonical Leaders Reference

```
1. Ukay
2. Ebuka
3. Ndidi
4. Kene
5. Janefrancis
6. Precious Ubani
7. Udochukwu
8. Nkechikwu
9. Favour
10. Chioma
11. Okezie
12. Tunde
13. Emmanuel
14. Blessing
15. Victor
16. Mkechi
17. Success
18. Nneka
19. Chidi
20. Tochukwu
21. Amarachi
22. Ifeanyi
23. Regina
24. Obinna
25. Adaugo
26. Chidinma
27. Amara
28. Chukwuma
```
