/* ============================================================
   THE NAT ZEROES — mock campaign data
   ============================================================ */
window.NZ = (function () {
  // ---- Party (PCs) ----
  const party = [
    { id: "p1", name: "Bramblewick Thorne", player: "Jess", cls: "Rogue", subclass: "Arcane Trickster", race: "Forest Gnome", level: 7,
      hp: 41, hpMax: 52, ac: 15, init: 4, speed: 25, ring: "#4fb98a",
      blurb: "Steals first, asks for forgiveness never. Owns 14 daggers, has lost 13.",
      dndb: "https://www.dndbeyond.com/characters/", passive: 16, player: "Amelie",
      stats: { STR: 8, DEX: 18, CON: 13, INT: 16, WIS: 12, CHA: 11 },
      avatar: { race: "gnome", cls: "rogue", build: "slim", height: 0.95, skin: "#e0a979", hair: "mohawk", hairColor: "#7a2e2e", eyeColor: "#5a7d4a", primary: "#2e3a36", secondary: "#1c2420", headgear: "hood", weapon: "daggers" } },
    { id: "p2", name: "Sister Maribel", player: "Lewis", cls: "Cleric", subclass: "Light Domain", race: "Aasimar", level: 7,
      hp: 58, hpMax: 58, ac: 18, init: 1, speed: 30, ring: "#e8b54a",
      blurb: "Heals the party, judges them silently. Radiant and passive-aggressive.",
      dndb: "https://www.dndbeyond.com/characters/", passive: 17,
      stats: { STR: 12, DEX: 10, CON: 14, INT: 11, WIS: 18, CHA: 15 },
      avatar: { race: "human", cls: "cleric", build: "average", height: 1.03, skin: "#f2c79a", hair: "long", hairColor: "#d9c27a", eyeColor: "#b08a3a", primary: "#d9c27a", secondary: "#9a7d3a", headgear: "crown", weapon: "mace" } },
    { id: "p3", name: "Krunk the Considerate", player: "Milo", cls: "Barbarian", subclass: "Path of the Zealot", race: "Half-Orc", level: 7,
      hp: 33, hpMax: 76, ac: 14, init: 2, speed: 40, ring: "#e8412e",
      blurb: "Rages, then writes apology letters. Currently bloodied and very sorry.",
      dndb: "https://www.dndbeyond.com/characters/", passive: 11,
      stats: { STR: 19, DEX: 14, CON: 17, INT: 8, WIS: 12, CHA: 10 },
      avatar: { race: "halforc", cls: "barbarian", build: "broad", height: 1.12, skin: "#8fa37a", hair: "ponytail", hairColor: "#2b1b12", eyeColor: "#9a3a3a", primary: "#6e4a2f", secondary: "#42291a", headgear: "none", weapon: "axe" } },
    { id: "p4", name: "Fizzwick Vane", player: "Joe", cls: "Wizard", subclass: "School of Evocation", race: "Tiefling", level: 7,
      hp: 44, hpMax: 44, ac: 12, init: 3, speed: 30, ring: "#9170f0",
      blurb: "Solves every problem with a fireball. Including non-problems.",
      dndb: "https://www.dndbeyond.com/characters/", passive: 14,
      stats: { STR: 9, DEX: 16, CON: 13, INT: 19, WIS: 12, CHA: 14 },
      avatar: { race: "tiefling", cls: "wizard", build: "slim", height: 1.0, skin: "#b86a6a", hair: "short", hairColor: "#3a2a4a", eyeColor: "#7a4a9a", primary: "#3b3a8c", secondary: "#221f5a", headgear: "wizard", weapon: "staff" } },
    { id: "p5", name: "Dame Quietly", player: "Amelie", cls: "Bard", subclass: "College of Whispers", race: "Half-Elf", level: 7,
      hp: 49, hpMax: 51, ac: 15, init: 5, speed: 30, ring: "#4ea7e8",
      blurb: "Knows everyone's secrets. Will sing them at the worst moment.",
      dndb: "https://www.dndbeyond.com/characters/", passive: 18,
      stats: { STR: 10, DEX: 16, CON: 12, INT: 13, WIS: 11, CHA: 18 },
      avatar: { race: "elf", cls: "bard", build: "slim", height: 1.04, skin: "#f2c79a", hair: "bun", hairColor: "#b07a3a", eyeColor: "#4a6d9a", primary: "#9c3b6e", secondary: "#5e2342", headgear: "none", weapon: "none" } },
  ];

  const dm = { id: "dm", name: "Callum (DM)", player: "Callum", role: "Dungeon Master", ring: "#b07f30" };

  // ---- Bestiary (custom + SRD enemies & allies) ----
  const bestiary = [
    { id: "e1", name: "Gloomfang, the Tax Collector", type: "Aberration", size: "Large", cr: "8", custom: true, side: "enemy",
      hp: 112, hpMax: 112, ac: 16, speed: 30, init: 1, ring: "#e8412e",
      tags: ["Boss", "Legendary"], color: "#e8412e",
      blurb: "Demands 30% of your gold and your fondest memory. Has legendary resistances and an itemized receipt.",
      stats: { STR: 18, DEX: 12, CON: 19, INT: 16, WIS: 14, CHA: 17 },
      actions: ["Multiattack (2 claws)", "Audit (psychic, DC 15 WIS)", "Frighten (recharge 5–6)"] },
    { id: "e2", name: "Goblin Accountant", type: "Humanoid", size: "Small", cr: "1/4", custom: true,
      hp: 12, hpMax: 12, ac: 13, speed: 30, init: 2, ring: "#4fb98a",
      tags: ["Minion"], color: "#4fb98a",
      blurb: "Wields a +1 abacus. Will flee if its ledger is threatened.",
      stats: { STR: 8, DEX: 14, CON: 10, INT: 13, WIS: 8, CHA: 8 },
      actions: ["Abacus Whack", "Disadvantageous Math"] },
    { id: "e3", name: "The Unhelpful Ghost", type: "Undead", size: "Medium", cr: "4", custom: true,
      hp: 45, hpMax: 45, ac: 11, speed: 0, init: 3, ring: "#9170f0",
      tags: ["Lair"], color: "#9170f0",
      blurb: "Knows where the treasure is. Refuses to elaborate. Sighs constantly.",
      stats: { STR: 7, DEX: 13, CON: 10, INT: 10, WIS: 12, CHA: 17 },
      actions: ["Vague Hint", "Possess Furniture", "Ominous Sigh"] },
    { id: "e4", name: "Dire Boar", type: "Beast", size: "Large", cr: "2", custom: false,
      hp: 42, hpMax: 42, ac: 12, speed: 40, init: 0, ring: "#b07f30",
      tags: ["Beast"], color: "#b07f30",
      blurb: "Standard angry pig. Surprisingly fast. Bears a grudge.",
      stats: { STR: 17, DEX: 11, CON: 16, INT: 2, WIS: 9, CHA: 5 },
      actions: ["Tusk (slashing)", "Charge (knockdown)"] },
    { id: "e5", name: "Animated Armour", type: "Construct", size: "Medium", cr: "1", custom: false,
      hp: 33, hpMax: 33, ac: 18, speed: 25, init: 0, ring: "#cabfa8",
      tags: ["Construct"], color: "#cabfa8",
      blurb: "Empty, ominous, and squeaky. Guards a room nobody wants.",
      stats: { STR: 14, DEX: 11, CON: 13, INT: 1, WIS: 3, CHA: 1 },
      actions: ["Multiattack (2 slams)"] },
    { id: "e6", name: "Mimic (a Pretty Good Chest)", type: "Monstrosity", size: "Medium", cr: "2", custom: true,
      hp: 58, hpMax: 58, ac: 12, speed: 15, init: 1, ring: "#e8b54a",
      tags: ["Trap", "Boss"], color: "#e8b54a",
      blurb: "Honestly a very convincing chest. 10/10 craftsmanship. Also teeth.",
      stats: { STR: 17, DEX: 12, CON: 15, INT: 5, WIS: 13, CHA: 8 },
      actions: ["Pseudopod (adhesive)", "Bite", "False Appearance"] },
    // ---- Allies ----
    { id: "a1", name: "Sir Pellinore the Patient", type: "Humanoid (Knight)", size: "Medium", cr: "3", custom: true, side: "ally",
      hp: 52, hpMax: 52, ac: 18, speed: 30, init: 0, ring: "#4ea7e8",
      tags: ["Ally", "Tank"], color: "#4ea7e8",
      blurb: "A knight-errant who has sworn to protect the party, mostly from themselves. Sighs heroically.",
      stats: { STR: 16, DEX: 11, CON: 15, INT: 10, WIS: 11, CHA: 13 },
      actions: ["Multiattack (2 longsword)", "Protective Bulwark", "Leadership (recharge)"],
      avatar: { race: "human", cls: "paladin", build: "broad", height: 1.06, skin: "#e0a979", hair: "short", hairColor: "#6b4423", eyeColor: "#4a6d9a", primary: "#7d8896", secondary: "#3a4350", headgear: "helm", weapon: "sword" } },
    { id: "a2", name: "Wrenn the Hedge Witch", type: "Humanoid (Spellcaster)", size: "Medium", cr: "4", custom: true, side: "ally",
      hp: 38, hpMax: 38, ac: 13, speed: 30, init: 2, ring: "#4fb98a",
      tags: ["Ally", "Healer"], color: "#4fb98a",
      blurb: "Lives in the woods, talks to mushrooms. Will heal you and then charge you in turnips.",
      stats: { STR: 9, DEX: 14, CON: 13, INT: 14, WIS: 17, CHA: 12 },
      actions: ["Healing Word", "Entangle", "Suspicious Tea"],
      avatar: { race: "elf", cls: "cleric", build: "slim", height: 0.98, skin: "#9fb89a", hair: "long", hairColor: "#9a9a9a", eyeColor: "#5a7d4a", primary: "#3c5a36", secondary: "#243a20", headgear: "hood", weapon: "staff" } },
    { id: "a3", name: "Bartholomew Cobb", type: "Humanoid (Commoner)", size: "Medium", cr: "1/8", custom: true, side: "ally",
      hp: 16, hpMax: 16, ac: 11, speed: 30, init: 0, ring: "#e8b54a",
      tags: ["Ally", "Tavern Keeper"], color: "#e8b54a",
      blurb: "Owner of The Soggy Tankard. Pours a great pint, knows everyone's business, owes Gloomfang too.",
      stats: { STR: 12, DEX: 10, CON: 12, INT: 11, WIS: 13, CHA: 14 },
      actions: ["Throw Tankard", "Rumour", "Free Round (once per night)"],
      avatar: { race: "dwarf", cls: "fighter", build: "broad", height: 0.9, skin: "#c68642", hair: "bald", hairColor: "#6b4423", eyeColor: "#3a2a1a", primary: "#6e4a2f", secondary: "#42291a", headgear: "none", weapon: "none" } },
  ];

  // ---- Maps ----
  const maps = [
    { id: "m1", name: "The Soggy Tankard (Tavern)", grid: 28, cols: 26, rows: 16, bg: "tavern", active: true,
      note: "Session 12 — bar fight imminent" },
    { id: "m2", name: "Gloomfang's Counting House", grid: 28, cols: 30, rows: 18, bg: "dungeon",
      note: "The boss room. Mind the ledgers." },
    { id: "m3", name: "Whispering Woods Crossroads", grid: 28, cols: 28, rows: 18, bg: "forest",
      note: "Random encounter central" },
    { id: "m4", name: "Ruined Aqueduct", grid: 28, cols: 32, rows: 16, bg: "cave",
      note: "Verticality! (we will forget about verticality)" },
  ];

  // ---- Schedule ----
  const members = [
    { id: "Callum", role: "DM" }, { id: "Joe" }, { id: "Amelie" },
    { id: "Milo" }, { id: "Lewis" },
  ];

  // availability poll: per-option, who's available
  const pollOptions = [
    { id: "o1", date: "2026-06-06", label: "Sat Jun 6", time: "7:00 PM", yes: ["Callum","Amelie","Lewis","Joe","Milo"], no: [], maybe: [] },
    { id: "o2", date: "2026-06-07", label: "Sun Jun 7", time: "6:30 PM", yes: ["Callum","Amelie","Joe"], no: ["Lewis"], maybe: ["Milo"] },
    { id: "o3", date: "2026-06-13", label: "Sat Jun 13", time: "7:00 PM", yes: ["Callum","Amelie","Lewis","Joe","Milo"], no: [], maybe: [] },
    { id: "o4", date: "2026-06-14", label: "Sun Jun 14", time: "7:00 PM", yes: ["Amelie","Lewis","Milo"], no: ["Callum","Joe"], maybe: [] },
  ];

  const sessions = [
    { id: "s1", num: 13, title: "The Counting House Heist", date: "2026-06-13", time: "7:00 PM", venue: "Joe's place + Discord", confirmed: true,
      rsvp: { Callum: "in", Amelie: "in", Lewis: "in", Joe: "in", Milo: "in" } },
    { id: "s2", num: 14, title: "Audit of the Damned", date: "2026-06-20", time: "7:00 PM", venue: "TBD", confirmed: false,
      rsvp: { Callum: "in", Amelie: "in", Lewis: "maybe", Joe: "in", Milo: "maybe" } },
  ];

  // ---- Campaign log / recaps ----
  const recaps = [
    { id: "r1", num: 12, title: "Everyone Owes Money Now", date: "May 30, 2026",
      body: "The party met Gloomfang the Tax Collector, immediately insulted him, and now collectively owe 4,000 gold and one (1) fond memory. Krunk apologised mid-rage. Fizzwick fireballed the receipt.",
      tags: ["Boss intro", "Nat 1 of the night: Dev"] },
    { id: "r2", num: 11, title: "The Chest Had Opinions", date: "May 23, 2026",
      body: "Bramblewick opened 'a pretty good chest.' It had teeth. Sister Maribel healed everyone while loudly noting she 'told them so.' Dame Quietly sang about it.",
      tags: ["Mimic", "TPK avoided (barely)"] },
    { id: "r3", num: 10, title: "Directions From a Ghost", date: "May 16, 2026",
      body: "Spent 90 minutes interrogating a ghost who knew exactly where the treasure was and refused to say. Eventually followed it out of spite. It was the right call.",
      tags: ["Roleplay", "0 combat"] },
  ];

  const stats = {
    sessionsPlayed: 12,
    nat20s: 38,
    nat1s: 51, // they ARE the Nat Zeroes
    tpks: 0,
    inJokes: 217,
  };

  // ---- World map: discovered locations -> saved battle maps ----
  const locations = [
    { id: "loc1", name: "Tanglewick Village", type: "town", discovered: true, x: 31, y: 63, maps: ["m1"],
      desc: "Muddy little village built around The Soggy Tankard. Home base, sort of. Everyone here owes Gloomfang money." },
    { id: "loc2", name: "Gloomfang's Counting House", type: "dungeon", discovered: true, x: 60, y: 41, maps: ["m2"],
      desc: "A fortified ledger-fortress where debts go to die. The boss lairs on the top floor behind a wall of receipts." },
    { id: "loc3", name: "The Whispering Woods", type: "wild", discovered: true, x: 45, y: 74, maps: ["m3"],
      desc: "Ancient forest where the trees gossip. Random encounter central. Wrenn the Hedge Witch lives somewhere in here." },
    { id: "loc4", name: "The Sunken Aqueduct", type: "ruin", discovered: true, x: 73, y: 67, maps: ["m4"],
      desc: "Crumbling dwarven waterworks, now flooded and full of things that shouldn't swim. Verticality the party will ignore." },
    { id: "loc5", name: "The Frostspire", type: "landmark", discovered: false, x: 23, y: 24, maps: [],
      desc: "A frozen tower visible from everywhere, reachable from nowhere. Rumoured endgame." },
    { id: "loc6", name: "Port Marrow", type: "town", discovered: false, x: 82, y: 31, maps: [],
      desc: "A salt-crusted harbour town of smugglers and worse. Not yet visited." },
  ];

  // ---- Weekly schedule ----
  const weeklySchedule = {
    primaryDay: 2,    // 0=Sun … 6=Sat (Tuesday)
    backupDay: 3,     // Wednesday
    primaryTime: "7:00 PM",
    backupTime: "7:00 PM",
    active: false,    // is backup day currently activated?
    activatedBy: null,
    activationNote: "Activates when 2+ players can't make the primary day by midday Monday.",
  };

  // ---- Campaign info (editable by DM) ----
  const campaign = {
    eyebrow: "A Chaotic Comedy D&D Podcast",
    prefix: "Campaign II:",
    title: "Debts & Dragons",
    desc: "Five disasters, one long-suffering DM, and a tax collector with legendary actions. Roll the table, track the carnage, and try not to crit-fail your way into more debt.",
  };

  // ---- Chat Zeroes: stats + awards ----
  const chatStats = [
    { id: "cs1", label: "Nat 20s", value: 38, icon: "sparkle", color: "var(--emerald)" },
    { id: "cs2", label: "Nat 1s", value: 51, icon: "dice", color: "var(--red)" },
    { id: "cs3", label: "In-Jokes", value: 217, icon: "flame", color: "var(--amethyst)" },
    { id: "cs4", label: "Sessions", value: 12, icon: "recap", color: "var(--gold)" },
  ];

  const awards = [
    { id: "aw1", name: "Richard of the Recording", emoji: "🏆", desc: "Dick of the day — who fumbled hardest this session?", winners: [{ session: 12, player: "Milo" }, { session: 11, player: "Lewis" }] },
    { id: "aw2", name: "MVP", emoji: "🌟", desc: "Most Valuable Player — carried the session.", winners: [{ session: 12, player: "Amelie" }, { session: 11, player: "Joe" }] },
    { id: "aw3", name: "Best Bit", emoji: "🎭", desc: "Funniest or most memorable moment.", winners: [{ session: 12, player: "Lewis" }] },
  ];

  return { party, dm, bestiary, maps, members, pollOptions, sessions, recaps, stats, locations, weeklySchedule, campaign, chatStats, awards };
})();
