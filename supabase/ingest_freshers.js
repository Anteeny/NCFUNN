const SUPABASE_URL = 'https://cjbedftdexzcsydwayig.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmVkZnRkZXh6Y3N5ZHdheWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTUwMjgsImV4cCI6MjA5MzYzMTAyOH0.xsvtG5NmI_9TDZQ5-MhcjtX4UIIAiH2kyOlpIPDkCdg';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json'
};

function cleanPhone(p) {
  if (!p) return '';
  let digits = String(p).replace(/\D/g, '');
  if (digits.startsWith('234')) digits = '0' + digits.slice(3);
  return digits;
}

function cleanName(n) {
  return (n || '').trim().toLowerCase();
}

function resolveZone(loc) {
  if (!loc) return 'HQ';
  const l = loc.toLowerCase();
  if (l.includes('franco') || l.includes('presidential')) return 'Franco';
  if (l.includes('hilltop') || l.includes('alvan') || l.includes('behind flat') || l.includes('ofulonu')) return 'Hilltop';
  if (l.includes('odim')) return 'Odim';
  if (l.includes('odenigwe') || l.includes('ait')) return 'Odenigwe';
  if (l.includes('jsq')) return 'JSQ';
  if (l.includes('greenhouse') || l.includes('green house')) return 'Greenhouse';
  return 'HQ';
}

async function run() {
  console.log('Fetching checked-in picnic registrations...');
  const [satRes, sunRes, memRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/picnic_registrations?checked_in_saturday=eq.true&select=*`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/picnic_registrations?checked_in_sunday=eq.true&select=*`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/members?select=id,member_name,member_phone,membership_level`, { headers })
  ]);

  const satData = await satRes.json();
  const sunData = await sunRes.json();
  const existingMembers = await memRes.json();

  const allChecked = new Map();
  (satData || []).forEach(r => allChecked.set(r.id, r));
  (sunData || []).forEach(r => allChecked.set(r.id, r));

  console.log(`Unique checked-in attendees found: ${allChecked.size}`);
  console.log(`Existing members in database: ${existingMembers.length}`);

  const existingPhones = new Set();
  const existingNames = new Set();
  existingMembers.forEach(m => {
    if (m.member_phone) existingPhones.add(cleanPhone(m.member_phone));
    if (m.member_name) existingNames.add(cleanName(m.member_name));
  });

  const toInsert = [];
  let alreadyPresentCount = 0;

  for (const attendee of allChecked.values()) {
    const rawPhone = attendee.phone_number || '';
    const cleanedP = cleanPhone(rawPhone);
    const cleanedN = cleanName(attendee.full_name);

    if ((cleanedP && existingPhones.has(cleanedP)) || (cleanedN && existingNames.has(cleanedN))) {
      alreadyPresentCount++;
      continue;
    }

    const zone = resolveZone(attendee.location);
    toInsert.push({
      member_name: attendee.full_name ? attendee.full_name.trim() : 'Unknown Attendee',
      member_phone: cleanedP || rawPhone,
      course_of_study: attendee.department || '',
      level: attendee.level_of_study || '100 Level',
      School_Address: attendee.location || '',
      school_address: attendee.location || '',
      membership_level: 'MVP',
      zone: zone,
      joined_date: new Date().toISOString().split('T')[0]
    });

    if (cleanedP) existingPhones.add(cleanedP);
    if (cleanedN) existingNames.add(cleanedN);
  }

  console.log(`Already present in members: ${alreadyPresentCount}`);
  console.log(`Ready to insert as MVPs: ${toInsert.length}`);

  if (toInsert.length === 0) {
    console.log('No new members to insert. All attendees are already registered!');
    return;
  }

  // Insert in batches of 25
  const batchSize = 25;
  let totalInserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/members`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(batch)
    });

    if (res.ok) {
      const inserted = await res.json();
      totalInserted += inserted.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Inserted ${inserted.length} members (Total: ${totalInserted})`);
    } else {
      const errText = await res.text();
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, errText);
    }
  }

  console.log(`Successfully ingested ${totalInserted} new Freshers' Xperience attendees as MVPs!`);
}

run().catch(console.error);
