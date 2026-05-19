// tour.jsx
// Guided tour — a finishable, linear walk through Gaelic hill-name patterns.
// Replaces "search the field guide" as the front door for new learners.
//
// Architecture: LESSONS is a data array. The <Lesson> component renders any
// entry from it. Adding lessons 2–10 means filling in LESSONS, not writing
// new components.
//
// Each lesson references hills by their `name` field in window.HILLS, so the
// data stays in one place and HillSilhouette renders the visuals consistently
// with the rest of the app.

// ── Helper: look up a hill by Gaelic name ──────────────────────────────
function findHill(name) {
  const h = window.HILLS.find(x => x.name === name);
  if (!h) console.warn(`Tour: hill not found in HILLS: "${name}"`);
  return h;
}

// ── Helper: build the parts breakdown for a hill, used by examples and
//    by the try-it reveal. Each part has the role (generic vs article vs
//    qualifier) derived from its root's `type`. We tolerate roots not being
//    found in ROOTS so a malformed hill doesn't crash the tour.
function partsBreakdown(hill) {
  if (!hill) return [];
  return hill.parts.map(p => {
    const root = window.ROOTS[p.root] || {};
    // The "role" is what we show as the slot label. Three roles:
    //   - generic: the kind of hill (beinn, càrn, sgùrr, meall…)
    //   - article: the linking word (a', an, na, nan, nam…) — Lesson 8
    //   - qualifier: everything else, including nouns and adjectives
    // The article role is essential for Lesson 8; earlier lessons don't
    // use hills with articles so they're unaffected.
    let role;
    if (root.type === "generic") role = "generic";
    else if (root.type === "article") role = "article";
    else role = "qualifier";
    // Use the inline `custom` override if the hill provides one (e.g.
    // for tricky lenited forms where the root's meaning isn't quite right).
    const meaning = p.custom?.meaning || root.meaning || "";
    const pron    = p.custom?.pron    || root.pron    || "";
    return { text: p.text, role, meaning, pron, lenited: !!p.lenited };
  });
}

