// dissector.jsx
// The Name Dissector — centerpiece of the app.
// Pick a hill from a searchable list; see its name broken into colored parts.
// Each part is hoverable/tappable for meaning, pronunciation, and notes.

const PART_COLORS = {
  generic:   "var(--accent, #b14a3c)",
  adj:       "var(--ink, #1a1a1a)",
  color:     "var(--ink, #1a1a1a)",
  article:   "var(--muted, #888)",
  qualifier: "var(--ink, #1a1a1a)",
};

function partInfo(part) {
  const root = window.ROOTS[part.root] || {};
  const custom = part.custom || {};
  return {
    type: root.type || "qualifier",
    meaning: custom.meaning || root.meaning || "",
    pron: custom.pron || root.pron || "",
    ipa: custom.ipa || root.ipa || "",
    note: root.note || "",
    rootKey: part.root,
    lenited: !!part.lenited,
  };
}

function HillPicker({ hills, value, onChange }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  const filtered = React.useMemo(() => {
    if (!q.trim()) return hills;
    const lower = q.toLowerCase();
    return hills.filter((h) =>
      h.name.toLowerCase().includes(lower) ||
      h.anglicised.toLowerCase().includes(lower) ||
      h.meaning.toLowerCase().includes(lower) ||
      h.region.toLowerCase().includes(lower)
    );
  }, [q, hills]);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div className="picker" ref={wrapRef}>
      <div className="picker-input">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search 36 hills — name, region, meaning…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {q && (
          <button className="picker-clear" onClick={() => { setQ(""); setOpen(true); }}>
            Clear
          </button>
        )}
      </div>
      {open && (
        <div className="picker-results">
          {filtered.length === 0 && <div className="picker-empty">No matches.</div>}
          {filtered.map((h, i) => (
            <button
              key={h.anglicised}
              className={`picker-item ${value && value.anglicised === h.anglicised ? "active" : ""}`}
              onClick={() => { onChange(h); setOpen(false); setQ(""); }}
            >
              <div className="picker-item-name">{h.anglicised}</div>
              <div className="picker-item-meta">
                <span>{h.classification}</span>
                <span>·</span>
                <span>{h.height}m</span>
                <span>·</span>
                <span>{h.region}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dissector({ hill, setHill }) {
  const [hoveredPart, setHoveredPart] = React.useState(null);

  // Find other hills sharing roots with the active one
  const relatives = React.useMemo(() => {
    if (!hill) return [];
    const myRoots = new Set(
      hill.parts.map(p => p.root).filter(r => {
        const root = window.ROOTS[r];
        return root && (root.type === "generic" || root.type === "color" || root.type === "adj");
      })
    );
    const others = [];
    for (const h of window.HILLS) {
      if (h.anglicised === hill.anglicised) continue;
      const shared = h.parts.find(p => myRoots.has(p.root));
      if (shared) others.push({ hill: h, sharedRoot: shared.root });
      if (others.length >= 5) break;
    }
    return others;
  }, [hill]);

  const focused = hoveredPart != null ? partInfo(hill.parts[hoveredPart]) : null;

  return (
    <div className="dissector">
      <div className="dissector-top">
        <HillPicker hills={window.HILLS} value={hill} onChange={setHill} />
        <div className="filters">
          {["Munro", "Corbett", "Fiona"].map((c) => {
            const count = window.HILLS.filter(h => h.classification === c || h.classification.startsWith(c)).length;
            return <span key={c} className="filter-chip">{c} <em>{count}</em></span>;
          })}
        </div>
      </div>

      <div className="dissector-body">
        {/* The big name */}
        <div className="hill-display">
          <div className="hill-classification">
            <span className="badge">{hill.classification}</span>
            <span className="height">{hill.height}m</span>
            <span className="region">{hill.region}</span>
          </div>

          <div className="hill-name">
            {hill.parts.map((part, i) => {
              const info = partInfo(part);
              const tint = PART_COLORS[info.type] || "var(--ink)";
              return (
                <span
                  key={i}
                  className={`name-part type-${info.type} ${hoveredPart === i ? "active" : ""}`}
                  style={{ "--part-color": tint }}
                  onMouseEnter={() => setHoveredPart(i)}
                  onMouseLeave={() => setHoveredPart(null)}
                  onClick={() => setHoveredPart(i)}
                >
                  {part.text}
                  {info.lenited && <span className="lenition-mark" title="Lenited">·</span>}
                </span>
              );
            })}
          </div>

          <div className="hill-pron">
            <div className="pron-line">
              <span className="pron-label">Say:</span>
              <span className="pron-value">{hill.pron}</span>
            </div>
            <div className="pron-line ipa">
              <span className="pron-label">IPA:</span>
              <span className="pron-value">/{hill.ipa}/</span>
            </div>
          </div>

          <div className="hill-meaning">"{hill.meaning}"</div>
        </div>

        {/* Right column: visual + part detail */}
        <div className="dissector-side">
          <div className="silhouette-wrap">
            <HillSilhouette hill={hill} size={240} />
            <div className="silhouette-caption">
              {(() => {
                const generic = hill.parts.find(p => {
                  const r = window.ROOTS[p.root];
                  return r && r.type === "generic";
                });
                if (!generic) return null;
                const r = window.ROOTS[generic.root];
                return (
                  <>
                    <strong>{generic.text}</strong> →{" "}
                    {window.SHAPE_LABEL[r.shape] || "Mountain"}
                  </>
                );
              })()}
            </div>
          </div>

          {focused ? (
            <div className="part-detail">
              <div className="part-detail-type">
                <span>{focused.type}{focused.lenited && " · lenited"}</span>
              </div>
              <div className="part-detail-text">
                {hill.parts[hoveredPart].text}
              </div>
              <div className="part-detail-meaning">{focused.meaning}</div>
              <div className="part-detail-pron">
                <span className="mono">{focused.pron}</span>
                {focused.ipa && <span className="mono dim">/{focused.ipa}/</span>}
              </div>
              {focused.note && <div className="part-detail-note">{focused.note}</div>}
            </div>
          ) : (
            <div className="part-detail hint">
              <div className="hint-label">Hover any part of the name</div>
              <div className="hint-body">
                See its meaning, pronunciation, and pronunciation notes.
              </div>
              <div className="hint-legend">
                <span><i style={{background: "var(--accent)"}}/>generic (the hill shape)</span>
                <span><i style={{background: "var(--ink)"}}/>descriptor / qualifier</span>
                <span><i style={{background: "var(--muted)"}}/>article</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: relatives + note */}
      <div className="dissector-footer">
        {hill.note && (
          <div className="hill-note">
            <span className="note-label">Note</span>
            <p>{hill.note}</p>
          </div>
        )}
        {relatives.length > 0 && (
          <div className="relatives">
            <div className="relatives-label">Shares roots with</div>
            <div className="relatives-list">
              {relatives.map(({hill: h, sharedRoot}) => (
                <button key={h.anglicised} className="rel-chip" onClick={() => setHill(h)}>
                  <span className="rel-name">{h.anglicised}</span>
                  <span className="rel-root">via {sharedRoot}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Dissector });
