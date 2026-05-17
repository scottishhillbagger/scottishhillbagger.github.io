// app.jsx — root component, mode switcher.

const MODES = [
  { id: "tour",      label: "Tour" },
  { id: "dissector", label: "Dissect" },
  { id: "trainer",   label: "Sounds" },
  { id: "quiz",      label: "Quiz" },
  { id: "guide",     label: "Glossary" },
];

function App() {
  // Default to "tour" — the guided front door for new learners. Returning
  // users can switch tabs and (because we don't persist mode) will land back
  // on Tour next time, which is the intended behaviour while the tour is
  // still the primary learning surface.
  const [mode, setMode] = React.useState("tour");
  const [hill, setHill] = React.useState(window.HILLS[0]);

  return (
    <div className="app">
      <nav className="modes" role="tablist">
        {MODES.map(m => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            className={`mode-btn ${mode === m.id ? "active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {mode === "tour"      && <Tour onExit={() => setMode("dissector")} />}
        {mode === "dissector" && <Dissector hill={hill} setHill={setHill} />}
        {mode === "trainer"   && <PronunciationTrainer />}
        {mode === "quiz"      && <Quiz />}
        {mode === "guide"     && <FieldGuide />}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
