// fieldguide.jsx
// Field Guide — typographic reference dictionary of every hill-name element.
// Filterable by type (generic / adjective / color / article / qualifier).
// Each entry shows the word, meaning, pronunciation, IPA, shape glyph if a
// generic, and example hills using it.
//
// Note: this used to have a search input. We removed it because (a) the Tour
// is now the front door for new learners and (b) search rewarded what users
// already knew, suppressing the variation the pill filters were designed to
// surface. The pills do real teaching work — search undid it.

const FILTERS = [
  { id: "all",       label: "All" },
  { id: "generic",   label: "Generics (hill shapes)" },
  { id: "color",     label: "Colours" },
  { id: "adj",       label: "Descriptors" },
  { id: "article",   label: "Articles" },
  { id: "qualifier", label: "Qualifiers" },
];

function FieldGuide() {
  const [filter, setFilter] = React.useState("all");

  const entries = React.useMemo(() => {
    const all = Object.entries(window.ROOTS).map(([key, val]) => ({ key, ...val }));
    const filtered = filter === "all" ? all : all.filter(e => e.type === filter);
    return filtered.sort((a, b) => a.key.localeCompare(b.key));
  }, [filter]);

  // Count examples per root once
  const exampleMap = React.useMemo(() => {
    const m = {};
    for (const h of window.HILLS) {
      for (const p of h.parts) {
        if (!m[p.root]) m[p.root] = [];
        if (m[p.root].length < 5) m[p.root].push(h.anglicised);
      }
    }
    return m;
  }, []);

  return (
    <div className="guide">
      <div className="guide-top">
        <div className="guide-filters">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`guide-filter ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="guide-count">{entries.length} entries</div>

      <div className="guide-entries">
        {entries.map(entry => (
          <GuideEntry key={entry.key} entry={entry} examples={exampleMap[entry.key] || []} />
        ))}
      </div>
    </div>
  );
}

function GuideEntry({ entry, examples }) {
  const typeColor = {
    generic:   "var(--accent)",
    color:     "var(--ink)",
    adj:       "var(--ink)",
    article:   "var(--muted)",
    qualifier: "var(--ink)",
  }[entry.type] || "var(--ink)";

  return (
    <div className={`guide-entry type-${entry.type}`}>
      <div className="entry-left">
        {entry.type === "generic" && entry.shape && (
          <ShapeGlyph shape={entry.shape} size={64} ink={typeColor} />
        )}
        {entry.type === "color" && entry.hex && (
          <div className="color-swatch" style={{ background: entry.hex }} />
        )}
        {entry.type !== "generic" && entry.type !== "color" && (
          <div className="type-marker" style={{ color: typeColor }}>
            {entry.type.slice(0, 3).toUpperCase()}
          </div>
        )}
      </div>
      <div className="entry-mid">
        <div className="entry-word">{entry.key}</div>
        <div className="entry-type">{entry.type}{entry.shape ? ` · ${window.SHAPE_LABEL[entry.shape]}` : ""}</div>
        <div className="entry-meaning">{entry.meaning}</div>
      </div>
      <div className="entry-right">
        <div className="entry-pron">
          <span className="mono">{entry.pron}</span>
          {entry.ipa && <span className="mono dim">/{entry.ipa}/</span>}
        </div>
        {entry.note && <div className="entry-note">{entry.note}</div>}
        {examples.length > 0 && (
          <div className="entry-examples">
            {examples.map(e => <span key={e} className="example-pill">{e}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { FieldGuide });
