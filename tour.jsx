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
//    by the try-it reveal. Each part has the role (generic vs qualifier)
//    derived from its root's `type`. We tolerate roots not being found in
//    ROOTS so a malformed hill doesn't crash the tour.
function partsBreakdown(hill) {
  if (!hill) return [];
  return hill.parts.map(p => {
    const root = window.ROOTS[p.root] || {};
    // The "role" is what we show as the slot label. We collapse all
    // qualifier-ish types into "qualifier" because Lesson 1 only
    // distinguishes two slots; later lessons can specialise.
    const role = root.type === "generic" ? "generic" : "qualifier";
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
      Every Scottish hill name is built from two pieces: a <em>generic</em> (what
      kind of hill it is) and a <em>qualifier</em> (which one). Once you see the
      pattern, you can read names you've never met.
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
    recap: [
      <>
        Every name you'll meet on this tour follows the same skeleton:{" "}
        <code>generic + qualifier</code>. The generic tells you what{" "}
        <strong>kind</strong> of hill — a rounded one, a sharp one, a heap of
        stones. The qualifier tells you <strong>which</strong> one — the big
        one, the red one, the one above the loch.
      </>,
      <>
        You've now met three generics (<em>beinn, càrn, sgùrr</em>) and three
        qualifiers (<em>dubh, bàn, dearg</em>). That's six words. In Lesson 4
        you'll add five more qualifiers and be able to read most colour-named
        hills on a Scottish map.
      </>,
    ],
  },

  // ─── Lessons 2–10: stubs to be filled in ────────────────────────────
  // Each stub renders a placeholder screen so the navigation works end-to-end
  // and lesson order can be tested. Fill in `examples`, `tryIt`, `recap` to
  // bring each one online.
  // ─── Lesson 2 ───────────────────────────────────────────────────────
  // Builds on Lesson 1: now that the user knows "every name = generic +
  // qualifier", this lesson installs the four generics that cover 70%+ of
  // Scottish hill names. Format: four worked examples (one per generic) so
  // the user sees the silhouette change shape as the generic changes.
  // Try-it tests: given a name, can the user predict the silhouette?
  {
    num: 2,
    title: "The big four generics",
    promise: <>
      Four words cover most Scottish hill names: <em>beinn, càrn, sgùrr,
      meall</em>. Each describes a different <em>shape</em> of hill. Learn
      these four and you can read 7 out of 10 names on an OS map.
    </>,
    examples: ["Beinn Nibheis", "Càrn Gorm", "Sgùrr Alasdair", "Meall Buidhe"],
    tryIt: {
      mode: "predict",
      prompt: <>
        Without scrolling back, what shape would you expect <em>Aonach Mòr</em>{" "}
        to be? <em>Aonach</em> means "ridge" — a long, level, walking-pace top.
      </>,
      options: [
        { label: "A sharp peak (like Sgùrr Alasdair)",        correct: false },
        { label: "A long flat ridge",                          correct: true  },
        { label: "A rounded dome (like Meall Buidhe)",         correct: false },
      ],
      reveal: <>
        Right. <em>Aonach</em> is one of the secondary generics — same logical
        slot as beinn, càrn, sgùrr, meall, but for hills shaped like a long
        flat-topped ridge. The pattern is the same: the generic tells you the
        shape, the qualifier tells you which one.
      </>,
      wrongReveal: <>
        Actually no — <em>aonach</em> means "ridge". The word literally
        describes a long, flat-topped shape. Once you've installed the big
        four, secondary generics like aonach, stob, and binnein slot in
        easily — same role, different shape.
      </>,
    },
    recap: [
      <>
        The four generics you've now met: <strong>beinn</strong> (classic
        mountain), <strong>càrn</strong> (cairn-shaped heap), <strong>sgùrr</strong>{" "}
        (sharp rocky peak), <strong>meall</strong> (rounded lump). Each tells
        you the <em>shape</em> before you even read the second word.
      </>,
      <>
        Other generics — <em>aonach</em>, <em>stob</em>, <em>binnein</em>,{" "}
        <em>sròn</em>, <em>creag</em> — follow the same role. When you meet
        one, ask: "what shape is this word describing?" The qualifier will
        come next.
      </>,
    ],
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
    recap: [
      <>
        Two rules, in order of importance: <strong>(1)</strong> stress on the
        first syllable of every content word, <strong>(2)</strong> articles
        don't count as content words. Apply them in that order and you'll get
        most hills right on the first try.
      </>,
      <>
        Edge case to know about: a small number of words have absorbed the
        article into themselves over centuries (e.g. <em>An Teallach</em>{" "}
        becomes one breath — <em>an-TEALL-ach</em>, where "an" is unstressed
        but barely audible as a separate word). The rule still works; just
        the article is contracted.
      </>,
    ],
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
    recap: [
      <>
        Lenition is the most useful pattern in Gaelic. Three words get you most
        of the way: <strong>feminine noun + adjective = h after the first
        letter</strong>. The "h" is silent in writing terms but it changes the
        sound — softening b → v, m → v, d → gh, g → gh.
      </>,
      <>
        You can now read <em>Bhàn, Mhòr, Dhubh, Ghorm</em> as easily as their
        unlenited forms. Doubled vocabulary, one rule. In the next lesson
        you'll meet the exception that explains <em>Beinn Dubh</em>.
      </>,
    ],
  },

  // ─── Lesson 6 — enriched stub ───────────────────────────────────────
  // What this lesson should teach: the homo-organic dental block. After a
  // noun ending in 'n' (like beinn), an adjective starting with 'd' or 't'
  // is exempt from lenition, even though the Lesson 5 rule would predict
  // lenition. Beinn Dubh stays Beinn Dubh, not Beinn Dhubh.
  //
  // Suggested layout: reuse Lesson 5's comparison + rule pattern. Compare
  // Beinn Bhàn (lenited as expected, Lesson 5) vs Beinn Dubh (unlenited,
  // exception). State the rule. Try-it: predict whether Beinn Dearg lenites.
  //
  // Hill data is available: Beinn Bhàn, Beinn Dubh both in HILLS. The
  // existing Beinn Dubh entry already has the homo-organic note in its
  // `note` field from the data.js patches — pull that quote into the recap.
  {
    num: 6,
    title: "The exception that proves the rule",
    stub: "Why Beinn Dubh doesn't lenite — the homo-organic dental block. Lesson 5's rule applies after feminine nouns, except when the adjective starts with d/t and the noun ends in n. Compare Beinn Bhàn (lenited) vs Beinn Dubh (not), state the rule, try-it on Beinn Dearg."
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
      One small but high-impact pronunciation rule: <em>cn</em> at the start
      of a Gaelic word doesn't sound like the c is silent — the c stays as a
      hard "k", but the n shifts to a tapped <em>r</em>. The word{" "}
      <em>cnoc</em> sounds like "krochk".
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
  {
    num: 8,
    title: "When 'a' means 'of the'",
    stub: "Genitive articles — a', an, na, nam, nan all mean 'of the' and bind two nouns together. Meall a' Bhùiridh = hill of the bellowing (stags). The article slot is the third part-type; lesson should add it as a distinct role in the decomposition view."
  },

  // ─── Lesson 9 — enriched stub ───────────────────────────────────────
  // What this lesson should teach: geographic words that appear inside hill
  // names but aren't themselves hills — loch, coire (corrie/cwm), gleann
  // (glen), bealach (pass). They usually sit after an article: "Stob Coire
  // nan Lochan" = "peak of the corrie of the small lochs". This is the
  // lesson that unlocks reading 4- and 5-part names.
  //
  // Layout: a small reference grid of the four words (similar to Lesson 4's
  // colour grid), then 2 worked examples showing the words in context.
  // Try-it: reveal-mode on Stob Coire nan Lochan — let the user try to
  // identify each part themselves before revealing.
  //
  // Data caveat: the existing parts data has "macduibh" as a placeholder
  // root for several non-MacDuff parts (Coire, Tuirc, etc). Lesson 9 should
  // work around this by relying on the part's `text` and `custom` fields
  // rather than the broken root link. Worth fixing the underlying data bug
  // in a separate pass.
  {
    num: 9,
    title: "Words that aren't hills",
    stub: "loch, coire, gleann, bealach — geographic features that show up inside hill names. Stob Coire nan Lochan = 'peak of the corrie of the lochans'. Lesson should add a reference grid of the four words plus 2 worked examples on longer hill names."
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
  {
    num: 10,
    title: "Putting it together",
    stub: "Capstone: Sìth Chailleann ('fairy hill of the Caledonians'), broken down piece by piece with each part annotated by which lesson it draws from. The recap is the graduation moment — 'you can now read a Scottish map'. Finish button routes to Reference → Dissect."
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
          {lesson.promise && <p className="tour-promise">{lesson.promise}</p>}

          {/* Colour reference grid (Lesson 4) — introduces vocabulary BEFORE
              the examples that use it. Same structural slot as mutationGrid
              but used for vocab introduction rather than rule generalisation. */}
          {lesson.colourGrid && (
            <>
              <div className="tour-section-label">{lesson.colourGrid.label}</div>
              <ColourGrid grid={lesson.colourGrid} />
            </>
          )}

          {/* Sequential worked examples (Lesson 1 style) */}
          {lesson.examples && (
            <>
              <div className="tour-section-label">Three worked examples</div>
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
              <div className="tour-section-label">What just happened</div>
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
