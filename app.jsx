// app.jsx — root component.
//
// Four top-level surfaces, each a distinct activity:
//   - Tour:     guided learning path (the front door for new users)
//   - Dissect:  look up a specific hill, see its parts broken down
//   - Quiz:     drill the vocabulary with random multiple-choice
//   - Glossary: every root word with meaning and pronunciation
//
// Earlier this app had a 2-level structure (Tour vs Reference, with three
// sub-tabs under Reference). Flattened to peers because:
//   - 4 destinations beats 5 (2 top + 3 sub), one click less to anywhere
//   - Each surface is a different verb (learn / look up / drill / look up)
//   - "Reference" as a parent label was grouping by what-not-Tour, not by
//     what-they-are
// Tour stays the default landing + leftmost tab; that's still the "do the
// tour first" signal, just expressed by ordering rather than hierarchy.
//
// Sounds was removed earlier: a flat pronunciation reference without
// audio is documentation rather than training. Its content lives inline
// in the tour (Lessons 3, 5, 7) and in the per-hill pronunciation guides
// shown across the app. The PronunciationTrainer component and PHONEMES
// data table were dropped at the same time as this nav flatten.

const TABS = [
  { id: "tour",      label: "Tour" },
  { id: "dissector", label: "Dissect" },
  { id: "quiz",      label: "Quiz" },
  { id: "guide",     label: "Glossary" },
];

function App() {
  // Default to "tour" — the leftmost tab and the guided front door.
  const [tab, setTab]       = React.useState("tour");
  const [hill, setHill]     = React.useState(window.HILLS[0]);
  // Tour lesson index lives at the App level so it survives the user
  // switching to another tab and back — otherwise they'd lose their place.
  const [tourIdx, setTourIdx] = React.useState(0);

  // When the tour's "Finish" button fires, deposit the user in Dissect
  // (the most actionable surface — "now pick a hill you care about").
  const handleTourExit = () => {
    setTab("dissector");
  };

  return (
    <div className="app">
      <nav className="modes" role="tablist" aria-label="Section">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`mode-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === "tour" && (
          <Tour
            idx={tourIdx}
            setIdx={setTourIdx}
            onExit={handleTourExit}
          />
        )}
        {tab === "dissector" && <Dissector hill={hill} setHill={setHill} />}
        {tab === "quiz"      && <Quiz />}
        {tab === "guide"     && <FieldGuide />}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
