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
  { num: 2,  title: "The big four generics",           stub: "beinn, càrn, sgùrr, meall — which word tells you what kind of hill" },
  { num: 3,  title: "Stress and how to say it",        stub: "First-syllable stress, and the article exception (an TEALL-ach)" },
  { num: 4,  title: "Colour adjectives",               stub: "dubh, dearg, bàn, ruadh, gorm — 60% of map vocabulary in one screen" },

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

  { num: 6,  title: "The exception that proves the rule", stub: "Homo-organic block: why Beinn Dubh stays unlenited" },
  { num: 7,  title: "The 'cn' shift",                  stub: "cnoc → 'krochk' and why the n becomes r" },
  { num: 8,  title: "When 'a' means 'of the'",         stub: "Meall a' Bhùiridh — the genitive article" },
  { num: 9,  title: "Words that aren't hills",         stub: "loch, gleann, bealach, coire — geography inside hill names" },
  { num: 10, title: "Putting it together",             stub: "Sìth Chailleann and other long names — the capstone" },
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
function Tour({ onExit }) {
  const [idx, setIdx] = React.useState(0);
  const lesson = LESSONS[idx];

  // Scroll to top whenever the lesson changes — without this, users on a long
  // lesson will land halfway down the next one.
  React.useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" });
  }, [idx]);

  return (
    <Lesson
      lesson={lesson}
      onPrev={() => setIdx(i => Math.max(0, i - 1))}
      onNext={() => setIdx(i => Math.min(LESSONS.length - 1, i + 1))}
      onExit={onExit || (() => {})}
      atFirst={idx === 0}
      atLast={idx === LESSONS.length - 1}
    />
  );
}

Object.assign(window, { Tour, LESSONS });
