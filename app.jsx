// app.jsx — root component, mode switcher.

const MODES = [
  { id: "dissector", label: "Dissect" },
  { id: "trainer",   label: "Sounds" },
  { id: "quiz",      label: "Quiz" },
  { id: "guide",     label: "Glossary" },
];

function App() {
  const [mode, setMode] = React.useState("dissector");
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
