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

// ── <HillList> ─────────────────────────────────────────────────────
// Grouped, scrollable list of all 36 hills. Replaces the previous search
// picker — at 36 entries a list is more browsable than a search box, and
// grouping by generic does extra teaching work on top (the user implicitly
// sees that all the sgùrr hills share something).
//
// Hills are grouped by their first generic (Beinn, Càrn, Sgùrr, Meall first;
// remaining generics in alphabetical order). Within each group, hills are
// alphabetised by Gaelic name.
//
// An optional `classFilter` narrows to a single classification (Munro /
// Corbett / Fiona). Empty filter = show all.
const GENERIC_ORDER = ["beinn", "càrn", "sgùrr", "meall"];

function groupHillsByGeneric(hills) {
  const groups = {};
  for (const h of hills) {
    // The first part's root that's a generic. Falls back to "other" if
    // somehow none of the parts is marked as a generic in ROOTS.
    const genericPart = h.parts.find(p => window.ROOTS[p.root]?.type === "generic");
    const key = genericPart ? genericPart.root : "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  }
  // Sort the keys: GENERIC_ORDER first, then alphabetical for the rest,
  // then "other" last.
  const orderedKeys = [
    ...GENERIC_ORDER.filter(k => groups[k]),
    ...Object.keys(groups).filter(k => !GENERIC_ORDER.includes(k) && k !== "other").sort(),
    ...(groups.other ? ["other"] : []),
  ];
  return orderedKeys.map(key => ({
    key,
    label: key === "other"
      ? "Special forms — names that don't start with a generic"
      : window.ROOTS[key]?.meaning ? `${key} — ${window.ROOTS[key].meaning}` : key,
    hills: [...groups[key]].sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

function HillList({ hills, value, onChange, classFilter, onClassFilter }) {
  const filtered = React.useMemo(() => {
    if (!classFilter) return hills;
    return hills.filter(h =>
      h.classification === classFilter || h.classification.startsWith(classFilter)
    );
  }, [hills, classFilter]);

  const groups = React.useMemo(() => groupHillsByGeneric(filtered), [filtered]);

  // Counts shown on the filter chips reflect the full set, not the filtered
  // one — otherwise switching to Munro would show "Munro 22" instead of
  // letting you see what the other filters would jump to.
  const counts = React.useMemo(() => {
    const c = {};
    for (const cls of ["Munro", "Corbett", "Fiona"]) {
      c[cls] = hills.filter(h => h.classification === cls || h.classification.startsWith(cls)).length;
    }
    return c;
  }, [hills]);

  return (
    <div className="hill-list-wrap">
      <div className="hill-list-filters" role="group" aria-label="Filter by classification">
        <button
          className={`filter-chip ${!classFilter ? "active" : ""}`}
          onClick={() => onClassFilter("")}
        >
          All <em>{hills.length}</em>
        </button>
        {["Munro", "Corbett", "Fiona"].map(cls => (
          <button
            key={cls}
            className={`filter-chip ${classFilter === cls ? "active" : ""}`}
            onClick={() => onClassFilter(classFilter === cls ? "" : cls)}
          >
            {cls} <em>{counts[cls]}</em>
          </button>
        ))}
      </div>

      <div className="hill-list">
        {groups.length === 0 && (
          <div className="hill-list-empty">No hills match this filter.</div>
        )}
        {groups.map(group => (
          <div key={group.key} className="hill-list-group">
            <div className="hill-list-group-label">{group.label}</div>
            <div className="hill-list-items">
              {group.hills.map(h => {
                const isActive = value && value.anglicised === h.anglicised;
                return (
                  <button
                    key={h.anglicised}
                    type="button"
                    className={`hill-list-item ${isActive ? "active" : ""}`}
                    onClick={() => onChange(h)}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="hill-list-name">{h.name}</span>
                    <span className="hill-list-anglo">{h.anglicised}</span>
                    <span className="hill-list-meta">
                      {h.classification} · {h.height}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dissector({ hill, setHill }) {
  const [hoveredPart, setHoveredPart] = React.useState(null);
  const [classFilter, setClassFilter] = React.useState("");

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
      <HillList
        hills={window.HILLS}
        value={hill}
        onChange={setHill}
        classFilter={classFilter}
        onClassFilter={setClassFilter}
      />

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
