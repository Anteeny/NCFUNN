/**
 * Shared Leader Dictionary & Normalizer for NCF Report Portal
 * Maps all variations, aliases, and typos to canonical leader names.
 */

const LEADER_DICTIONARY = [
  { name: "Ukamaka Augustine", keywords: ["ukamaka", "ukay", "p.ukay", "pa ukay", "pst ukay", "pastor ukay", "ma ukay", "augusta", "augustine", "brother ukamaka", "sister ukamaka"] },
  { name: "Royal Eroh", keywords: ["royal", "eroh", "brother royal", "pastor royal", "pa royal", "pst royal", "mr royal", "mr eroh", "pastor eroh"] },
  { name: "Promise Okeke", keywords: ["promise", "okeke", "promise okeke", "pa promise", "pst promise", "pastor promise", "pastor promise okeke", "brother promise"] },
  { name: "Francis Ogbozor", keywords: ["francis", "ogbozor", "brother francis", "pastor francis", "pa francis", "pst francis", "fr francis", "frank", "frankline", "fancis"] },
  { name: "Ebuka Aziekwe", keywords: ["ebuka", "aziekwe", "pa ebuka", "pst ebuka", "pastor ebuka", "brother ebuka", "aziek"] },
  { name: "Winner Richards", keywords: ["winner", "richards", "pa winner", "pst winner", "pastor winner", "brother winner", "mr winner", "mr richards"] },
  { name: "Kene Offiah", keywords: ["kene", "offiah", "pa kene", "pst kene", "pastor kene", "brother kene", "kenny", "kenneth"] },
  { name: "Noble Onwuka", keywords: ["noble", "onwuka", "pa noble", "pst noble", "pastor noble", "brother noble", "mr noble", "mr onwuka"] },
  { name: "Mmesoma Ozor", keywords: ["mmesoma", "ozor", "mmesoma ozor", "pa mmesoma", "pst mmesoma", "pastor mmesoma", "brother mmesoma", "mama mmesoma", "sis mmesoma"] },
  { name: "Ogbamba Onyinye", keywords: ["ogbamba", "onyinye", "onyinye ogbambwa", "pa onyinye", "pst onyinye", "pastor onyinye", "brother onyinye", "sister onyinye", "mama onyinye"] },
  { name: "Nkechi Ohazulike", keywords: ["nkechi", "ohazulike", "pa nkechi", "pst nkechi", "pastor nkechi", "pastor mkechi", "mkechi", "sister nkechi", "mama nkechi", "nkechikwu"] },
  { name: "Precious Ubani", keywords: ["precious", "ubani", "precious ubani", "pastor precious", "pa precious", "pst precious", "pastor precious ubani", "brother precious", "sister precious", "mama precious", "priceless"] },
  { name: "Nuel Azubuike", keywords: ["nuel", "azubuike", "pa nuel", "pst nuel", "pastor nuel", "brother nuel", "muel", "mr nuel", "nuel azubuike"] },
  { name: "Emmanuella Okonkwo", keywords: ["emmanuella", "okonkwo", "pa emmanuella", "pst emmanuella", "pastor emmanuella", "sister emmanuella", "mama emmanuella", "sis emma", "emma"] },
  { name: "Kosi Mbamalu", keywords: ["kosi", "mbamalu", "pa kosi", "pst kosi", "pastor kosi", "brother kosi", "mr kosi", "mr mbamalu"] },
  { name: "Faithfulness Onuh", keywords: ["faithfulness", "onuh", "faith", "faithful", "pa faithfulness", "pst faithfulness", "pastor faithfulness", "brother faithfulness", "mr onuh"] },
  { name: "Vivian Nwolisa", keywords: ["vivian", "nwolisa", "vivian nwolisa", "pa vivian", "pst vivian", "pastor vivian", "sister vivian", "mama vivian", "viv", "vivienne"] },
  { name: "Odinaka Onugha", keywords: ["odinaka", "onugha", "pa odinaka", "pst odinaka", "pastor odinaka", "brother odinaka", "mr odinaka", "dinaka", "mr onugha"] },
  { name: "Udochukwu Aneke", keywords: ["udochukwu", "aneke", "pa udochukwu", "pst udochukwu", "pastor udochukwu", "brother udochukwu", "udu", "mr aneke", "mr udochukwu", "udo"] },
  { name: "Janefrancis Igwilo", keywords: ["janefrancis", "igwilo", "jane francis", "jane-francis", "pa janefrancis", "pst janefrancis", "pastor janefrancis", "sister janefrancis", "mama janefrancis", "jane"] },
  { name: "Nsoke Favour", keywords: ["nsoke", "favour", "nsoke favour", "pa nsoke", "pst nsoke", "pastor nsoke", "brother nsoke", "mr favour", "mr nsoke"] },
  { name: "Kosi Onyibor", keywords: ["kosi onyibor", "onyibor", "pa kosi onyibor", "pst kosi onyibor", "pastor kosi onyibor", "brother kosi onyibor", "mr onyibor", "mr kosi"] },
  { name: "Ifeyinwa Umeadi", keywords: ["ifeyinwa", "umeadi", "ifeyinwa umeadi", "pa ifeyinwa", "pst ifeyinwa", "pastor ifeyinwa", "sister ifeyinwa", "mama ifeyinwa", "ify"] },
  { name: "Lovina Wilfred", keywords: ["lovina", "wilfred", "lovina wilfred", "pa lovina", "pst lovina", "pastor lovina", "sister lovina", "mama lovina", "mrs wilfred"] },
  { name: "Wilfred Ebube", keywords: ["wilfred", "ebube", "wilfred ebube", "pa wilfred", "pst wilfred", "pastor wilfred", "brother wilfred", "mr ebube", "mr wilfred", "willy"] },
  { name: "Chioma meniru", keywords: ["chioma", "meniru", "chioma meniru", "pa chioma", "pst chioma", "pastor chioma", "sister chioma", "mama chioma", "chi", "mrs meniru"] },
  { name: "Joshua ohanugo", keywords: ["joshua", "ohanugo", "joshua ohanugo", "pa joshua", "pst joshua", "pastor joshua", "brother joshua", "mr joshua", "mr ohanugo", "josh"] },
  { name: "Unassigned", keywords: ["unassigned", "unknown", "none", "n/a", ""] }
];