// ── LESSONS data array ────────────────────────────────────────────────
// Each lesson: { num, title, promise, examples, tryIt, recap }
//   examples: array of hill names (looked up in HILLS)
//   tryIt: { hill, prompt, feedback }
//   recap: array of paragraphs (HTML-safe strings, can include <em>, <strong>, <code>)
const LESSONS = [
  // ─── Lesson 1 ───────────────────────────────────────────────────────
  {
    num: 1,
    title: "The shape of a hill name",
    promise: <>
      <p>
        Scottish hill names look intimidating on a map. <em>Sgùrr nan
        Gillean. Stob Coire Sgreamhach. Beinn a' Bheithir.</em> Long words,
        accented vowels, consonant clusters that don't follow English rules.
        But almost every name is built from a small set of pieces, and once
        you see them you start reading the landscape: <em>Càrn Mòr Dearg</em>
        is just "big red cairn", and now the name is telling you what the
        hill looks like.
      </p>
      <p>
        Every Scottish hill name is built from two pieces: a{" "}
        <em>generic</em> (what kind of hill it is) and a <em>qualifier</em>{" "}
        (which one). Once you see the pattern, you can read names you've
        never met.
      </p>
    </>,
    examples: ["Beinn Dubh", "Càrn Bàn", "Sgùrr Dearg"],
    tryIt: {
      hillName: "Beinn Bhàn",
      prompt: <>
        <strong>Beinn Bhàn.</strong> You've just seen <em>beinn</em> and you've
        seen <em>bàn</em>. Can you guess what kind of hill this is before you tap?
      </>,
      feedback: <>
        A white mountain. You already had the pieces — <em>beinn</em> from the
        first example, <em>bàn</em> from the second. The only surprise:{" "}
        <em>b</em> became <em>bh</em>, and the sound changed from "b" to "v".
        That's called <strong>lenition</strong>, and you'll meet it properly in
        Lesson 5.
      </>,
    },
  },

  // ─── Lesson 2 ───────────────────────────────────────────────────────
  // The shape-of-the-hill lesson. Four primary generics fully worked out, plus
  // a secondary-generics reference grid showing six more words the user will
  // genuinely meet in the 36 hills (and in the wild). Same primary+rarer split
  // as Lesson 4's colour grid — top tier to memorise, second tier to recognise.
  //
  // Why six secondary and not more: each one appears in the data, has a
  // distinct shape, and is a name most hillwalkers actually encounter. We
  // exclude generics that are too obscure (sìth, sàil) or whose use overlaps
  // with the primary four (mullach with càrn).
  {
    num: 2,
    title: "The big four generics",
    promise: <>
      Four words cover most Scottish hill names: <em>beinn, càrn, sgùrr,
      meall</em>. Each describes a different <em>shape</em> of hill — a
      classic mountain, a stony heap, a sharp rocky peak, a rounded dome.
      Learn these four and a handful of secondary words and you can read 7
      out of 10 names on an OS map.
    </>,
    examples: ["Beinn Nibheis", "Càrn Gorm", "Sgùrr Alasdair", "Meall Buidhe"],
    genericsGrid: {
      label: "Secondary generics you'll meet",
      caption: <>
        Six more words for "kind of hill" — they fill the same grammatical
        slot as beinn/càrn/sgùrr/meall, but describe slightly different
        shapes. Don't memorise these; just learn to recognise them when
        they appear.
      </>,
      rows: [
        { word: "aonach", pron: "EUN-ach", shape: "ridge",
          meaning: "a long, level ridge — walking-pace ground on top",
          example: "Aonach Mòr" },
        { word: "stob",   pron: "stob",    shape: "stub",
          meaning: "a stubby point — often a subsidiary peak on a ridge",
          example: "Stob Dearg" },
        { word: "sgòr",   pron: "skor",    shape: "sharp",
          meaning: "a sharp peak (a variant spelling of sgùrr)",
          example: "Sgòr Gaoith" },
        { word: "bidean", pron: "BEE-jan", shape: "pinnacle",
          meaning: "a sharp pinnacle, the rocky top of a ridge",
          example: "Bidean nam Bian" },
        { word: "stac",   pron: "stachk",  shape: "pinnacle",
          meaning: "a steep rocky stack, sometimes a sea-stack inland",
          example: "Stac Pollaidh" },
        { word: "creag",  pron: "krayk",   shape: "crag",
          meaning: "a crag or cliff — usually a big rock face",
          example: "Creag Meagaidh" },
      ],
    },
    tryIt: {
      mode: "predict",
      prompt: <>
        Without scrolling back, what shape would you expect <em>Aonach Mòr</em>{" "}
        to be? <em>Aonach</em> means "ridge" — a long, level, walking-pace
        top.
      </>,
      options: [
        { label: "A sharp peak (like Sgùrr Alasdair)",        correct: false },
        { label: "A long flat ridge",                          correct: true  },
        { label: "A rounded dome (like Meall Buidhe)",         correct: false },
      ],
      reveal: <>
        Right. <em>Aonach</em> describes a long, flat-topped shape — same
        slot as the big four, different shape. Once you've installed the
        primary generics, secondary ones like aonach, stob, and bidean slot
        in easily.
      </>,
      wrongReveal: <>
        Actually no — <em>aonach</em> means "ridge". The word literally
        describes a long, flat-topped shape. Once you've installed the big
        four, secondary generics like aonach, stob, and bidean follow the
        same role pattern — different shape, same slot.
      </>,
    },
  },

  // ─── Lesson 3 ───────────────────────────────────────────────────────
  // Pronunciation lesson. Two ideas: (1) stress goes on the first syllable
  // of each content word, (2) articles like "an" and "a'" don't get the
  // stress — it skips past them to the noun. Most beginner mistakes come
  // from stressing the article.
  {
    num: 3,
    title: "Stress and how to say it",
    promise: <>
      Gaelic stress is more regular than English: <em>first syllable of every
      content word</em>. The catch: small words like <em>an</em>, <em>a'</em>,{" "}
      <em>na</em> don't count — stress hops past them to the next real word.
    </>,
    examples: ["Sgùrr Dearg", "Aonach Mòr", "Càrn Bàn"],
    rule: {
      label: "The stress rule, in two parts",
      body: <>
        <p>
          <strong>Part one:</strong> in any Gaelic word, the stress is on the{" "}
          <em>first syllable</em>. Always. Almost without exception.
          <em>SGÙRR</em>, <em>BEIN</em>-yan, <em>AON</em>-ach, <em>MEALL</em>.
        </p>
        <p>
          <strong>Part two:</strong> when a name has an article — <em>an</em>{" "}
          (the), <em>a'</em> (of the), <em>na</em>, <em>nam</em>, <em>nan</em>{" "}
          — the article is unstressed. Stress jumps past it to the next
          content word. So it's <em>an TEALL-ach</em>, not <em>AN teallach</em>.
        </p>
      </>,
    },
    tryIt: {
      mode: "predict",
      prompt: <>
        Where does the stress fall in <em>Meall a' Bhùiridh</em> ("hill of the
        bellowing of stags")?
      </>,
      options: [
        { label: "MEALL a' bhùiridh — first syllable of the whole name",        correct: false },
        { label: "MEALL a' BHÙIR-idh — first syllable of each content word",     correct: true  },
        { label: "meall A' bhùir-IDH — last syllable, like French",              correct: false },
      ],
      reveal: <>
        Right — <strong>MEALL a' BHÙIR-idh</strong>. Two content words
        (<em>meall</em> and <em>bhùiridh</em>), one little connector
        (<em>a'</em>). Stress lands on the first syllable of each content
        word; the connector is unstressed.
      </>,
      wrongReveal: <>
        Actually it's <strong>MEALL a' BHÙIR-idh</strong>. Two stresses, one
        on each content word's first syllable; the <em>a'</em> is unstressed
        and slides past. If you ever land on the final syllable in Gaelic,
        you're almost certainly wrong.
      </>,
    },
  },

  // ─── Lesson 4 ───────────────────────────────────────────────────────
  // The vocabulary-payoff lesson. Five colour adjectives is enough to read
  // most colour-named hills on a Scottish map. We show the colour itself as
  // a swatch (using the data.js hex values where available), then three
  // worked examples that combine colours with the generics from Lesson 2.
  //
  // One real example uses a lenited colour (Beinn Bhàn) — we flag this and
  // explicitly defer the explanation to Lesson 5. That tension is the hook
  // for the next lesson.
  {
    num: 4,
    title: "Colour adjectives",
    promise: <>
      A handful of colour words covers most adjectives you'll see in Scottish
      hill names. Learn the top five (<em>dubh, bàn, dearg, ruadh, gorm</em>)
      and you can decode most colour-named hills at a glance; meet the rarer
      six (<em>geal, buidhe, glas, liath, uaine, odhar</em>) as they come up
      on the map.
    </>,
    colourGrid: {
      label: "The colour vocabulary",
      caption: <>
        Eleven colour words. The first five are the workhorses — you'll see
        them on most colour-named hills. The rest are more specialised, but
        worth knowing when you meet them. <em>Gorm</em> drifts between blue
        and green, and <em>ruadh</em> describes the rusty-red of heather and
        deer, not pillar-box red.
      </>,
      rows: [
        // The five workhorses — Munro/Corbett names use these constantly.
        // Hex values pulled from ROOTS in data.js so they stay in sync.
        { word: "dubh",  pron: "doo",       meaning: "black, dark",            hex: "#2a2a2e" },
        { word: "bàn",   pron: "bahn",      meaning: "white, fair",            hex: "#e8e2d6" },
        { word: "dearg", pron: "JERR-ak",   meaning: "red (bright)",           hex: "#b14a3c" },
        { word: "ruadh", pron: "ROO-ugh",   meaning: "russet, red-brown",      hex: "#a86a3d" },
        { word: "gorm",  pron: "GORR-om",   meaning: "blue, green-blue",       hex: "#4a6a82" },
        // Visual divider — common vs rarer split.
        { divider: true, label: "Rarer, but you'll meet them" },
        // The six rarer colours.
        { word: "geal",  pron: "gyal",      meaning: "bright, brilliant white", hex: "#f1ede2" },
        { word: "buidhe",pron: "BOO-yuh",   meaning: "yellow",                  hex: "#c79b3a" },
        { word: "glas",  pron: "glass",     meaning: "grey-green",              hex: "#7a8a6e" },
        { word: "liath", pron: "LEE-uh",    meaning: "grey",                    hex: "#9aa0a2" },
        { word: "uaine", pron: "OO-an-yuh", meaning: "green (vivid)",           hex: "#5a7a52" },
        { word: "odhar", pron: "OH-ur",     meaning: "dun, dappled",            hex: "#8a7858" },
      ],
    },
    examples: ["Càrn Gorm", "Stob Dearg", "Beinn Bhàn"],
    tryIt: {
      mode: "reveal",
      hillName: "Càrn Mòr Dearg",
      prompt: <>
        <strong>Càrn Mòr Dearg.</strong> Three words this time. You already
        know <em>càrn</em> and you've just met <em>dearg</em>.{" "}
        <em>Mòr</em> means big. Can you piece the whole name together before
        revealing?
      </>,
      feedback: <>
        "Big red cairn" — generic + size + colour, in that order. The pattern
        scales: even three-word and four-word names just stack qualifiers on
        the same skeleton. By now you can probably read half the Munros on
        the Cairngorms map.
      </>,
    },
    recap: [
      <>
        You now have eleven colours and four+ generics. That's enough
        vocabulary to read most colour-named hills:{" "}
        <em>Càrn Dearg, Stob Bàn, Aonach Dubh, Meall Ruadh, Beinn Liath</em>.
        Don't try to memorise all eleven at once — start with the top five and
        let the rarer ones stick as you meet them in real names.
      </>,
      <>
        One thing the colour words are really describing: the rock, or how
        the slope looks in particular conditions. <em>Dearg</em> ("red")
        usually means reddish granite or sandstone. <em>Liath</em>{" "}
        ("grey") is grey schist or the look of a hill in mist.{" "}
        <em>Dubh</em> ("black") often means dark rock or shadowed crag
        rather than a literally black hillside, and <em>ruadh</em> is the
        russet brown of dead heather and red deer rather than bright red.
        The names are descriptions written by people who lived in this
        landscape and knew it by sight.
      </>,
      <>
        One thing you might have noticed in the third example: <em>Beinn
        Bhàn</em> uses <em>bhàn</em>, not <em>bàn</em>. Same word, different
        shape. That's the cliffhanger from Lesson 1, and Lesson 5 finally
        explains it.
      </>,
    ],
  },

  // ─── Lesson 5 ───────────────────────────────────────────────────────
  // The pedagogically hardest lesson in the sequence — first time the user
  // sees that the SAME word looks and sounds different depending on what
  // comes before it. Uses a comparison layout (not three sequential examples)
  // because lenition only registers as a pattern when you see the two forms
  // side by side.
  //
  // Data constraint worth knowing: our 36-hill set has only one clean
  // beinn-plus-lenited-colour example (Beinn Bhàn). So the second teaching
  // pair generalises via a mutation grid rather than another real hill,
  // which is actually more honest — the rule operates on adjectives in
  // general, not on specific named hills.
  {
    num: 5,
    title: "When letters disappear",
    promise: <>
      Sometimes the same word looks different depending on what comes before
      it. There's a pattern — and once you see it, you'll read{" "}
      <em>twice as many</em> Gaelic words without learning a single new one.
    </>,
    compare: {
      label: "Spot the difference",
      pair: ["Càrn Bàn", "Beinn Bhàn"],
      caption: <>
        Same adjective. Different first letter. The <em>b</em> on the left
        gained an <em>h</em> on the right — and the sound shifted from "b" to
        "v". This isn't a different word; it's the same word, softened.
      </>,
    },
    rule: {
      label: "The rule",
      body: <>
        <p>
          When a feminine noun is followed by an adjective, the adjective{" "}
          <strong>lenites</strong> if it can — gaining a silent <em>h</em>{" "}
          after its first letter, which softens the sound.
        </p>
        <p>
          <em>Beinn</em> (mountain) is feminine. <em>Càrn</em> (cairn) is
          masculine. That's the whole reason for the difference above. Same
          adjective, two grammatical worlds.
        </p>
      </>,
    },
    mutationGrid: {
      label: "What lenition does to common sounds",
      caption: <>
        After <em>beinn</em> (or any feminine noun), these are the changes
        you'll see most often:
      </>,
      rows: [
        { unlenited: "bàn",  lenited: "bhàn",  meaning: "white",        soundUn: "bahn",  soundLen: "vahn"  },
        { unlenited: "mòr",  lenited: "mhòr",  meaning: "big",          soundUn: "more",  soundLen: "vore"  },
        { unlenited: "dubh", lenited: "dhubh", meaning: "black",        soundUn: "doo",   soundLen: "ghoo"  },
        { unlenited: "gorm", lenited: "ghorm", meaning: "blue / green", soundUn: "gorom", soundLen: "ghorom"},
      ],
    },
    tryIt: {
      // Sgùrr is masculine, so no lenition. The user has to apply the rule
      // backwards: "lenition fires after feminine; sgùrr isn't feminine; so
      // bàn stays bàn." This is the test of whether they've internalised the
      // direction of the rule.
      mode: "predict",
      prompt: <>
        Here's <em>Sgùrr</em> (sharp peak — masculine) plus <em>bàn</em> (white).
        Does the rule fire? Will the adjective change shape?
      </>,
      options: [
        { label: "Sgùrr Bhàn (lenited)",   correct: false },
        { label: "Sgùrr Bàn (unchanged)",  correct: true  },
      ],
      reveal: <>
        Right — <strong>Sgùrr Bàn</strong>. Lenition only fires after a feminine
        noun, and <em>sgùrr</em> is masculine. The adjective stays as it is.
      </>,
      wrongReveal: <>
        Actually no — <strong>Sgùrr Bàn</strong>. Lenition only fires after a{" "}
        <em>feminine</em> noun. <em>Sgùrr</em> is masculine, so the rule
        doesn't trigger and <em>bàn</em> stays unchanged.
      </>,
      cliffhanger: <>
        One last thing before you go: in Lesson 1 you saw <em>Beinn Dubh</em> —
        beinn is feminine, dubh starts with a lenitable letter, but it{" "}
        <em>doesn't</em> get an h. Why? Lesson 6 explains the one exception
        that proves the rule.
      </>,
    },
  },

  // ─── Lesson 6 ───────────────────────────────────────────────────────
  // Reuses Lesson 5's compare + rule primitives. The pedagogical move: show
  // two hills that both look like they should lenite (both feminine, both
  // adjective with lenitable initial), but only one actually does. The
  // exception (homo-organic dental block) is patterned, not random — that's
  // the lesson's insight.
  //
  // Worth knowing: linguists call this "homorganic" because d/t/s/l/n are
  // produced at the same place in the mouth as the preceding n in beinn,
  // and the cluster naturally resists lenition. But for the user that detail
  // is overkill — they just need to know the rule fires for some letters
  // and not others, and to recognise the pattern in the wild.
  {
    num: 6,
    title: "The exception that proves the rule",
    promise: <>
      Lesson 5 said feminine + adjective = lenition. But you've already met
      a hill — <em>Beinn Dubh</em> — where it didn't fire. This lesson is
      the one exception, and the small set of letters it covers.
    </>,
    compare: {
      label: "What changed, what didn't",
      pair: ["Beinn Bhàn", "Beinn Dubh"],
      caption: <>
        Both feminine (beinn). Both adjectives start with letters that can
        lenite (b → bh, d → dh). But <em>bhàn</em> gained the h and
        <em> dubh</em> didn't. The rule is the same; the trigger isn't.
      </>,
    },
    rule: {
      label: "The exception",
      body: <>
        <p>
          When a noun ending in <strong>n</strong> (like <em>beinn</em>) is
          followed by an adjective starting with <strong>d, t, s, l</strong>{" "}
          or <strong>n</strong>, lenition <em>doesn't fire</em> — even
          though the Lesson 5 rule would predict it.
        </p>
        <p>
          Why? The letters d, t, s, l, n are all made with the tongue in the
          same place in the mouth as the n at the end of beinn. The mouth
          resists going through a lenition shape and back. So:{" "}
          <em>Beinn Bhàn</em> (b lenites — different mouth shape),{" "}
          <em>Beinn Dubh</em> (d doesn't — same mouth shape).
        </p>
      </>,
    },
    tryIt: {
      mode: "predict",
      prompt: <>
        Imagine you meet a hill called <em>Beinn Dearg</em> ("red mountain").
        Would the adjective lenite or stay as it is?
      </>,
      options: [
        { label: "Beinn Dhearg — d lenites to dh",                  correct: false },
        { label: "Beinn Dearg — d stays unchanged",                  correct: true  },
        { label: "Depends — sometimes lenites, sometimes doesn't",    correct: false },
      ],
      reveal: <>
        Right — <strong>Beinn Dearg</strong> stays unlenited.{" "}
        <em>Dearg</em> starts with d, which is in the homo-organic group; the
        n at the end of beinn blocks lenition. You can see this hill all over
        Scotland and it's always written without the h.
      </>,
      wrongReveal: <>
        Actually it stays as <strong>Beinn Dearg</strong>. The d sound is
        made in the same part of the mouth as the n at the end of beinn, so
        lenition can't fire. The "depends" answer feels safe but the rule is
        actually deterministic — once you know d/t/s/l/n are exempt, you can
        predict it every time.
      </>,
      cliffhanger: <>
        You now have two rules: <em>feminine triggers lenition</em>{" "}
        (Lesson 5), and <em>d/t/s/l/n after n blocks it</em> (this lesson).
        Apply them in that order and you'll predict most Scottish hill names
        correctly. The remaining lessons are about the small connective
        words — the "of the" and the "from the" that tie names together.
      </>,
    },
  },

  // ─── Lesson 7 ───────────────────────────────────────────────────────
  // Pure phonetic-rule lesson — no hill examples because the 36-hill set has
  // no cnoc names. Instead: the word in isolation, the sound shift, and a
  // generalisation to other cn- words. Shorter than other lessons; this is
  // a quick one-rule installation, not a substantive vocabulary lesson.
  {
    num: 7,
    title: "The 'cn' shift",
    promise: <>
      One small but high-impact pronunciation rule: <em>cn</em> at the
      start of a Gaelic word doesn't sound like the c is silent — the c
      stays as a hard "k", but the n shifts to a tapped <em>r</em>. The
      word <em>cnoc</em> sounds like "krochk". The recap also picks up two
      other pronunciation notes worth carrying with you.
    </>,
    rule: {
      label: "What's happening",
      body: <>
        <p>
          When you see <em>cn-</em> at the start of a Gaelic word, the cluster
          undergoes <strong>rhotacism</strong>: the n is replaced (or
          nasalised) into a tapped r sound. The c is fully pronounced.
        </p>
        <p>
          So <em>cnoc</em> (knoll) = "krochk". <em>Cnap</em> (small lump) =
          "krap". The same shift applies to <em>cneamh</em> (wild garlic) and
          a handful of other <em>cn-</em> words. Anglicised forms preserve
          the new sound: many Scottish places spelled <em>Knock-</em> come
          from <em>Cnoc</em>.
        </p>
      </>,
    },
    tryIt: {
      mode: "predict",
      prompt: <>
        Given the rule, how should <em>Cnap Mòr</em> be pronounced — a name
        you might see on a smaller hill?
      </>,
      options: [
        { label: "k-NAP mor — k and n both audible",             correct: false },
        { label: "KRAP mor — n becomes r, c stays as k",          correct: true  },
        { label: "NAP mor — c is silent",                         correct: false },
      ],
      reveal: <>
        Right — <strong>KRAP mor</strong>. The c-becomes-silent reading is the
        most common beginner mistake (English-speaker intuition), but it's
        the n that vanishes, not the c. Anglicised "Knock" places preserve
        the post-shift sound.
      </>,
      wrongReveal: <>
        Actually <strong>KRAP mor</strong>. Think of it as the n being the
        thing that changes — into a tapped r — while the c stays as a clean
        "k". The English-speaker instinct is to silence the c (like "knee")
        but Gaelic does the opposite.
      </>,
    },
    recap: [
      <>
        One rule, applied wherever you see <em>cn-</em> at the start of a
        Gaelic word: <strong>c stays, n becomes r</strong>. So{" "}
        <em>cnoc</em> = "krochk", <em>cnap</em> = "krap". Look for{" "}
        anglicised <em>Knock-</em> places on a map — they all come from this
        sound shift.
      </>,
      <>
        The same dynamic appears in a few other consonant clusters in some
        dialects (e.g. <em>mn-</em> in older texts), but cn- is the one you'll
        encounter most. Worth installing because it fixes about a thousand
        Scottish place names in one go.
      </>,
      <>
        While we're on pronunciation, those little marks above some
        vowels — <strong>à, è, ò, ù</strong> — aren't decorative. The
        grave accent lengthens the vowel. <em>Mòr</em> (big) is "mor"
        with a stretched O; <em>mor</em> without the accent would be a
        quick "mor". <em>Bàn</em> (white) is "BAAN", not "ban". You
        usually hear the difference clearly. It's the only accent modern
        Gaelic uses, but it matters for both spelling and sound.
      </>,
      <>
        A note on pronunciation in general, while we're here: Gaelic
        sounds vary by region. Skye, the Outer Hebrides, the Cairngorms,
        Sutherland — each has its own dialect. Even native speakers
        sometimes can't pronounce names from other regions. So don't
        worry about getting it perfect. Whether you say "Ben More" or
        "Beinn Mhòr", the person you're talking to will know exactly
        what you mean. Close-enough is the goal; treating pronunciation
        as a test you can fail is the trap.
      </>,
    ],
  },

  // ─── Lesson 8 — enriched stub ───────────────────────────────────────
  // What this lesson should teach: the genitive article — when a name
  // contains "a'", "an", "na", "nam", "nan", it means "of the". This binds
  // two nouns together: "Meall a' Bhùiridh" = "hill of the bellowing".
  //
  // Layout: probably a 2-3 example sequence showing the article in different
  // positions, with the article visually highlighted in each decomposition.
  // The breakdown gets a third part-type (article) alongside generic and
  // qualifier — the existing partsBreakdown helper currently collapses
  // articles into "qualifier" but we should add a third role for this lesson.
  //
  // Available hills: Meall a' Bhùiridh, Càrn an Tuirc, Sgùrr na Cìche,
  // Sròn a' Choire Ghairbh, Stob Coire nan Lochan. Strong material for this
  // lesson — the data has good genitive coverage.
  //
  // Try-it: predict which article goes with which noun (gender + initial
  // letter governs the choice). This might be too hard for a beginner; an
  // easier try-it would be reveal-mode on a four-part name.
  // ─── Lesson 8 ───────────────────────────────────────────────────────
  // The genitive article. Once you've learned generic + qualifier, the next
  // thing you meet in compound names is the small connective word that
  // means "of the": a', an, na, nan, nam. The form depends on the gender
  // and number of what follows (masc sg → a' or an; fem sg → na; plural →
  // nan, or nam before b/m/p). The user doesn't need to memorise the
  // grammar — they just need to learn to recognise the article slot, and
  // know that the noun after it is in genitive case (which often means
  // it's lenited too).
  //
  // Three contrasting examples picked from the data:
  //   - Meall a' Bhùiridh (a' = of the, masc sg, lenites the noun)
  //   - Sgùrr nan Gillean (nan = of the, plural masc, no lenition)
  //   - Bidean nam Bian (nam = of the, plural before b/m/p — special form)
  // Each shows a different article form so the user sees the variety.
  //
  // The article is rendered with a third role (.tour-part.article) so it
  // visually stands apart from generic and qualifier. The lesson is the
  // first place this role appears — earlier lessons use hills with no
  // articles, so they're unaffected.
  {
    num: 8,
    title: "Of the — the connecting word",
    promise: <>
      You've seen lots of two-word names. Three-word names usually have a
      small link in the middle: <em>a', an, na, nan, nam</em>. They all
      mean "of the". This lesson shows you how to spot them, and what
      changes around them.
    </>,
    examples: ["Meall a' Bhùiridh", "Sgùrr nan Gillean", "Bidean nam Bian"],
    rule: {
      label: "Spotting the article",
      body: <>
        <p>
          The article in the middle of a hill name is one of six small
          words: <strong>an, am, a', na, nan, nam</strong>. Together they
          all mean "the" or "of the". Which form you see depends on the
          gender and number of the word that follows — but you don't need
          to learn those rules to read the names. Just recognise the slot.
        </p>
        <p>
          One thing to notice: the word <em>after</em> the article is
          often lenited. <em>Meall a' Bhùiridh</em> isn't bùireadh, it's{" "}
          <em>bhùiridh</em> — the article triggered an h, exactly like the
          feminine adjective rule in Lesson 5. The mechanism is the same;
          the trigger is different.
        </p>
      </>,
    },
    tryIt: {
      mode: "reveal",
      hillName: "Sròn a' Choire Ghairbh",
      prompt: <>
        Four words: <strong>Sròn a' Choire Ghairbh</strong>. You know{" "}
        <em>sròn</em> means "nose" or "promontory". You can see{" "}
        <em>a'</em> as the article. What about the last two? Both lenited
        — <em>choire</em> from coire (corrie), <em>ghairbh</em> from garbh
        (rough). Try to piece it together before revealing.
      </>,
      feedback: <>
        "Promontory of the rough corrie." Four words, three slots: generic
        (sròn) + article (a') + noun (choire) + adjective (ghairbh). Once
        you can see the article slot, four-word names stop feeling longer
        than two-word ones — they just have one extra link in the middle.
      </>,
    },
  },

  // ─── Lesson 9 ───────────────────────────────────────────────────────
  // Geographic words inside hill names — features around the hill that
  // aren't the hill itself. Coire (corrie), loch (lake), gleann (glen),
  // bealach (pass), allt (stream). These are the words that turn a
  // two-part name into a four- or five-part name, because they sit in
  // genitive constructions with the article: peak OF THE corrie OF THE
  // lochans.
  //
  // The closing recap also picks up the personal-names insight (subsumed
  // from the original recommendation #4): some hills don't describe a
  // landform at all — they preserve a person, an animal, or a legend.
  // Sgùrr Alasdair, Beinn Bhrotain, Buachaille Eitibhe Mòr.
  //
  // Honest scope: only `coire` and `lochan` appear in the current 36-hill
  // data set. The reference grid still lists loch/gleann/bealach/allt
  // because the user will meet them on OS maps and corrie/valley names
  // even if no hill in our set uses them. Flagged as such in the grid
  // caption rather than pretended over.
  {
    num: 9,
    title: "Words that aren't hills",
    promise: <>
      <p>
        The longest hill names contain words that aren't really about the
        hill — they describe features <em>around</em> it. <em>Coire</em>{" "}
        (corrie), <em>loch</em> (lake), <em>gleann</em> (glen),{" "}
        <em>bealach</em> (pass). Once you can spot them, four- and
        five-word names stop feeling intimidating.
      </p>
      <p>
        <em>Stob Coire nan Lochan</em> isn't really about the peak. It's
        the <em>corrie</em> that the locals named first, after the small
        lochs in it; the peak is just the high point above. Read the
        right way, the name tells you what to look for when you arrive.
      </p>
    </>,
    wordGrid: {
      label: "Words for features around hills",
      caption: <>
        Five words you'll meet in hill names and on OS maps. They sit in
        the qualifier slot — usually after an article — and describe what's
        next to the hill: a corrie, a small loch, a pass, a stream.
      </>,
      rows: [
        { word: "coire",   pron: "KORR-uh",  meaning: "corrie — a cauldron-shaped hollow in a mountain's flank",
          example: "Coire an t-Sneachda" },
        { word: "lochan",  pron: "LOCH-an",  meaning: "a small loch (diminutive of loch)",
          example: "Coire nan Lochan" },
        { word: "loch",    pron: "loch",     meaning: "a lake (any size) — the big sister of lochan",
          example: "Loch Mòr" },
        { word: "gleann",  pron: "glown",    meaning: "a glen, valley — usually with a river",
          example: "Gleann Coe" },
        { word: "bealach", pron: "BYAL-ach", meaning: "a pass between two hills",
          example: "Bealach na Bà" },
        { word: "allt",    pron: "owlt",     meaning: "a stream or burn",
          example: "Allt a' Mhuilinn" },
      ],
      footnote: <>
        Only <em>coire</em> and <em>lochan</em> appear in the 37 hills you
        can explore in this app. The others you'll meet on the OS maps and
        in glen-and-corrie names around the hills you climb.
      </>,
    },
    examples: ["Stob Coire nan Lochan"],
    tryIt: {
      mode: "predict",
      prompt: <>
        Without scrolling back: <strong>Coire an t-Sneachda</strong> is a
        famous Cairngorms corrie, much used for winter climbing. Given
        that <em>sneachd</em> means snow, what does the full name say?
      </>,
      options: [
        { label: "Snowy pass",                                  correct: false },
        { label: "Corrie of the snow",                          correct: true  },
        { label: "Snow-coloured ridge",                         correct: false },
      ],
      reveal: <>
        Right — "Corrie of the snow". The article <em>an t-</em> is just
        a special form of "the" before s-words (Lesson 8 territory).
        Most named corries in Scotland follow this pattern: <em>coire</em>{" "}
        + article + qualifier. Once you spot the corrie, the rest is
        whatever the people who walked there saw in it.
      </>,
      wrongReveal: <>
        Actually "Corrie of the snow". <em>Coire</em> is the corrie, the
        bowl-shaped hollow; <em>sneachd</em> is the snow. The article{" "}
        <em>an t-</em> is a special form of "the" before s-words. Most
        named corries follow this pattern — generic + article + what's
        in it.
      </>,
    },
    recap: [
      <>
        The five geographic words — <em>coire, lochan, loch, gleann,
        bealach</em>, plus <em>allt</em> — fill the qualifier slot of
        hill names but describe features <em>next to</em> the hill, not
        the hill itself. When you see them, expect an article nearby
        (<em>an, na, nan</em>) and probably a lenited noun after it. The
        pattern is consistent: hill-word + corrie/loch/glen + article +
        what's in it.
      </>,
      <>
        One more category of "not the hill itself" worth knowing: some
        names preserve <em>people</em>, not features. <em>Sgùrr Alasdair</em>{" "}
        on Skye is Alexander's peak — Sheriff Alexander Nicolson, who
        made the first recorded ascent in 1873. <em>Beinn Bhrotain</em>{" "}
        in the Cairngorms is the mountain of Brodan, a mythological hound
        from the Fianna legends. <em>Buachaille Eitibhe Mòr</em> in Glen
        Coe means "the great herdsman of Etive" — the mountain
        personified as a guardian-figure watching the glen. The
        landscape is full of people whose names outlasted the language
        that gave them.
      </>,
      <>
        Lesson 10 puts everything together on one famously long name. By
        the end you'll be reading a four-part Gaelic hill name fluently
        — and you'll have a tour of which lesson taught which piece.
      </>,
    ],
  },

  // ─── Lesson 10 — enriched stub ───────────────────────────────────────
  // The capstone. Pick one famously complex name (Sìth Chailleann — a
  // perfect choice because every layer matters: sìth is interesting
  // pedagogically, Chailleann is lenited and shows a real grammatical case,
  // and the meaning is poetic) and walk through it piece by piece using
  // everything from Lessons 1-9.
  //
  // Suggested layout: a single hill with the decomposition shown as a
  // sequential walkthrough. Each part appears with a small commentary that
  // names which lesson it draws from ("the lenition here is Lesson 5"). A
  // sense of arrival.
  //
  // Try-it could be the user picking any hill from a small list (Bidean nam
  // Bian, Sgùrr nan Gillean, Buachaille Eitibhe Mòr) and getting a full
  // decomposition. Or it could be no try-it at all — the lesson IS the
  // try-it. The recap should be the celebration: "you can now read most of
  // a Scottish OS map. Here's the reference section for everything else."
  //
  // The Finish button (set when atLast) drops the user into Reference →
  // Dissect, where they can apply what they've learned to whichever hill
  // they actually care about.
  // ─── Lesson 10 ──────────────────────────────────────────────────────
  // The capstone. Walks through Stob Coire nan Lochan piece by piece. Each
  // part annotated with which lesson taught the skill needed to read it.
  // The lesson IS the try-it — no separate try-it block. The recap is the
  // celebration: you can read most of a Scottish OS map.
  //
  // Why Stob Coire nan Lochan: four parts, every lesson contributes —
  // Lesson 2 (stob, secondary generic), Lesson 5 (lenition), Lesson 8
  // (article), and an honest acknowledgement that one of the parts
  // (coire) is the kind of geographic noun a future Lesson 9 will cover
  // properly. Better than Sìth Chailleann (only 2 parts) for showing
  // the full mechanism.
  //
  // The walkthrough is a new layout primitive: each part gets its own
  // card with the part text, meaning, pronunciation, and a small label
  // citing the lesson that introduced the skill needed to read it.
  // Finish button (atLast) routes the user to Reference → Dissect.
  {
    num: 10,
    title: "Putting it all together",
    // No section label on the recap — the Clearances closing is the
    // tour's emotional payoff and reads better without a "Worth knowing"
    // header softening it.
    recapLabel: "",
    promise: <>
      Time to read a hill you've never met. <em>Stob Coire nan Lochan</em>{" "}
      — four words, every layer you've learned. Each part below is
      annotated with which lesson made it readable.
    </>,
    walkthrough: {
      hillName: "Stob Coire nan Lochan",
      caption: <>
        A real Glen Coe Munro. Take the parts one at a time — each piece
        comes from a specific lesson.
      </>,
      // The lesson references shown next to each part. These are written
      // as little gloss notes rather than mechanical "see Lesson X" tags.
      annotations: [
        // Stob — generic, secondary tier
        <>
          <strong>Lesson 2</strong> — <em>stob</em> is a "stubby point",
          one of the secondary generics. Same slot as beinn, càrn, sgùrr,
          meall — just a different shape.
        </>,
        // Coire — genitive noun, geographic word
        <>
          <strong>Lesson 9</strong> — <em>coire</em> is a corrie, a
          cauldron-shaped hollow on the mountain's flank. It's a
          geographic noun in genitive case, here meaning "of the corrie".
        </>,
        // nan — article
        <>
          <strong>Lesson 8</strong> — <em>nan</em> is the "of the"
          article, plural form. It signals the next word is itself in
          genitive case.
        </>,
        // Lochan — genitive plural
        <>
          <strong>Lesson 8 again</strong> — <em>lochan</em> is "small
          lochs". Plural noun after the article — exactly the pattern
          you've just seen.
        </>,
      ],
    },
    recap: [
      <>
        Put together: "<strong>Peak of the corrie of the lochans</strong>"
        — a stubby summit overlooking a hollow that holds small lochs.
        The Munro is in Glen Coe; the corrie is one of the most
        photographed in Scotland. Every word is doing work.
      </>,
      <>
        You can now read most Scottish hill names. The big four generics
        cover 70% of them; the secondary generics cover most of the rest;
        the colour and size adjectives reveal the qualifier; the article
        and lenition rules let you split four- and five-word names into
        the right pieces. The Reference section has everything else:
        <em> Dissect</em> any of the 37 hills part by part, <em>Quiz</em>{" "}
        yourself on what you've learned, or use the <em>Glossary</em> as
        a lookup when you meet a word you don't recognise.
      </>,
      <>
        One last thing worth knowing. Many of the communities that spoke
        this language were cleared from the glens during the eighteenth
        and nineteenth centuries — Strathnaver, Glen Calvie, Knoydart,
        the long story of people made to leave. Their words remain on
        every map. <em>Coire na Cìche, Beinn a' Chaorainn, Mullach Coire
        Mhic Fhearchair</em> — each one is a description written by
        someone who lived there and knew it by sight. When you stand on
        a Scottish summit and read the name on the map, you're reading
        something the people who walked there before you wanted you to
        know about the place. That's worth knowing.
      </>,
    ],
  },
];

const TOTAL_LESSONS = LESSONS.length;

// ── <Lesson> ─────────────────────────────────────────────────────────
function Lesson({ lesson, onPrev, onNext, onExit, atFirst, atLast }) {
  const [revealed, setRevealed] = React.useState(false);

  // Reset reveal when navigating to a new lesson
  React.useEffect(() => { setRevealed(false); }, [lesson.num]);

  // A lesson is a stub if it has a `stub` description and no real content.
  // Real lessons must provide at least one content section.
  const isStub = !!lesson.stub && !lesson.examples && !lesson.compare && !lesson.rule;

  return (
    <div className="tour">
      <div className="tour-progress" role="progressbar"
           aria-valuenow={lesson.num}
           aria-valuemax={TOTAL_LESSONS}
           aria-label={`Tour progress: lesson ${lesson.num} of ${TOTAL_LESSONS}`}>
        {Array.from({ length: TOTAL_LESSONS }, (_, i) => {
          const idx = i + 1;
          const cls = idx < lesson.num ? "done"
                    : idx === lesson.num ? "current"
                    : "";
          return <div key={idx} className={`tour-progress-dot ${cls}`} />;
        })}
      </div>

      <div className="tour-num">Lesson {lesson.num} of {TOTAL_LESSONS}</div>
      <h2 className="tour-title">{lesson.title}</h2>

      {isStub ? (
        <div className="tour-stub">
          <p className="tour-stub-label">Coming soon</p>
          <p className="tour-stub-desc">{lesson.stub}</p>
        </div>
      ) : (
        <>
          {lesson.promise && <div className="tour-promise">{lesson.promise}</div>}

          {/* Colour reference grid (Lesson 4) — introduces vocabulary BEFORE
              the examples that use it. Same structural slot as mutationGrid
              but used for vocab introduction rather than rule generalisation. */}
          {lesson.colourGrid && (
            <>
              <div className="tour-section-label">{lesson.colourGrid.label}</div>
              <ColourGrid grid={lesson.colourGrid} />
            </>
          )}

          {/* Sequential worked examples (Lesson 1 style). Label adapts to
              actual count — Lesson 2 has four, others have three. */}
          {lesson.examples && (
            <>
              <div className="tour-section-label">
                {lesson.examples.length === 4 ? "Four worked examples" : "Three worked examples"}
              </div>
              {lesson.examples.map(name => {
                const hill = findHill(name);
                return hill ? (
                  <LessonExample key={name} hill={hill} />
                ) : (
                  <div key={name} className="tour-missing">Hill not found: {name}</div>
                );
              })}
            </>
          )}

          {/* Generics grid (Lesson 2) — secondary words at the same role as
              the primary four, shown as a reference rather than full examples. */}
          {lesson.genericsGrid && (
            <>
              <div className="tour-section-label">{lesson.genericsGrid.label}</div>
              <GenericsGrid grid={lesson.genericsGrid} />
            </>
          )}

          {/* Word grid (Lesson 9) — flat reference grid for vocabulary
              that doesn't have a visual hook (no shape glyph, no swatch).
              Used for geographic words: coire, loch, gleann, bealach, allt. */}
          {lesson.wordGrid && (
            <>
              <div className="tour-section-label">{lesson.wordGrid.label}</div>
              <WordGrid grid={lesson.wordGrid} />
            </>
          )}

          {/* Side-by-side comparison (Lesson 5+) */}
          {lesson.compare && (
            <>
              <div className="tour-section-label">{lesson.compare.label}</div>
              <LessonCompare compare={lesson.compare} />
            </>
          )}

          {/* Explicit rule statement (Lesson 5+) — for when the rule needs
              prose attention before the try-it, not just after */}
          {lesson.rule && (
            <>
              <div className="tour-section-label">{lesson.rule.label}</div>
              <div className="tour-rule">
                <div className="tour-rule-icon">!</div>
                <div className="tour-rule-body">{lesson.rule.body}</div>
              </div>
            </>
          )}

          {/* Mutation grid (Lesson 5) — generalising the rule across adjectives */}
          {lesson.mutationGrid && (
            <>
              <div className="tour-section-label">{lesson.mutationGrid.label}</div>
              <MutationGrid grid={lesson.mutationGrid} />
            </>
          )}

          {/* Walkthrough (Lesson 10 capstone) — one hill, parts annotated
              with which lesson taught each piece. The lesson IS the
              try-it, so there's no separate tryIt block. */}
          {lesson.walkthrough && (
            <>
              <div className="tour-section-label">The whole name, layer by layer</div>
              <Walkthrough walkthrough={lesson.walkthrough} />
            </>
          )}

          {lesson.tryIt && (
            <>
              <div className="tour-section-label">Now you try</div>
              <TryIt
                tryIt={lesson.tryIt}
                revealed={revealed}
                onReveal={() => setRevealed(true)}
              />
            </>
          )}

          {lesson.recap && (
            <>
              {/* Section label is configurable. Default reads "Worth
                  knowing" because the surviving recaps carry new content
                  (asides, handoffs, closings) rather than restating what
                  the try-it just taught. Set recapLabel to empty string
                  to suppress the label entirely (Lesson 10 uses this so
                  the Clearances closing stands without a header). */}
              {lesson.recapLabel !== "" && (
                <div className="tour-section-label">
                  {lesson.recapLabel || "Worth knowing"}
                </div>
              )}
              <div className="tour-recap">
                <div className="tour-recap-icon">{lesson.num}</div>
                <div className="tour-recap-body">
                  {lesson.recap.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="tour-nav">
        <button className="tour-nav-btn"
                type="button"
                onClick={onPrev}
                disabled={atFirst}
                aria-label={atFirst ? "Previous lesson (none — this is the first)" : "Previous lesson"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          <span>Previous</span>
        </button>
        <div className="tour-nav-count">{lesson.num} / {TOTAL_LESSONS}</div>
        {atLast ? (
          <button className="tour-nav-btn primary" type="button" onClick={onExit}>
            <span>Finish</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        ) : (
          <button className="tour-nav-btn primary" type="button" onClick={onNext}>
            <span>Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── <LessonCompare> ──────────────────────────────────────────────────
// Side-by-side comparison of two hills. Used when the lesson's point is a
// difference between them (lenition firing or not, etc.). The two hills sit
// in equal columns so the user can visually compare their decompositions
// without scrolling. On mobile (single column) the columns stack but each
// hill's decomp stays horizontal so the comparison still reads.
function LessonCompare({ compare }) {
  const [hillA, hillB] = compare.pair.map(findHill);
  if (!hillA || !hillB) {
    return <div className="tour-missing">Compare hills not found</div>;
  }
  return (
    <div className="tour-compare-block">
      <div className="tour-compare-grid">
        <ComparePane hill={hillA} />
        <ComparePane hill={hillB} />
      </div>
      {compare.caption && (
        <p className="tour-compare-caption">{compare.caption}</p>
      )}
    </div>
  );
}

function ComparePane({ hill }) {
  const parts = partsBreakdown(hill);
  return (
    <div className="tour-compare-pane">
      <div className="tour-compare-name">{hill.name}</div>
      <div className="tour-compare-anglo">{hill.pron}</div>
      <div className="tour-compare-svg">
        <HillSilhouette hill={hill} size={120} />
      </div>
      <div className="tour-compare-parts">
        {parts.map((p, i) => (
          <div key={i} className={`tour-part ${p.role}`}>
            <div className="tour-part-role">{p.role}</div>
            <div className="tour-part-text">{p.text}</div>
            <div className="tour-part-meaning">{p.meaning}</div>
            {p.pron && <div className="tour-part-pron">{p.pron}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── <ColourGrid> ─────────────────────────────────────────────────────
// Reference grid of colour adjectives. Each row: the Gaelic word, its
// pronunciation, what colour it means, and a swatch using the hex from
// data.js. Used in Lesson 4 as a vocabulary introduction before examples.
//
// Note that gorm and ruadh have wider meanings than their English glosses
// suggest — gorm spans blue/green, ruadh is the russet of heather and red
// deer rather than bright red. The captions in the lesson data flag this.
function ColourGrid({ grid }) {
  return (
    <div className="tour-mutation">
      {grid.caption && <p className="tour-mutation-caption">{grid.caption}</p>}
      <div className="tour-colour-grid">
        {grid.rows.map((r, i) => {
          // Divider row — splits the common adjectives from the rarer ones.
          // The label is shown as a small section header inside the grid.
          if (r.divider) {
            return (
              <div key={i} className="tour-colour-divider" role="separator">
                <span>{r.label}</span>
              </div>
            );
          }
          return (
            <div key={i} className="tour-colour-row">
              <div className="tour-colour-swatch"
                   style={{ background: r.hex }}
                   aria-hidden="true" />
              <div className="tour-colour-text">
                <div className="tour-colour-word">{r.word}</div>
                <div className="tour-colour-pron">{r.pron}</div>
              </div>
              <div className="tour-colour-meaning">{r.meaning}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── <GenericsGrid> ───────────────────────────────────────────────────
// Reference grid of secondary generics. Each row: shape glyph (from
// window.ShapeGlyph), the Gaelic word + pronunciation, what kind of hill
// it describes, and an example name. Used in Lesson 2 to introduce
// secondary generics without giving them full worked-example treatment.
// Same idiom as ColourGrid.
//
// Optional `footnote`: a paragraph rendered beneath the grid for any
// general note the grid wants to make. Available as a general primitive
// even though no current lesson uses it — leaving the affordance in
// place so future grids can attach asides without re-engineering.
function GenericsGrid({ grid }) {
  const ShapeGlyph = window.ShapeGlyph;
  return (
    <div className="tour-mutation">
      {grid.caption && <p className="tour-mutation-caption">{grid.caption}</p>}
      <div className="tour-generics-grid">
        {grid.rows.map((r, i) => (
          <div key={i} className="tour-generics-row">
            <div className="tour-generics-glyph" aria-hidden="true">
              {ShapeGlyph
                ? <ShapeGlyph shape={r.shape} size={36} ink="var(--ink)" />
                : <div style={{width:36,height:18,background:'var(--bg2)',borderRadius:4}} />}
            </div>
            <div className="tour-generics-text">
              <div className="tour-generics-word">
                {r.word}
                {r.pron && <span className="tour-generics-pron"> · {r.pron}</span>}
              </div>
              <div className="tour-generics-meaning">{r.meaning}</div>
            </div>
            <div className="tour-generics-example">{r.example}</div>
          </div>
        ))}
      </div>
      {grid.footnote && (
        <p className="tour-generics-footnote">{grid.footnote}</p>
      )}
    </div>
  );
}

// ── <WordGrid> ──────────────────────────────────────────────────────
// Simpler reference grid with no left-column visual — just word +
// pronunciation + meaning, with an optional right-aligned example.
// Used in Lesson 9 for the geographic-words reference. Same overall
// idiom as GenericsGrid / ColourGrid, but flatter.
function WordGrid({ grid }) {
  return (
    <div className="tour-mutation">
      {grid.caption && <p className="tour-mutation-caption">{grid.caption}</p>}
      <div className="tour-word-grid">
        {grid.rows.map((r, i) => (
          <div key={i} className="tour-word-row">
            <div className="tour-word-text">
              <div className="tour-word-word">
                {r.word}
                {r.pron && <span className="tour-word-pron"> · {r.pron}</span>}
              </div>
              <div className="tour-word-meaning">{r.meaning}</div>
            </div>
            {r.example && <div className="tour-word-example">{r.example}</div>}
          </div>
        ))}
      </div>
      {grid.footnote && (
        <p className="tour-generics-footnote">{grid.footnote}</p>
      )}
    </div>
  );
}

// ── <MutationGrid> ───────────────────────────────────────────────────
// Generalises a sound-change rule across multiple words. Used in Lesson 5
// to show bàn/bhàn, mòr/mhòr etc. — the rule operates on adjectives in
// general, so the grid is more honest than pretending the user can find
// each form in a named hill.
function MutationGrid({ grid }) {
  return (
    <div className="tour-mutation">
      {grid.caption && <p className="tour-mutation-caption">{grid.caption}</p>}
      <div className="tour-mutation-grid">
        <div className="tour-mutation-head">Word</div>
        <div className="tour-mutation-head">Lenited</div>
        <div className="tour-mutation-head">Means</div>
        {grid.rows.map((r, i) => (
          <React.Fragment key={i}>
            <div className="tour-mutation-cell">
              <span className="tour-mutation-form">{r.unlenited}</span>
              <span className="tour-mutation-sound">{r.soundUn}</span>
            </div>
            <div className="tour-mutation-cell lenited">
              <span className="tour-mutation-form">{r.lenited}</span>
              <span className="tour-mutation-sound">{r.soundLen}</span>
            </div>
            <div className="tour-mutation-cell meaning">{r.meaning}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ── <LessonExample> ─────────────────────────────────────────────────
function LessonExample({ hill }) {
  const parts = partsBreakdown(hill);
  return (
    <article className="tour-example">
      <div className="tour-example-header">
        <div>
          <div className="tour-example-name">{hill.name}</div>
          <div className="tour-example-anglo">{hill.pron} · {hill.anglicised}</div>
        </div>
        <div className="tour-example-svg">
          <HillSilhouette hill={hill} size={88} />
        </div>
      </div>
      <div className="tour-decomp">
        {parts.map((p, i) => (
          <div key={i} className={`tour-part ${p.role}`}>
            <div className="tour-part-role">{p.role}</div>
            <div className="tour-part-text">{p.text}</div>
            <div className="tour-part-meaning">{p.meaning}</div>
            {p.pron && <div className="tour-part-pron">{p.pron}</div>}
          </div>
        ))}
      </div>
    </article>
  );
}

// ── <Walkthrough> ───────────────────────────────────────────────────
// Lesson 10 capstone. One hill, walked through part by part with each
// part annotated by which lesson taught the skill needed to read it.
// Visually distinct from LessonExample: the parts are stacked vertically,
// each with its annotation sitting beneath it, so the user reads down the
// column "stob — Lesson 2 — coire — Lesson 9 — ..." like a guided tour
// through the name. The hill's full anglicised name and silhouette sit
// at the top as the "what we're reading" anchor.
function Walkthrough({ walkthrough }) {
  const hill = findHill(walkthrough.hillName);
  if (!hill) {
    return <div className="tour-missing">Hill not found: {walkthrough.hillName}</div>;
  }
  const parts = partsBreakdown(hill);
  // We expect annotations array to be the same length as parts. If they
  // mismatch we still render but warn, so a content bug is visible.
  const annotations = walkthrough.annotations || [];
  return (
    <article className="tour-walkthrough">
      <div className="tour-walkthrough-header">
        <div className="tour-walkthrough-anchor">
          <div className="tour-walkthrough-name">{hill.name}</div>
          <div className="tour-walkthrough-pron">{hill.pron}</div>
          <div className="tour-walkthrough-meaning">"{hill.meaning}"</div>
        </div>
        <div className="tour-walkthrough-svg">
          <HillSilhouette hill={hill} size={96} />
        </div>
      </div>
      {walkthrough.caption && (
        <p className="tour-walkthrough-caption">{walkthrough.caption}</p>
      )}
      <ol className="tour-walkthrough-list">
        {parts.map((p, i) => (
          <li key={i} className="tour-walkthrough-step">
            <div className={`tour-part ${p.role}`}>
              <div className="tour-part-role">{p.role}</div>
              <div className="tour-part-text">{p.text}</div>
              <div className="tour-part-meaning">{p.meaning}</div>
              {p.pron && <div className="tour-part-pron">{p.pron}</div>}
            </div>
            {annotations[i] && (
              <div className="tour-walkthrough-annotation">
                {annotations[i]}
              </div>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

// ── <TryIt> ─────────────────────────────────────────────────────────
// Two interaction modes:
//   - "reveal" (default): show a hill, user thinks, taps button, breakdown
//     and feedback appear. Used in Lesson 1.
//   - "predict": user picks between 2-3 options before seeing the answer.
//     Used when the lesson is about a rule, and we want to test whether
//     they've internalised it.
function TryIt({ tryIt, revealed, onReveal }) {
  if (tryIt.mode === "predict") {
    return <PredictTryIt tryIt={tryIt} />;
  }
  return <RevealTryIt tryIt={tryIt} revealed={revealed} onReveal={onReveal} />;
}

function RevealTryIt({ tryIt, revealed, onReveal }) {
  const hill = findHill(tryIt.hillName);
  if (!hill) return <div className="tour-missing">Try-it hill not found: {tryIt.hillName}</div>;
  const parts = partsBreakdown(hill);

  return (
    <div className="tour-tryit">
      <p className="tour-tryit-prompt">{tryIt.prompt}</p>
      <div className="tour-tryit-hill">
        <div>
          <div className="tour-tryit-name">{hill.name}</div>
          <div className="tour-tryit-anglo">{hill.pron} · {hill.anglicised}</div>
        </div>
        <div className="tour-example-svg">
          <HillSilhouette hill={hill} size={88} />
        </div>
      </div>
      {!revealed ? (
        <button className="tour-tryit-btn" type="button" onClick={onReveal}>
          Reveal the breakdown →
        </button>
      ) : (
        <div className="tour-tryit-answer">
          <div className="tour-decomp tour-decomp-flush">
            {parts.map((p, i) => (
              <div key={i} className={`tour-part ${p.role}`}>
                <div className="tour-part-role">{p.role}</div>
                <div className="tour-part-text">{p.text}</div>
                <div className="tour-part-meaning">{p.meaning}</div>
                {p.pron && <div className="tour-part-pron">{p.pron}</div>}
              </div>
            ))}
          </div>
          <p className="tour-tryit-feedback">{tryIt.feedback}</p>
        </div>
      )}
    </div>
  );
}

function PredictTryIt({ tryIt }) {
  // Track the picked option index. null = unanswered.
  const [picked, setPicked] = React.useState(null);
  const isCorrect = picked !== null && tryIt.options[picked].correct;
  const answered = picked !== null;

  return (
    <div className="tour-tryit">
      <p className="tour-tryit-prompt">{tryIt.prompt}</p>
      <div className="tour-predict-options" role="radiogroup">
        {tryIt.options.map((opt, i) => {
          const isPick = picked === i;
          const cls = !answered ? ""
                    : isPick && opt.correct ? "correct"
                    : isPick && !opt.correct ? "wrong"
                    : !isPick && opt.correct ? "would-be-correct"
                    : "muted";
          return (
            <button
              key={i}
              type="button"
              className={`tour-predict-option ${cls}`}
              role="radio"
              aria-checked={isPick}
              disabled={answered}
              onClick={() => setPicked(i)}
            >
              <span className="tour-predict-marker" aria-hidden="true">
                {!answered ? "" : opt.correct ? "✓" : isPick ? "✗" : ""}
              </span>
              <span className="tour-predict-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="tour-tryit-answer">
          <p className="tour-tryit-feedback">
            {isCorrect ? tryIt.reveal : tryIt.wrongReveal}
          </p>
          {tryIt.cliffhanger && (
            <p className="tour-tryit-cliffhanger">{tryIt.cliffhanger}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── <Tour> — the public component used by app.jsx ───────────────────
// Accepts `idx` and `setIdx` from a parent that wants to own the lesson
// state (so it survives tab switching). If neither is passed, falls back to
// internal state so the component still works standalone (useful for
// embedding in a preview page or for tests).
function Tour({ onExit, idx: idxProp, setIdx: setIdxProp }) {
  const [localIdx, setLocalIdx] = React.useState(0);
  const idx     = idxProp !== undefined ? idxProp     : localIdx;
  const setIdx  = setIdxProp || setLocalIdx;
  const lesson = LESSONS[idx];

  // Scroll to top whenever the lesson changes — without this, users on a long
  // lesson will land halfway down the next one.
  React.useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  }, [idx]);

  return (
    <Lesson
      lesson={lesson}
      onPrev={() => setIdx(Math.max(0, idx - 1))}
      onNext={() => setIdx(Math.min(LESSONS.length - 1, idx + 1))}
      onExit={onExit || (() => {})}
      atFirst={idx === 0}
      atLast={idx === LESSONS.length - 1}
    />
  );
}

Object.assign(window, { Tour, LESSONS });
