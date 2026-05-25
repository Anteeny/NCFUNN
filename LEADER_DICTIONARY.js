/**
 * COMPREHENSIVE LEADER DICTIONARY
 * Maps all aliases and variations to canonical leader names
 * Last updated: May 22, 2026
 */

const LEADER_DICTIONARY = [
  // 1. Ukamaka Augustine
  { name: "Ukamaka Augustine", keywords: ["ukamaka", "ukay", "p.ukay", "pa ukay", "pst ukay", "pastor ukay", "ma ukay", "augusta", "augustine", "brother ukamaka", "sister ukamaka"] },
  
  // 2. Royal Eroh
  { name: "Royal Eroh", keywords: ["royal", "eroh", "brother royal", "pastor royal", "pa royal", "pst royal", "mr royal", "mr eroh", "pastor eroh"] },
  
  // 3. Promise Okeke
  { name: "Promise Okeke", keywords: ["promise", "okeke", "promise okeke", "pa promise", "pst promise", "pastor promise", "pastor promise okeke", "brother promise"] },
  
  // 4. Francis Ogbozor
  { name: "Francis Ogbozor", keywords: ["francis", "ogbozor", "brother francis", "pastor francis", "pa francis", "pst francis", "fr francis", "frank", "frankline", "fancis"] },
  
  // 5. Ebuka Aziekwe
  { name: "Ebuka Aziekwe", keywords: ["ebuka", "aziekwe", "pa ebuka", "pst ebuka", "pastor ebuka", "brother ebuka", "aziek"] },
  
  // 6. Winner Richards
  { name: "Winner Richards", keywords: ["winner", "richards", "pa winner", "pst winner", "pastor winner", "brother winner", "mr winner", "mr richards"] },
  
  // 7. Kene Offiah
  { name: "Kene Offiah", keywords: ["kene", "offiah", "pa kene", "pst kene", "pastor kene", "brother kene", "kenny", "kenneth"] },
  
  // 8. Noble Onwuka
  { name: "Noble Onwuka", keywords: ["noble", "onwuka", "pa noble", "pst noble", "pastor noble", "brother noble", "mr noble", "mr onwuka"] },
  
  // 9. Mmesoma Ozor
  { name: "Mmesoma Ozor", keywords: ["mmesoma", "ozor", "mmesoma ozor", "pa mmesoma", "pst mmesoma", "pastor mmesoma", "brother mmesoma", "mama mmesoma", "sis mmesoma"] },
  
  // 10. Ogbamba Onyinye
  { name: "Ogbamba Onyinye", keywords: ["ogbamba", "onyinye", "onyinye ogbambwa", "pa onyinye", "pst onyinye", "pastor onyinye", "brother onyinye", "sister onyinye", "mama onyinye"] },
  
  // 11. Nkechi Ohazulike
  { name: "Nkechi Ohazulike", keywords: ["nkechi", "ohazulike", "pa nkechi", "pst nkechi", "pastor nkechi", "pastor mkechi", "mkechi", "sister nkechi", "mama nkechi", "nkechikwu"] },
  
  // 12. Precious Ubani
  { name: "Precious Ubani", keywords: ["precious", "ubani", "precious ubani", "pastor precious", "pa precious", "pst precious", "pastor precious ubani", "brother precious", "sister precious", "mama precious", "priceless"] },
  
  // 13. Nuel Azubuike
  { name: "Nuel Azubuike", keywords: ["nuel", "azubuike", "pa nuel", "pst nuel", "pastor nuel", "brother nuel", "muel", "mr nuel", "nuel azubuike"] },
  
  // 14. Emmanuella Okonkwo
  { name: "Emmanuella Okonkwo", keywords: ["emmanuella", "okonkwo", "pa emmanuella", "pst emmanuella", "pastor emmanuella", "sister emmanuella", "mama emmanuella", "sis emma", "emma"] },
  
  // 15. Kosi Mbamalu
  { name: "Kosi Mbamalu", keywords: ["kosi", "mbamalu", "pa kosi", "pst kosi", "pastor kosi", "brother kosi", "mr kosi", "mr mbamalu"] },
  
  // 16. Faithfulness Onuh
  { name: "Faithfulness Onuh", keywords: ["faithfulness", "onuh", "faith", "faithful", "pa faithfulness", "pst faithfulness", "pastor faithfulness", "brother faithfulness", "mr onuh"] },
  
  // 17. Vivian Nwolisa
  { name: "Vivian Nwolisa", keywords: ["vivian", "nwolisa", "vivian nwolisa", "pa vivian", "pst vivian", "pastor vivian", "sister vivian", "mama vivian", "viv", "vivienne"] },
  
  // 18. Odinaka Onugha
  { name: "Odinaka Onugha", keywords: ["odinaka", "onugha", "pa odinaka", "pst odinaka", "pastor odinaka", "brother odinaka", "mr odinaka", "dinaka", "mr onugha"] },
  
  // 19. Udochukwu Aneke
  { name: "Udochukwu Aneke", keywords: ["udochukwu", "aneke", "pa udochukwu", "pst udochukwu", "pastor udochukwu", "brother udochukwu", "udu", "mr aneke", "mr udochukwu", "udo"] },
  
  // 20. Janefrancis Igwilo
  { name: "Janefrancis Igwilo", keywords: ["janefrancis", "igwilo", "jane francis", "jane-francis", "pa janefrancis", "pst janefrancis", "pastor janefrancis", "sister janefrancis", "mama janefrancis", "jane"] },
  
  // 21. Nsoke Favour
  { name: "Nsoke Favour", keywords: ["nsoke", "favour", "nsoke favour", "pa nsoke", "pst nsoke", "pastor nsoke", "brother nsoke", "mr favour", "mr nsoke"] },
  
  // 22. Kosi Onyibor
  { name: "Kosi Onyibor", keywords: ["kosi onyibor", "onyibor", "pa kosi onyibor", "pst kosi onyibor", "pastor kosi onyibor", "brother kosi onyibor", "mr onyibor", "mr kosi"] },
  
  // 23. Ifeyinwa Umeadi
  { name: "Ifeyinwa Umeadi", keywords: ["ifeyinwa", "umeadi", "ifeyinwa umeadi", "pa ifeyinwa", "pst ifeyinwa", "pastor ifeyinwa", "sister ifeyinwa", "mama ifeyinwa", "ify"] },
  
  // 24. Lovina Wilfred
  { name: "Lovina Wilfred", keywords: ["lovina", "wilfred", "lovina wilfred", "pa lovina", "pst lovina", "pastor lovina", "sister lovina", "mama lovina", "mrs wilfred"] },
  
  // 25. Wilfred Ebube
  { name: "Wilfred Ebube", keywords: ["wilfred", "ebube", "wilfred ebube", "pa wilfred", "pst wilfred", "pastor wilfred", "brother wilfred", "mr ebube", "mr wilfred", "willy"] },
  
  // 26. Chioma meniru
  { name: "Chioma meniru", keywords: ["chioma", "meniru", "chioma meniru", "pa chioma", "pst chioma", "pastor chioma", "sister chioma", "mama chioma", "chi", "mrs meniru"] },
  
  // 27. Joshua ohanugo
  { name: "Joshua ohanugo", keywords: ["joshua", "ohanugo", "joshua ohanugo", "pa joshua", "pst joshua", "pastor joshua", "brother joshua", "mr joshua", "mr ohanugo", "josh"] },

  // Generic/Temporary entries for unassigned leaders
  { name: "Unassigned", keywords: ["unassigned", "unknown", "none", "n/a", ""] }
];

