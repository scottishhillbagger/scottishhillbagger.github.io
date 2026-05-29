// data.js — Scottish hill Gaelic dataset
// Curated hills, root-word dictionary, and pronunciation phoneme map.
// All Gaelic spellings checked against standard sources; anglicised forms
// are the common signpost spellings, IPA is approximate.

// ─────────────────────────────────────────────────────────────────────────────
// ROOTS — the building blocks of hill names.
// type: "generic" (the noun: peak/ridge/cairn…), "adj" (descriptor),
//       "color", "article" (an, na, nam, nan…), "qualifier" (proper noun, of-X)
// shape: only on generics — drives the silhouette renderer
// ─────────────────────────────────────────────────────────────────────────────

const ROOTS = {
  // ─── Generics (hill shapes) ───
  "beinn":   { type: "generic", meaning: "mountain", pron: "ben / bayn", ipa: "peɲ", shape: "classic",   note: "Most common generic. Often anglicised 'Ben'." },
  "ben":     { type: "generic", meaning: "mountain", pron: "ben",        ipa: "bɛn", shape: "classic",   note: "Anglicised form of beinn." },
  "sgùrr":   { type: "generic", meaning: "sharp peak",     pron: "skoor",     ipa: "sguːrˠ", shape: "sharp",   note: "A rocky, pointed peak. Sometimes 'sgòr', 'sgor'." },
  "sgòr":    { type: "generic", meaning: "sharp peak",     pron: "skor",      ipa: "sgɔːrˠ", shape: "sharp",   note: "Variant of sgùrr." },
  "stob":    { type: "generic", meaning: "stubby point",   pron: "stob",      ipa: "sd̥ɔp", shape: "stub",     note: "A pointed summit, often part of a longer ridge." },
  "stùc":    { type: "generic", meaning: "pinnacle, steep rock", pron: "stoochk", ipa: "sduːxg", shape: "pinnacle", note: "A steep rocky outcrop." },
  "bidean":  { type: "generic", meaning: "sharp pinnacle", pron: "BEE-jan",   ipa: "ˈpiːtʲan", shape: "pinnacle", note: "Diminutive — a small sharp summit." },
  "càrn":    { type: "generic", meaning: "cairn, rocky heap", pron: "karn",   ipa: "kʰaːrˠn", shape: "cairn",  note: "A pile or heap of stones; rounded rocky hill." },
  "meall":   { type: "generic", meaning: "rounded lump",   pron: "myowl",     ipa: "mʲaul̪ˠ", shape: "dome",   note: "A bulky, rounded hill. Often a lower top." },
  "màm":     { type: "generic", meaning: "rounded hill, high pass", pron: "mam",       ipa: "maːm", shape: "dome",     note: "A smoothly rounded hill or a high pass. Etymologically related to 'breast' (cf. Welsh mam = mother), but in toponymy the geographic sense dominates." },
  "tom":     { type: "generic", meaning: "hillock",        pron: "towm",      ipa: "tʰɔum", shape: "knoll",   note: "A small mound or knoll." },
  "cnoc":    { type: "generic", meaning: "knoll, small hill", pron: "krochk", ipa: "krɔxg", shape: "knoll",   note: "The 'cn-' cluster undergoes rhotacism in most dialects — the 'c' stays pronounced as [k], but the 'n' shifts to a tapped or nasalised 'r'. That's why it sounds 'krochk', not 'knock'." },
  "creag":   { type: "generic", meaning: "crag, cliff",    pron: "krayk",     ipa: "kʰɾʲek", shape: "crag",   note: "A rocky outcrop or cliff face." },
  "aonach":  { type: "generic", meaning: "ridge, moor",    pron: "EUN-ach",   ipa: "ˈɯːnəx", shape: "ridge",  note: "A long, broad ridge. The 'ch' is gutteral as in loch." },
  "druim":   { type: "generic", meaning: "ridge, back",    pron: "drim",      ipa: "tɾɯim", shape: "ridge",  note: "A long ridge or back." },
  "sròn":    { type: "generic", meaning: "nose, promontory", pron: "strawn",  ipa: "s̪t̪ɾɔːn", shape: "nose", note: "A nose-shaped projecting ridge." },
  "sàil":    { type: "generic", meaning: "heel, hill-spur", pron: "sahl",     ipa: "saːl̪ˠ", shape: "spur",   note: "A spur or heel-shaped ridge. The long vowel is marked with a grave accent." },
  "leac":    { type: "generic", meaning: "slab, flat rock", pron: "lyechk",   ipa: "ʎaxg", shape: "slab",    note: "A flat slab of rock." },
  "binnein": { type: "generic", meaning: "small peak",     pron: "BIN-yan",   ipa: "ˈpiɲɛɲ", shape: "sharp",  note: "Diminutive of beinn — a sharp little peak." },
  "monadh":  { type: "generic", meaning: "moor, upland",   pron: "MON-uh",    ipa: "ˈmɔnəɣ", shape: "plateau", note: "A range of upland moor." },
  "sìth":    { type: "generic", meaning: "fairy hill",     pron: "shee",      ipa: "ʃiː", shape: "dome",     note: "A conical hill associated with the sìth — fairy folk." },
  "stac":    { type: "generic", meaning: "steep rock, stack", pron: "stachk", ipa: "sdaxg", shape: "pinnacle", note: "A steep isolated rock pillar." },
  "buachaille": { type: "generic", meaning: "herdsman, shepherd", pron: "BOO-uch-il-yuh", ipa: "ˈpuəxalʲə", shape: "sharp", note: "Lit. 'herdsman' — a sentinel-like peak watching over a glen." },
  "fionn":   { type: "generic", meaning: "fair one",       pron: "fyoon",     ipa: "fjuːn", shape: "classic", note: "Lit. 'fair, white' — often used as a noun for a fair hill." },
  "cùl":     { type: "generic", meaning: "back",           pron: "kool",      ipa: "kʰuːl̪ˠ", shape: "dome", note: "The back side of a hill." },

  // ─── Landscape-feature generics (Lesson 10 — what hill walkers meet
  // between car park and cairn). These aren't summits — they're the
  // streams you cross, the glens you walk up, the passes you traverse.
  // Same generic+qualifier pattern as hill names. Tagged 'generic' so
  // the existing parts-breakdown role colouring handles them.
  // druim and sròn are also landscape features but already appear above
  // as hill-generics — they do double duty. ───
  "allt":    { type: "generic", meaning: "stream, burn",  pron: "owlt",   ipa: "aul̪ˠt̪", shape: "ridge", note: "Most common watercourse word on OS maps. Anglicised as 'Ault-' in some places (Aultbea, Aultmore). Every hill walk crosses one." },
  "abhainn": { type: "generic", meaning: "river",         pron: "AH-vin", ipa: "ˈavɪɲ", shape: "ridge", note: "A larger watercourse than allt. The bh sounds 'v' — same lenition rule from Lesson 5." },
  "gleann":  { type: "generic", meaning: "glen, valley",  pron: "glown",  ipa: "kl̪ˠaun̪ˠ", shape: "ridge", note: "Anglicised as 'Glen' in countless place names. The valley you walk up to reach the hill." },
  "bealach": { type: "generic", meaning: "pass, gap, saddle", pron: "BYAL-ach", ipa: "ˈpjal̪ˠəx", shape: "ridge", note: "The low point between two summits. 'Bealach na Bà' (pass of cattle) is the famous Applecross example. The ch is gutteral as in loch." },
  "lairig":  { type: "generic", meaning: "long pass",     pron: "LAR-ig", ipa: "ˈl̪ˠaɾɪc", shape: "ridge", note: "A long, high pass — same family as bealach but bigger and more sustained. The Lairig Ghru between Aviemore and Braemar is the classic." },
  "bò":      { type: "noun",    meaning: "cow, cattle",   pron: "boh",    ipa: "poː", note: "Animal noun. Appears in place names tied to grazing land or droving routes. The genitive plural form 'bà' shows up in 'Bealach na Bà' (pass of cattle)." },

  // ─── Color adjectives (used to tint the silhouette) ───
  "mòr":     { type: "adj", meaning: "big, great",  pron: "mor",    ipa: "moːɾ" },
  "beag":    { type: "adj", meaning: "small",       pron: "bayk",   ipa: "pek" },
  "dearg":   { type: "color", meaning: "red",       pron: "jerrak", ipa: "tʲɛrˠɛk", hex: "#b14a3c" },
  "ruadh":   { type: "color", meaning: "russet, red-brown", pron: "ROO-ugh", ipa: "ruəɣ", hex: "#a86a3d" },
  "bàn":     { type: "color", meaning: "white, fair", pron: "bahn", ipa: "paːn", hex: "#e8e2d6" },
  "geal":    { type: "color", meaning: "bright white", pron: "gyal", ipa: "kʲal̪ˠ", hex: "#f1ede2" },
  "dubh":    { type: "color", meaning: "black, dark", pron: "doo",  ipa: "t̪uh", hex: "#2a2a2e" },
  "buidhe":  { type: "color", meaning: "yellow",    pron: "BOO-yuh", ipa: "ˈpujə", hex: "#c79b3a" },
  "gorm":    { type: "color", meaning: "blue, green-blue", pron: "gorrom", ipa: "kɔɾɔm", hex: "#4a6a82" },
  "glas":    { type: "color", meaning: "grey-green", pron: "glass", ipa: "kl̪ˠas̪", hex: "#7a8a6e" },
  "liath":   { type: "color", meaning: "grey",      pron: "LEE-uh", ipa: "ʎiə", hex: "#9aa0a2" },
  "uaine":   { type: "color", meaning: "green",     pron: "OO-an-yuh", ipa: "ˈuəɲə", hex: "#5a7a52" },
  "odhar":   { type: "color", meaning: "dun, dappled", pron: "OH-ur", ipa: "ˈoəɾ", hex: "#8a7858" },

  // ─── Shape / quality adjectives ───
  "garbh":   { type: "adj", meaning: "rough",       pron: "garrav", ipa: "kaɾav" },
  "min":     { type: "adj", meaning: "smooth",      pron: "meen",   ipa: "miːn" },
  "àrd":     { type: "adj", meaning: "high",        pron: "ard",    ipa: "aːrˠʃd̪" },
  "fada":    { type: "adj", meaning: "long",        pron: "FATT-uh", ipa: "ˈfatə" },
  "caol":    { type: "adj", meaning: "narrow",      pron: "keul",   ipa: "kʰɯːl̪ˠ" },
  "biorach": { type: "adj", meaning: "sharp, pointed", pron: "BIR-uch", ipa: "ˈpiɾəx" },
  "eighe":   { type: "adj", meaning: "file, notched", pron: "AY-yuh", ipa: "ˈejə" },
  "crom":    { type: "adj", meaning: "bent, curved", pron: "krom",   ipa: "kʰɾɔm" },
  "leathan": { type: "adj", meaning: "broad",       pron: "LYEH-han", ipa: "ˈʎɛhan" },

  // ─── Articles & particles (often lenite the next word) ───
  "an":      { type: "article", meaning: "the",     pron: "an",     ipa: "ən" },
  "am":      { type: "article", meaning: "the",     pron: "am",     ipa: "əm" },
  "a'":      { type: "article", meaning: "the (lenited)", pron: "uh", ipa: "ə" },
  "na":      { type: "article", meaning: "of the / the (pl)", pron: "nuh", ipa: "nə" },
  "nan":     { type: "article", meaning: "of the (pl)", pron: "nan", ipa: "nən" },
  "nam":     { type: "article", meaning: "of the (pl, before b/m/p)", pron: "nam", ipa: "nəm" },

  // ─── Qualifier nouns (genitive — "of X") ───
  "nibheis": { type: "qualifier", meaning: "(of) Nevis — venomous water", pron: "NYEH-vish", ipa: "ˈɲevɪʃ" },
  "bian":    { type: "qualifier", meaning: "hides, mountains", pron: "BEE-an", ipa: "ˈpiən" },
  "etive":   { type: "qualifier", meaning: "(of) Etive", pron: "ETT-iv", ipa: "ˈɛtʲɪv" },
  "macduibh":{ type: "qualifier", meaning: "of MacDuff", pron: "mak-DOO-ee", ipa: "məkˈt̪uj" },
  "chailleann": { type: "qualifier", meaning: "of the Caledonians", pron: "KHALL-yun", ipa: "ˈxal̪ˠʲən" },
  "dòrain":  { type: "qualifier", meaning: "of the streamlets", pron: "DAW-rin", ipa: "ˈt̪ɔːɾɪɲ" },
  "gàire":   { type: "qualifier", meaning: "of laughter, noise", pron: "GAH-ruh", ipa: "ˈkaːɾə" },
  "gillean": { type: "qualifier", meaning: "of the young men", pron: "GIL-yan", ipa: "ˈkiʎən" },
  "pollaidh":{ type: "qualifier", meaning: "of the peat-pool", pron: "POL-ee", ipa: "ˈpɔl̪ˠiː" },
  "teallach":{ type: "qualifier", meaning: "forge, anvil", pron: "TYAL-uch", ipa: "ˈtʲal̪ˠəx" },
  "ladhar":  { type: "qualifier", meaning: "hoof, claw, fork", pron: "LAA-ar", ipa: "ˈl̪ˠaɣəɾ" },
  "lochnagar": { type: "qualifier", meaning: "of the noisy loch", pron: "loch-na-GAR", ipa: "l̪ˠɔxnəˈkaːɾ" },
  "sùileabhainn": { type: "qualifier", meaning: "pillar mountain", pron: "SOOL-iv-en", ipa: "ˈsuːliven" },
  "bùireadh":{ type: "qualifier", meaning: "the bellowing/roaring of stags in rut", pron: "BOO-rugh", ipa: "ˈpuːɾʲəɣ" },

  // ─── Geographic words (Lesson 9) ───
  // These describe features of the landscape — not hills themselves but the
  // surrounding terrain. Each is the lemma form; inflected forms (coire →
  // choire, lochan → lochain, etc.) appear in the hill data via the part's
  // `text` field and inflected meaning via `custom`.
  "coire":   { type: "qualifier", meaning: "corrie, cauldron-shaped hollow", pron: "KORR-uh", ipa: "ˈkʰɔɾə" },
  "lochan":  { type: "qualifier", meaning: "small loch, lochan", pron: "LOCH-an", ipa: "ˈl̪ˠɔxan" },
  "gaoth":   { type: "qualifier", meaning: "wind", pron: "GEU", ipa: "ˈkɯː" },
  "torc":    { type: "qualifier", meaning: "boar", pron: "TORK", ipa: "tʰɔɾk" },
  "cìoch":   { type: "qualifier", meaning: "breast (cone-shape)", pron: "KEE-uch", ipa: "ˈkʰiːəx" },
  "caorann": { type: "qualifier", meaning: "rowan tree", pron: "KEUR-an", ipa: "ˈkɯːɾan̪ˠ" },
  "meagaidh":{ type: "qualifier", meaning: "boggy place", pron: "MEG-ee", ipa: "ˈmɛkiː" },

  // ─── Bràigh: actually a generic (like beinn/aonach) ───
  // Means "upland, high ground". Not in the Lesson 2 secondary grid because
  // the six already there feel like the right selection, but proper-typed
  // so it's tagged correctly in any dissect/quiz views.
  "bràigh":  { type: "generic", shape: "ridge", meaning: "upland, high ground, brae", pron: "bray", ipa: "praːj" },

  // ─── Riabhach: brindled / streaky-grey colour-adjective ───
  // A rarer colour word — describes the patchy mottled look of grass-and-rock
  // upland slopes. Not added to the Lesson 4 colour grid (it's too rare to
  // earn primary teaching) but tagged as a colour so the dissector treats
  // it consistently with bàn / dubh / dearg etc.
  "riabhach": { type: "color", meaning: "brindled, streaky-grey", pron: "REE-uch", ipa: "ˈriəvəx" },

  // ─── Personal names / mythological figures ───
  // Some hills preserve people rather than features. Tagged as qualifier
  // (same role-slot as a descriptive adjective) so the existing parts
  // breakdown handles them without special-casing.
  "alasdair":{ type: "qualifier", meaning: "Alexander", pron: "AL-as-tair", ipa: "ˈalˠəst̪əɾ" },
  "brodan":  { type: "qualifier", meaning: "Brodan (a mythical hound)", pron: "BROHT-an", ipa: "ˈpɾɔht̪an" },
  "coinneach":{ type: "qualifier", meaning: "Kenneth", pron: "KON-yach", ipa: "ˈkʰɔɲəx" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HILLS — curated set of well-known Munros, Corbetts and Fionas.
// `parts` arrays decompose the name; each `root` must match a ROOTS key
// (case-insensitive). Heights in metres.
// ─────────────────────────────────────────────────────────────────────────────

const HILLS = [
  // ─── Iconic Munros ───
  {
    name: "Beinn Nibheis",
    anglicised: "Ben Nevis",
    meaning: "Venomous mountain",
    pron: "BEN NYEH-vish",
    ipa: "peɲ ˈɲevɪʃ",
    parts: [
      { text: "Beinn",   root: "beinn" },
      { text: "Nibheis", root: "nibheis" },
    ],
    classification: "Munro",
    height: 1345,
    region: "Lochaber",
    note: "Britain's highest peak. The name's origin is disputed — possibly from 'neimh' (venomous, malicious) referring to the river.",
  },
  {
    name: "Beinn Mac Duibh",
    anglicised: "Ben Macdui",
    meaning: "MacDuff's mountain",
    pron: "ben mak-DOO-ee",
    ipa: "peɲ məkˈt̪uj",
    parts: [
      { text: "Beinn",    root: "beinn" },
      { text: "Mac Duibh", root: "macduibh" },
    ],
    classification: "Munro",
    height: 1309,
    region: "Cairngorms",
    note: "Second-highest in Britain. Mac Duibh = 'son of the dark one' (Clan MacDuff). 'Mac' doesn't lenite in standard map orthography even after a feminine noun, so it's Beinn Mac Duibh on OS maps — not Beinn Mhac Duibh as a strict reading of the lenition rule would suggest.",
  },
  {
    name: "Càrn Mòr Dearg",
    anglicised: "Carn Mor Dearg",
    meaning: "Big red cairn",
    pron: "karn mor JERR-ak",
    ipa: "kʰaːrˠn moːɾ ˈtʲɛrˠɛk",
    parts: [
      { text: "Càrn",  root: "càrn" },
      { text: "Mòr",   root: "mòr" },
      { text: "Dearg", root: "dearg" },
    ],
    classification: "Munro",
    height: 1220,
    region: "Lochaber",
    note: "Joined to Ben Nevis by the famous CMD arête.",
  },
  {
    name: "Sgùrr nan Gillean",
    anglicised: "Sgurr nan Gillean",
    meaning: "Peak of the young men",
    pron: "skoor nan GIL-yan",
    ipa: "sguːrˠ nən ˈkiʎən",
    parts: [
      { text: "Sgùrr",   root: "sgùrr" },
      { text: "nan",     root: "nan" },
      { text: "Gillean", root: "gillean" },
    ],
    classification: "Munro",
    height: 964,
    region: "Skye — Cuillin",
    note: "The 'Black Cuillin' classic. Possibly named for three sons lost on its slopes.",
  },
  {
    name: "Bidean nam Bian",
    anglicised: "Bidean nam Bian",
    meaning: "Pinnacle of the mountains",
    pron: "BEE-jan nam BEE-an",
    ipa: "ˈpiːtʲan nəm ˈpiən",
    parts: [
      { text: "Bidean", root: "bidean" },
      { text: "nam",    root: "nam" },
      { text: "Bian",   root: "bian" },
    ],
    classification: "Munro",
    height: 1150,
    region: "Glen Coe",
    note: "Highest in Argyll. 'Bian' literally means 'hides/pelts' but here means 'mountains'.",
  },
  {
    name: "Buachaille Eitibhe Mòr",
    anglicised: "Buachaille Etive Mor",
    meaning: "Great herdsman of Etive",
    pron: "BOO-uch-il-yuh ETT-iv mor",
    ipa: "ˈpuəxalʲə ˈɛtʲɪv moːɾ",
    parts: [
      { text: "Buachaille", root: "buachaille" },
      { text: "Eitibhe",    root: "etive" },
      { text: "Mòr",        root: "mòr" },
    ],
    classification: "Munro",
    height: 1022,
    region: "Glen Coe",
    note: "The pyramid sentinel at the head of Glen Etive. Likely Scotland's most photographed hill.",
  },
  {
    name: "Sgùrr Dearg",
    anglicised: "Sgurr Dearg",
    meaning: "Red peak",
    pron: "skoor JERR-ak",
    ipa: "sguːrˠ ˈtʲɛrˠɛk",
    parts: [
      { text: "Sgùrr", root: "sgùrr" },
      { text: "Dearg", root: "dearg" },
    ],
    classification: "Munro",
    height: 986,
    region: "Skye — Cuillin",
    note: "Home of the Inaccessible Pinnacle — Britain's only Munro requiring rock-climbing.",
  },
  {
    name: "Aonach Mòr",
    anglicised: "Aonach Mor",
    meaning: "Big ridge",
    pron: "EUN-ach mor",
    ipa: "ˈɯːnəx moːɾ",
    parts: [
      { text: "Aonach", root: "aonach" },
      { text: "Mòr",    root: "mòr" },
    ],
    classification: "Munro",
    height: 1221,
    region: "Lochaber",
    note: "Confusingly lower than its neighbour Aonach Beag ('small ridge'). Mòr refers to bulk, not height.",
  },
  {
    name: "Aonach Beag",
    anglicised: "Aonach Beag",
    meaning: "Small ridge",
    pron: "EUN-ach bayk",
    ipa: "ˈɯːnəx pek",
    parts: [
      { text: "Aonach", root: "aonach" },
      { text: "Beag",   root: "beag" },
    ],
    classification: "Munro",
    height: 1234,
    region: "Lochaber",
    note: "Slimmer but actually higher than its 'big' twin.",
  },
  {
    name: "Càrn Gorm",
    anglicised: "Cairn Gorm",
    meaning: "Blue cairn",
    pron: "karn GORR-om",
    ipa: "kʰaːrˠn ˈkɔɾɔm",
    parts: [
      { text: "Càrn", root: "càrn" },
      { text: "Gorm", root: "gorm" },
    ],
    classification: "Munro",
    height: 1245,
    region: "Cairngorms",
    note: "Lends its name to the whole range. Gorm covers blue–green; the granite often reads blue at distance.",
  },
  {
    name: "Beinn Dòbhrain",
    anglicised: "Beinn Dorain",
    meaning: "Mountain of the streamlets",
    pron: "BEN DAW-rin",
    ipa: "peɲ ˈt̪ɔːɾɪɲ",
    parts: [
      { text: "Beinn",   root: "beinn" },
      { text: "Dòbhrain", root: "dòrain" },
    ],
    classification: "Munro",
    height: 1076,
    region: "Bridge of Orchy",
    note: "Famous from the bard Duncan Ban MacIntyre's 18th-century poem 'In Praise of Ben Dorain'.",
  },
  {
    name: "Sgùrr Alasdair",
    anglicised: "Sgurr Alasdair",
    meaning: "Alasdair's peak",
    pron: "skoor AL-as-tair",
    ipa: "sguːrˠ ˈalˠəst̪əɾ",
    parts: [
      { text: "Sgùrr",    root: "sgùrr" },
      { text: "Alasdair", root: "alasdair", custom: { meaning: "Alexander (Sheriff Nicolson, 1st ascent 1873)", pron: "AL-as-tair", ipa: "ˈalˠəst̪əɾ" } },
    ],
    classification: "Munro",
    height: 992,
    region: "Skye — Cuillin",
    note: "Highest point on Skye. Named after Alexander Nicolson, who made the first recorded ascent in 1873.",
  },
  {
    name: "Sìth Chailleann",
    anglicised: "Schiehallion",
    meaning: "Fairy hill of the Caledonians",
    pron: "shee KHALL-yun",
    ipa: "ʃiː ˈxal̪ˠʲən",
    parts: [
      { text: "Sìth",      root: "sìth" },
      { text: "Chailleann", root: "chailleann" },
    ],
    classification: "Munro",
    height: 1083,
    region: "Perthshire",
    note: "Used by Maskelyne in 1774 to weigh the Earth — its symmetrical cone made gravitational calculation possible.",
  },

  // ─── Famous Corbetts ───
  {
    name: "Stac Pollaidh",
    anglicised: "Stac Pollaidh",
    meaning: "Peak of the peat-pool",
    pron: "stachk POL-ee",
    ipa: "sdaxg ˈpɔl̪ˠiː",
    parts: [
      { text: "Stac",     root: "stac" },
      { text: "Pollaidh", root: "pollaidh" },
    ],
    classification: "Corbett",
    height: 613,
    region: "Assynt",
    note: "Tiny but iconic. The summit ridge is a series of weathered sandstone pinnacles.",
  },
  {
    name: "An Teallach",
    anglicised: "An Teallach",
    meaning: "The forge",
    pron: "an TYAL-uch",
    ipa: "ən ˈtʲal̪ˠəx",
    parts: [
      { text: "An",       root: "an" },
      { text: "Teallach", root: "teallach" },
    ],
    classification: "Munro",
    height: 1062,
    region: "Wester Ross",
    note: "Named for the way mist forms in its corries like smoke from a smithy's forge.",
  },
  {
    name: "Liathach",
    anglicised: "Liathach",
    meaning: "The grey one",
    pron: "LEE-uh-gukh",
    ipa: "ˈʎiəxax",
    parts: [
      { text: "Liathach", root: "liath", custom: { meaning: "grey one (substantivised)", pron: "LEE-uh-gukh", ipa: "ˈʎiəxax" } },
    ],
    classification: "Munro",
    height: 1055,
    region: "Torridon",
    note: "Liath ('grey') with the -ach suffix turns it into 'the grey one'. Massive quartzite-capped sandstone ridge.",
  },
  {
    name: "Sùilebheinn",
    anglicised: "Suilven",
    meaning: "Pillar mountain",
    pron: "SOOL-iv-en",
    ipa: "ˈsuːliven",
    parts: [
      { text: "Sùilebheinn", root: "sùileabhainn" },
    ],
    classification: "Fiona",
    height: 731,
    region: "Assynt",
    note: "From Norse 'súla' (pillar) + Gaelic 'bheinn'. The most distinctive hill in Britain — a 700m wall rising from peat bog.",
  },
  {
    name: "Cùl Mòr",
    anglicised: "Cul Mor",
    meaning: "Big back",
    pron: "kool mor",
    ipa: "kʰuːl̪ˠ moːɾ",
    parts: [
      { text: "Cùl", root: "cùl" },
      { text: "Mòr", root: "mòr" },
    ],
    classification: "Corbett",
    height: 849,
    region: "Assynt",
    note: "The 'back' of a hill — what you see from the populated side.",
  },
  {
    name: "Beinn Eighe",
    anglicised: "Beinn Eighe",
    meaning: "File mountain (notched)",
    pron: "BEN AY-yuh",
    ipa: "peɲ ˈejə",
    parts: [
      { text: "Beinn", root: "beinn" },
      { text: "Eighe", root: "eighe" },
    ],
    classification: "Munro",
    height: 1010,
    region: "Torridon",
    note: "Named for its serrated quartzite ridge, like the teeth of a file.",
  },
  {
    name: "Ladhar Bheinn",
    anglicised: "Ladhar Bheinn",
    meaning: "Hoof mountain",
    pron: "LAA-ar VEN",
    ipa: "ˈl̪ˠaɣəɾ veɲ",
    parts: [
      { text: "Ladhar",  root: "ladhar" },
      { text: "Bheinn",  root: "beinn", lenited: true },
    ],
    classification: "Munro",
    height: 1020,
    region: "Knoydart",
    note: "Britain's remotest Munro. The 'bh' is pronounced 'v' — classic lenition after a feminine noun.",
  },
  {
    name: "Lochnagar",
    anglicised: "Lochnagar",
    meaning: "Loch of the noise (mountain)",
    pron: "loch-na-GAR",
    ipa: "l̪ˠɔxnəˈkaːɾ",
    parts: [
      { text: "Lochnagar", root: "lochnagar" },
    ],
    classification: "Munro",
    height: 1156,
    region: "Cairngorms",
    note: "Named after the loch in its corrie, not the hill itself — the corrie was said to roar in storms. The traditional native Gaelic name for the actual mountain massif is Beinn Chìochan ('hill of breasts/paps'); 'Lochnagar' was transferred from the loch to the summit by English speakers and stuck.",
  },
  {
    name: "Meall a' Bhùiridh",
    anglicised: "Meall a' Bhuiridh",
    meaning: "Hill of the bellowing (rut)",
    pron: "myowl uh VOO-ree",
    ipa: "mʲaul̪ˠ ə ˈvuːɾiː",
    parts: [
      { text: "Meall",    root: "meall" },
      { text: "a'",       root: "a'" },
      { text: "Bhùiridh", root: "bùireadh", custom: { meaning: "bellowing of stags in rut", pron: "VOO-ree", ipa: "ˈvuːɾiː" }, lenited: true },
    ],
    classification: "Munro",
    height: 1108,
    region: "Glen Coe",
    note: "The 'bh' silences to 'v' after the article a'. Stag-rut country — bùireadh is the deep autumn roar of red stags. OS maps often print without the grave accent.",
  },
  {
    name: "Stob Dearg",
    anglicised: "Stob Dearg",
    meaning: "Red peak",
    pron: "stob JERR-ak",
    ipa: "sd̥ɔp ˈtʲɛrˠɛk",
    parts: [
      { text: "Stob",  root: "stob" },
      { text: "Dearg", root: "dearg" },
    ],
    classification: "Munro",
    height: 1022,
    region: "Glen Coe",
    note: "Highest top of Buachaille Etive Mòr. The reddish rhyolite gives it its name.",
  },
  {
    name: "Càrn Bàn",
    anglicised: "Carn Ban",
    meaning: "White cairn",
    pron: "karn bahn",
    ipa: "kʰaːrˠn paːn",
    parts: [
      { text: "Càrn", root: "càrn" },
      { text: "Bàn",  root: "bàn" },
    ],
    classification: "Munro",
    height: 845,
    region: "Monadhliath",
    note: "Pale quartzite cap; the name describes the colour you see from below.",
  },
  {
    name: "Meall Buidhe",
    anglicised: "Meall Buidhe",
    meaning: "Yellow hill",
    pron: "myowl BOO-yuh",
    ipa: "mʲaul̪ˠ ˈpujə",
    parts: [
      { text: "Meall",  root: "meall" },
      { text: "Buidhe", root: "buidhe" },
    ],
    classification: "Munro",
    height: 932,
    region: "Glen Lyon",
    note: "Yellow-tinged moor grass on the summit dome — visible from miles off in autumn.",
  },
  {
    name: "Beinn Dubh",
    anglicised: "Beinn Dubh",
    meaning: "Black mountain",
    pron: "BEN doo",
    ipa: "peɲ t̪uh",
    parts: [
      { text: "Beinn", root: "beinn" },
      { text: "Dubh",  root: "dubh" },
    ],
    classification: "Fiona",
    height: 642,
    region: "Loch Lomond",
    note: "Dark heather and crag — many Beinn Dubhs exist; this one above Luss is most accessible. A reader who knows the lenition rule might expect 'Beinn Dhubh' (since beinn is feminine), but the historic homo-organic rule blocks lenition of 'd' or 't' after a noun ending in 'n'. The rule has decayed in modern speech but survives in established place names like this one and Beinn Dearg.",
  },
  {
    name: "Sgòr Gaoith",
    anglicised: "Sgor Gaoith",
    meaning: "Peak of the wind",
    pron: "skor GEU-ee",
    ipa: "sgɔːrˠ ˈkɯːi",
    parts: [
      { text: "Sgòr",  root: "sgòr" },
      { text: "Gaoith", root: "gaoth", custom: { meaning: "of the wind", pron: "GEU-ee", ipa: "ˈkɯːi" } },
    ],
    classification: "Munro",
    height: 1118,
    region: "Cairngorms",
    note: "Stands above Loch Einich — exposed to the prevailing westerlies.",
  },
  {
    name: "Beinn Bhàn",
    anglicised: "Beinn Bhan",
    meaning: "White mountain",
    pron: "BEN vahn",
    ipa: "peɲ vaːn",
    parts: [
      { text: "Beinn", root: "beinn" },
      { text: "Bhàn",  root: "bàn", lenited: true },
    ],
    classification: "Corbett",
    height: 896,
    region: "Applecross",
    note: "'Bàn' (white) lenites to 'bhàn' (pronounced 'vahn') after the feminine noun Beinn.",
  },
  {
    name: "Stob Coire nan Lochan",
    anglicised: "Stob Coire nan Lochan",
    meaning: "Peak of the corrie of the lochans",
    pron: "stob KORR-uh nan LOCH-an",
    ipa: "sd̥ɔp ˈkʰɔɾə nən ˈl̪ˠɔxan",
    parts: [
      { text: "Stob",    root: "stob" },
      { text: "Coire",   root: "coire", custom: { meaning: "corrie (cauldron-shaped hollow)", pron: "KORR-uh", ipa: "ˈkʰɔɾə" } },
      { text: "nan",     root: "nan" },
      { text: "Lochan",  root: "lochan", custom: { meaning: "small lochs (lochans)", pron: "LOCH-an", ipa: "ˈl̪ˠɔxan" } },
    ],
    classification: "Munro Top",
    height: 1115,
    region: "Glen Coe",
    note: "A textbook 4-part hill name: generic + qualifier + article + qualifier.",
  },
  {
    name: "Càrn an Tuirc",
    anglicised: "Carn an Tuirc",
    meaning: "Cairn of the boar",
    pron: "karn an TOORK",
    ipa: "kʰaːrˠn ən tʰuːɾʲk",
    parts: [
      { text: "Càrn",  root: "càrn" },
      { text: "an",    root: "an" },
      { text: "Tuirc", root: "torc", custom: { meaning: "of the boar", pron: "TOORK", ipa: "tʰuːɾʲk" } },
    ],
    classification: "Munro",
    height: 1019,
    region: "Glen Shee",
    note: "Wild boar were extinct in Scotland by the 17th century; the name remembers them.",
  },
  {
    name: "Bràigh Riabhach",
    anglicised: "Braeriach",
    meaning: "Brindled upland",
    pron: "bray REE-uch",
    ipa: "praːj ˈriəvəx",
    parts: [
      { text: "Bràigh",   root: "bràigh", custom: { meaning: "upland, high ground", pron: "bray", ipa: "praːj" } },
      { text: "Riabhach", root: "riabhach", custom: { meaning: "brindled, streaky-grey", pron: "REE-uch", ipa: "ˈriəvəx" } },
    ],
    classification: "Munro",
    height: 1296,
    region: "Cairngorms",
    note: "3rd-highest in Britain. The plateau is streaked with snow late into summer — hence 'brindled'.",
  },
  {
    name: "Sgùrr na Cìche",
    anglicised: "Sgurr na Ciche",
    meaning: "Peak of the breast",
    pron: "skoor na KEE-khuh",
    ipa: "sguːrˠ nə ˈkʰiːçə",
    parts: [
      { text: "Sgùrr", root: "sgùrr" },
      { text: "na",    root: "na" },
      { text: "Cìche", root: "cìoch", custom: { meaning: "of the breast (cone-shape)", pron: "KEE-khuh", ipa: "ˈkʰiːçə" } },
    ],
    classification: "Munro",
    height: 1040,
    region: "Knoydart",
    note: "Perfect cone from the south. The 'ch' here is the soft 'ç' (slender) — like 'huge'.",
  },
  {
    name: "Beinn Bhrotain",
    anglicised: "Beinn Bhrotain",
    meaning: "Mountain of the mastiff",
    pron: "ben VROHT-an",
    ipa: "peɲ ˈvɾɔht̪an",
    parts: [
      { text: "Beinn",    root: "beinn" },
      { text: "Bhrotain", root: "brodan", custom: { meaning: "of Brodan, a mythical hound", pron: "VROHT-an", ipa: "ˈvɾɔht̪an" }, lenited: true },
    ],
    classification: "Munro",
    height: 1157,
    region: "Cairngorms",
    note: "Bhrotain — the 'b' lenites to 'v'. Brodan was a legendary hound of the Fianna.",
  },
  {
    name: "Sàil Chaorainn",
    anglicised: "Sail Chaorainn",
    meaning: "Heel of the rowan",
    pron: "sahl KHEUR-an",
    ipa: "sal̪ˠ ˈxɯːɾɪɲ",
    parts: [
      { text: "Sàil",     root: "sàil" },
      { text: "Chaorainn", root: "caorann", custom: { meaning: "of the rowan tree", pron: "KHEUR-an", ipa: "ˈxɯːɾɪɲ" }, lenited: true },
    ],
    classification: "Munro",
    height: 1002,
    region: "Glen Affric",
    note: "Caorann (rowan) lenites to chaorainn after sàil — the 'c' becomes the loch-ch sound.",
  },
  {
    name: "Creag Meagaidh",
    anglicised: "Creag Meagaidh",
    meaning: "Bogland crag",
    pron: "krayk MEG-ee",
    ipa: "kʰɾʲek ˈmɛkiː",
    parts: [
      { text: "Creag",   root: "creag" },
      { text: "Meagaidh", root: "meagaidh", custom: { meaning: "boggy place", pron: "MEG-ee", ipa: "ˈmɛkiː" } },
    ],
    classification: "Munro",
    height: 1130,
    region: "Lochaber",
    note: "Vast plateau hill with the dramatic Coire Ardair on its NE flank.",
  },
  {
    name: "Binnein Mòr",
    anglicised: "Binnein Mor",
    meaning: "Big peak",
    pron: "BIN-yan mor",
    ipa: "ˈpiɲɛɲ moːɾ",
    parts: [
      { text: "Binnein", root: "binnein" },
      { text: "Mòr",     root: "mòr" },
    ],
    classification: "Munro",
    height: 1130,
    region: "Mamores",
    note: "Highest of the Mamores. Diminutive 'binnein' is small-peak — but this one is big.",
  },
  {
    name: "Sròn a' Choire Ghairbh",
    anglicised: "Sron a' Choire Ghairbh",
    meaning: "Nose of the rough corrie",
    pron: "strawn uh KHORR-uh GHARR-iv",
    ipa: "s̪t̪ɾɔːn ə ˈxɔɾə ˈɣaɾav",
    parts: [
      { text: "Sròn",   root: "sròn" },
      { text: "a'",     root: "a'" },
      { text: "Choire", root: "coire", custom: { meaning: "of the corrie", pron: "KHORR-uh", ipa: "ˈxɔɾə" }, lenited: true },
      { text: "Ghairbh", root: "garbh", custom: { meaning: "rough (lenited)", pron: "GHARR-iv", ipa: "ˈɣaɾav" }, lenited: true },
    ],
    classification: "Munro",
    height: 937,
    region: "Loch Lochy",
    note: "Cascade of lenitions: a' Choire (the corrie) Ghairbh (rough → vrough). Classic Gaelic at work.",
  },

  // ─── Added to fill lesson-coverage gaps ─────────────────────────────
  // Three hills picked specifically to give the dissector a real example
  // of vocabulary the lessons teach but that the original 37 hills don't
  // demonstrate: Cnoc Coinnich (Lesson 7 cn-shift), Geal-chàrn (Lesson 4
  // geal colour + the unusual adjective-first construction), Beinn Ghlas
  // (Lesson 4 glas colour + Lesson 5 lenited form).

  {
    name: "Cnoc Coinnich",
    anglicised: "Cnoc Coinnich",
    meaning: "Kenneth's knoll",
    pron: "krochk KON-yich",
    ipa: "kɾɔxg ˈkʰɔɲɪç",
    parts: [
      { text: "Cnoc",     root: "cnoc" },
      { text: "Coinnich", root: "coinneach", custom: { meaning: "of Kenneth", pron: "KON-yich", ipa: "ˈkʰɔɲɪç" } },
    ],
    classification: "Corbett",
    height: 847,
    region: "Arrochar",
    note: "A Corbett at the head of Loch Goil — and the cn- in the name is the textbook example of the rhotacism rule from Lesson 7. Spelled Cnoc, sounds 'krochk'.",
  },

  {
    name: "Geal-chàrn",
    anglicised: "Geal Charn",
    meaning: "White cairn",
    pron: "GYAL KHARN",
    ipa: "kʲal̪ˠ xaːrˠn",
    parts: [
      { text: "Geal",   root: "geal" },
      { text: "chàrn",  root: "càrn", custom: { meaning: "cairn (lenited)", pron: "KHARN", ipa: "xaːrˠn" }, lenited: true },
    ],
    classification: "Munro",
    height: 917,
    region: "Drumochter",
    note: "Unusual word order: the adjective (geal) comes before the generic (chàrn), and it's the generic that's lenited — opposite of the Lesson 5 pattern. Four other Munros share this name; the Drumochter Geal-chàrn is the one most often climbed from the A9.",
  },

  {
    name: "Beinn Ghlas",
    anglicised: "Beinn Ghlas",
    meaning: "Grey-green mountain",
    pron: "behn GHLASS",
    ipa: "peiɲ ɣl̪ˠas̪",
    parts: [
      { text: "Beinn", root: "beinn" },
      { text: "Ghlas", root: "glas", custom: { meaning: "grey-green (lenited)", pron: "GHLASS", ipa: "ɣl̪ˠas̪" }, lenited: true },
    ],
    classification: "Munro",
    height: 1103,
    region: "Ben Lawers",
    note: "On the main ridge to Ben Lawers — most walkers pass over its summit on the way. Glas → Ghlas is textbook Lesson 5 lenition: beinn is feminine, so the adjective gains its h.",
  },
];

window.HILLS = HILLS;
window.ROOTS = ROOTS;
