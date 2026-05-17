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
// Grouped, scrollable list of all hills. At 37 entries a list is more
// browsable than a search box, and grouping by generic does extra teaching
// work (the user implicitly sees that all the sgùrr hills share something).
//
// Hills are grouped by their first generic. The big-four generics from
// Lesson 2 (beinn, càrn, sgùrr, meall) come first; secondary generics
// alphabetically; names that don't start with a generic in a "Special
// forms" bucket at the end.
//
// Layout adapts by viewport:
//   - Desktop (≥720px): rendered as a sticky left sidebar by the parent
//     Dissector layout. The list itself just renders; the parent handles
//     positioning.
//   - Mobile (<720px): the list collapses into a compact summary bar. Tap
//     to expand inline; tap a hill to collapse and show the detail.
const GENERIC_ORDER = ["beinn", "càrn", "sgùrr", "meall"];

function groupHillsByGeneric(hills) {
  const groups = {};
  for (const h of hills) {
    const genericPart = h.parts.find(p => window.ROOTS[p.root]?.type === "generic");
    const key = genericPart ? genericPart.root : "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  }
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

function HillList({ hills, value, onChange, expanded, onToggle }) {
  const groups = React.useMemo(() => groupHillsByGeneric(hills), [hills]);

  return (
    <div className={`hill-list-wrap ${expanded ? "expanded" : "collapsed"}`}>
      {/* Mobile-only summary bar — hidden on desktop via CSS.
          Shows the active hill and a toggle to expand the list. */}
      <button
        type="button"
        className="hill-list-summary"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="hill-list-body"
      >
        <span className="hill-list-summary-label">Currently dissecting</span>
        <span className="hill-list-summary-name">
          {value ? value.name : "Pick a hill"}
        </span>
        <svg className="hill-list-summary-chevron" width="14" height="14"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             aria-hidden="true">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <div className="hill-list" id="hill-list-body">
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
  // Mobile: is the list expanded? Default true on first render so a user
  // landing here sees the list and the active hill. Once they pick, it
  // collapses to surface the detail. On desktop CSS keeps the list visible
  // regardless of this state.
  const [listExpanded, setListExpanded] = React.useState(true);

  // When the user picks a hill on mobile, collapse the list and scroll the
  // detail into view. The scroll target is the detail container, which the
  // useRef below points at.
  const detailRef = React.useRef(null);

  const handleHillPick = (h) => {
    setHill(h);
    setHoveredPart(null);
    setListExpanded(false);
    // Defer the scroll until after the layout updates — otherwise we scroll
    // before the collapse animation, and the user lands halfway through it.
    // requestAnimationFrame is enough; we don't need to wait for the full
    // transition because CSS handles the animation independently.
    requestAnimationFrame(() => {
      if (detailRef.current && window.matchMedia("(max-width: 719px)").matches) {
        detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

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
      <div className="dissector-layout">
        <aside className="dissector-aside">
          <HillList
            hills={window.HILLS}
            value={hill}
            onChange={handleHillPick}
            expanded={listExpanded}
            onToggle={() => setListExpanded(e => !e)}
          />
        </aside>

        <section className="dissector-detail" ref={detailRef}>
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
                <button key={h.anglicised} className="rel-chip" onClick={() => handleHillPick(h)}>
                  <span className="rel-name">{h.anglicised}</span>
                  <span className="rel-root">via {sharedRoot}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { Dissector });