/**
 * Normalize leader name by converting aliases to canonical names
 */
function normalizeLeaderName(name) {
  if (!name || name.trim() === "") return "Unassigned";
  
  const normalized = name.trim().toLowerCase();
  
  // Try exact match first
  for (let entry of LEADER_DICTIONARY) {
    if (entry.name.toLowerCase() === normalized) {
      return entry.name;
    }
  }
  
  // Try keyword matching
  for (let entry of LEADER_DICTIONARY) {
    if (entry.keywords.some(kw => kw.toLowerCase() === normalized)) {
      return entry.name;
    }
  }
  
  // Try partial keyword matching (for multi-word variations)
  for (let entry of LEADER_DICTIONARY) {
    for (let kw of entry.keywords) {
      if (normalized.includes(kw.toLowerCase()) || kw.toLowerCase().includes(normalized)) {
        return entry.name;
      }
    }
  }
  
  // If not found in dictionary, return original name with proper trim and title removal
  let clean = name.trim();
  
  // Remove common titles
  const titles = ["pastor", "pa", "pst", "mr", "mrs", "ms", "miss", "dr", "prof", "brother", "sister", "mama", "sis", "fr"];
  for (let title of titles) {
    const regex = new RegExp(`^${title}\\s+`, "i");
    clean = clean.replace(regex, "");
  }
  
  return clean.trim();
}

// Export for use in Node.js/CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LEADER_DICTIONARY, normalizeLeaderName };
}
