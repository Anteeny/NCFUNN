/**
 * COMPREHENSIVE CANONICAL LEADER DICTIONARY
 * Automatically normalizes nicknames, titles, and aliases to official canonical names.
 */

export interface LeaderMapping {
  name: string;
  keywords: string[];
}

export const LEADER_DICTIONARY: LeaderMapping[] = [
  { name: "Ukamaka Augustine", keywords: ["ukamaka", "ukay", "p.ukay", "pa ukay", "pst ukay", "pastor ukay", "ma ukay", "augusta", "augustine"] },
  { name: "Royal Eroh", keywords: ["royal", "eroh", "brother royal", "pastor royal", "pa royal", "pst royal", "mr royal", "mr eroh", "pastor eroh"] },
  { name: "Promise Okeke", keywords: ["promise", "okeke", "promise okeke", "pa promise", "pst promise", "pastor promise", "pastor promise okeke", "brother promise"] },
  { name: "Francis Ogbozor", keywords: ["francis", "ogbozor", "brother francis", "pastor francis", "pa francis", "pst francis", "fr francis", "frank", "frankline", "fancis"] },
  { name: "Ebuka Aziekwe", keywords: ["ebuka", "aziekwe", "pa ebuka", "pst ebuka", "pastor ebuka", "brother ebuka", "aziek"] },
  { name: "Winner Richards", keywords: ["winner", "richards", "pa winner", "pst winner", "pastor winner", "brother winner", "mr winner", "mr richards"] },
  { name: "Kene Offiah", keywords: ["kene", "offiah", "pa kene", "pst kene", "pastor kene", "brother kene", "kenny", "kenneth"] },
  { name: "Noble Onwuka", keywords: ["noble", "onwuka", "pa noble", "pst noble", "pastor noble", "brother noble", "mr noble", "mr onwuka"] },
  { name: "Mmesoma Ozor", keywords: ["mmesoma", "ozor", "mmesoma ozor", "pa mmesoma", "pst mmesoma", "pastor mmesoma", "brother mmesoma", "mama mmesoma", "sis mmesoma"] },
  { name: "Ogbamba Onyinye", keywords: ["ogbamba", "onyinye", "onyinye ogbambwa", "pa onyinye", "pst onyinye", "pastor onyinye", "brother onyinye", "sister onyinye", "mama onyinye"] },
  { name: "Nkechi Ohazulike", keywords: ["nkechi", "ohazulike", "pa nkechi", "pst nkechi", "pastor nkechi", "pastor mkechi", "mkechi", "sister nkechi", "mama nkechi"] },
  { name: "Precious Ubani", keywords: ["precious", "ubani", "precious ubani", "pastor precious", "pa precious", "pst precious", "sister precious", "mama precious", "priceless"] },
  { name: "Nuel Azubuike", keywords: ["nuel", "azubuike", "pa nuel", "pst nuel", "pastor nuel", "brother nuel", "muel", "mr nuel"] },
  { name: "Emmanuella Okonkwo", keywords: ["emmanuella", "okonkwo", "pa emmanuella", "pst emmanuella", "pastor emmanuella", "sister emmanuella", "mama emmanuella", "sis emma", "emma"] },
  { name: "Kosi Mbamalu", keywords: ["kosi", "mbamalu", "pa kosi", "pst kosi", "pastor kosi", "brother kosi", "mr kosi", "mr mbamalu"] },
  { name: "Faithfulness Onuh", keywords: ["faithfulness", "onuh", "faith", "faithful", "pa faithfulness", "pst faithfulness", "pastor faithfulness"] },
  { name: "Vivian Nwolisa", keywords: ["vivian", "nwolisa", "pa vivian", "pst vivian", "pastor vivian", "sister vivian", "mama vivian", "viv"] },
  { name: "Odinaka Onugha", keywords: ["odinaka", "onugha", "pa odinaka", "pst odinaka", "pastor odinaka", "brother odinaka", "dinaka"] },
  { name: "Victor Eze", keywords: ["victor", "eze", "pa victor", "pst victor", "pastor victor", "brother victor"] },
  { name: "Chidimma Nwosu", keywords: ["chidimma", "nwosu", "pa chidimma", "pst chidimma", "pastor chidimma", "chidi"] },
  { name: "Emmanuel Eze", keywords: ["emmanuel eze", "emma eze", "pa emmanuel", "pst emmanuel"] },
  { name: "Somtochukwu Ani", keywords: ["somto", "somtochukwu", "ani", "pa somto", "pst somto"] },
  { name: "Chisom Okoli", keywords: ["chisom", "okoli", "pa chisom", "pst chisom", "sommy"] },
  { name: "David Ugwu", keywords: ["david", "ugwu", "pa david", "pst david", "dave"] },
  { name: "Peace Madu", keywords: ["peace", "madu", "pa peace", "pst peace", "sister peace"] }
];

/**
 * Normalizes any leader search query or alias to the official canonical name
 */
export function normalizeLeaderName(input: string): string {
  if (!input) return "";
  const cleaned = input.toLowerCase().trim();
  for (const entry of LEADER_DICTIONARY) {
    if (entry.name.toLowerCase() === cleaned) return entry.name;
    for (const kw of entry.keywords) {
      if (cleaned === kw || cleaned.includes(kw)) {
        return entry.name;
      }
    }
  }
  return input.trim();
}

/**
 * Matches a query against the leader dictionary
 */
export function searchLeaderDictionary(query: string): string[] {
  if (!query || query.trim().length === 0) {
    return LEADER_DICTIONARY.map(l => l.name);
  }
  const q = query.toLowerCase().trim();
  return LEADER_DICTIONARY.filter(leader => {
    if (leader.name.toLowerCase().includes(q)) return true;
    return leader.keywords.some(kw => kw.includes(q) || q.includes(kw));
  }).map(l => l.name);
}