function findClosestActiveLeader(dictName) {
  const leadersList = window.allLeaders || (window.state && window.state.members ? [...new Set(window.state.members.filter(m => m.leader_type === 'G12' || m.leader_type === 'DH').map(m => m.member_name))] : null);
  if (!leadersList || leadersList.length === 0) return dictName;
  if (leadersList.includes(dictName)) return dictName;
  
  const lowerDict = dictName.toLowerCase();
  const exactMatch = leadersList.find(l => l.toLowerCase() === lowerDict);
  if (exactMatch) return exactMatch;
  
  const partialMatch = leadersList.find(l => {
    const lowerL = l.toLowerCase();
    return lowerL.includes(lowerDict) || lowerDict.includes(lowerL);
  });
  if (partialMatch) return partialMatch;
  
  return dictName;
}

function normalizeLeaderName(name) {
  if (!name || name.trim() === "") return "Unassigned";
  
  const normalized = name.trim().toLowerCase();
  
  const leadersList = window.allLeaders || (window.state && window.state.members ? [...new Set(window.state.members.filter(m => m.leader_type === 'G12' || m.leader_type === 'DH').map(m => m.member_name))] : null);
  if (leadersList) {
    const activeMatch = leadersList.find(l => l.toLowerCase() === normalized);
    if (activeMatch) return activeMatch;
  }

  for (let entry of LEADER_DICTIONARY) {
    if (entry.name.toLowerCase() === normalized) {
      return findClosestActiveLeader(entry.name);
    }
  }
  
  for (let entry of LEADER_DICTIONARY) {
    if (entry.keywords.some(kw => kw.toLowerCase() === normalized)) {
      return findClosestActiveLeader(entry.name);
    }
  }
  
  for (let entry of LEADER_DICTIONARY) {
    for (let kw of entry.keywords) {
      if (normalized.includes(kw.toLowerCase()) || kw.toLowerCase().includes(normalized)) {
        return findClosestActiveLeader(entry.name);
      }
    }
  }
  
  let clean = name.trim();
  const titles = ["pastor", "pa", "pst", "mr", "mrs", "ms", "miss", "dr", "prof", "brother", "sister", "mama", "sis", "fr"];
  for (let title of titles) {
    const regex = new RegExp(`^${title}\\s+`, "i");
    clean = clean.replace(regex, "");
  }
  
  const cleanedName = clean.trim().replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  
  if (leadersList) {
    const activeCleanMatch = leadersList.find(l => l.toLowerCase() === cleanedName.toLowerCase());
    if (activeCleanMatch) return activeCleanMatch;
  }
  
  return cleanedName;
}

window.LEADER_DICTIONARY = LEADER_DICTIONARY;
window.normalizeLeaderName = normalizeLeaderName;
window.findClosestActiveLeader = findClosestActiveLeader;
