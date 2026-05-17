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
  { num: 5,  title: "When letters disappear",          stub: "Lenition: why Beinn Bhàn but Càrn Bàn" },
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

  // Stub lessons render a placeholder. Once `examples` is filled in, the
  // real layout kicks in.
  const isStub = !lesson.examples;

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
          <p className="tour-promise">{lesson.promise}</p>

          <div className="tour-section-label">Three worked examples</div>
          {lesson.examples.map(name => {
            const hill = findHill(name);
            return hill ? (
              <LessonExample key={name} hill={hill} />
            ) : (
              <div key={name} className="tour-missing">Hill not found: {name}</div>
            );
          })}

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

          <div className="tour-section-label">What just happened</div>
          <div className="tour-recap">
            <div className="tour-recap-icon">{lesson.num}</div>
            <div className="tour-recap-body">
              {lesson.recap.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
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
function TryIt({ tryIt, revealed, onReveal }) {
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
