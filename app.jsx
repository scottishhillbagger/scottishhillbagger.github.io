// app.jsx — root component.
//
// Top-level: Tour vs Reference.
//   - Tour is the guided learning path — the front door for new users.
//   - Reference holds the surfaces you'd dip into post-tour: Dissect (look
//     up a specific hill), Quiz (test yourself), Glossary (look up a word).
//
// Sounds was removed: it was a flat pronunciation reference without audio,
// which is documentation rather than training. Its content lives inline
// in the tour (Lesson 3) and in the per-hill pronunciation guides shown
// across the app. If audio is added later, Sounds can return.

const TOP_TABS = [
  { id: "tour",      label: "Tour" },
  { id: "reference", label: "Reference" },
];

const REFERENCE_TABS = [
  { id: "dissector", label: "Dissect" },
  { id: "quiz",      label: "Quiz" },
  { id: "guide",     label: "Glossary" },
];

function App() {
  // Default to "tour" — the guided front door for new learners.
  const [tab, setTab]       = React.useState("tour");
  // Reference sub-tab; only matters when tab === "reference".
  const [refTab, setRefTab] = React.useState("dissector");
  const [hill, setHill]     = React.useState(window.HILLS[0]);
  // Tour lesson index lives at the App level so it survives the user
  // switching to Reference and back — otherwise they'd lose their place.
  const [tourIdx, setTourIdx] = React.useState(0);

  // When the tour's "Finish" button fires, deposit the user in Reference →
  // Dissect (the most actionable surface — "now pick a hill you care about").
  const handleTourExit = () => {
    setTab("reference");
    setRefTab("dissector");
  };

  return (
    <div className="app">
      <nav className="modes" role="tablist" aria-label="Section">
        {TOP_TABS.map(t => (
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

      {tab === "reference" && (
        <nav className="ref-subnav" role="tablist" aria-label="Reference section">
          {REFERENCE_TABS.map(r => (
            <button
              key={r.id}
              role="tab"
              aria-selected={refTab === r.id}
              className={`ref-subnav-btn ${refTab === r.id ? "active" : ""}`}
              onClick={() => setRefTab(r.id)}
            >
              {r.label}
            </button>
          ))}
        </nav>
      )}

      <main className="app-main">
        {tab === "tour" && (
          <Tour
            idx={tourIdx}
            setIdx={setTourIdx}
            onExit={handleTourExit}
          />
        )}
        {tab === "reference" && (
          <>
            {refTab === "dissector" && <Dissector hill={hill} setHill={setHill} />}
            {refTab === "quiz"      && <Quiz />}
            {refTab === "guide"     && <FieldGuide />}
          </>
        )}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
