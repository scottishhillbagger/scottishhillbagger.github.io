// pronunciation.jsx
// Pronunciation Trainer — interactive grid of Gaelic phonemes.
// User can flip through groups (lenition, broad/slender, vowels, rules),
// click any item for an expanded explanation + example hills.

function PhonemeCard({ item, active, onClick }) {
  return (
    <button className={`phoneme-card ${active ? "active" : ""}`} onClick={onClick}>
      <div className="phoneme-letters">{item.letters}</div>
      <div className="phoneme-arrow">→</div>
      <div className="phoneme-anglo mono">{item.anglo}</div>
    </button>
  );
}

function PhonemeDetail({ item }) {
  // Find hills whose name visibly contains this letter combination
  const examples = React.useMemo(() => {
    const target = item.letters.toLowerCase().replace(/\s.*$/, "");
    if (target.length > 4 || target === "rule") return [];
    return window.HILLS.filter(h =>
      h.name.toLowerCase().includes(target) ||
      h.anglicised.toLowerCase().includes(target)
    ).slice(0, 4);
  }, [item]);

  return (
    <div className="phoneme-detail">
      <div className="pd-top">
        <div className="pd-letters">{item.letters}</div>
        <div className="pd-arrow">sounds like</div>
        <div className="pd-anglo">{item.anglo}</div>
      </div>
      {item.ipa && item.ipa !== "—" && (
        <div className="pd-ipa mono">IPA: /{item.ipa}/</div>
      )}
      <div className="pd-example">
        <div className="pd-label">Example</div>
        <div className="pd-example-text">
          <strong>{item.example}</strong>
          <span className="pd-example-anglo">→ {item.exampleAnglo}</span>
        </div>
      </div>
      <div className="pd-note">{item.note}</div>
      {examples.length > 0 && (
        <div className="pd-hills">
          <div className="pd-label">Spotted on hills</div>
          <div className="pd-hills-list">
            {examples.map(h => (
              <div key={h.anglicised} className="pd-hill-chip">
                <span>{h.anglicised}</span>
                <span className="mono dim">{h.pron}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PronunciationTrainer() {
  const [groupIdx, setGroupIdx] = React.useState(0);
  const [selected, setSelected] = React.useState(null);
  const groups = window.PHONEMES;
  const group = groups[groupIdx];

  React.useEffect(() => {
    setSelected(group.items[0]);
  }, [groupIdx]);

  return (
    <div className="trainer">
      <div className="trainer-tabs">
        {groups.map((g, i) => (
          <button
            key={g.group}
            className={`trainer-tab ${i === groupIdx ? "active" : ""}`}
            onClick={() => setGroupIdx(i)}
          >
            <span className="tab-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="tab-name">{g.group}</span>
          </button>
        ))}
      </div>

      <div className="trainer-body">
        <div className="trainer-left">
          <div className="group-description">{group.description}</div>
          <div className="phoneme-grid">
            {group.items.map((item) => (
              <PhonemeCard
                key={item.letters}
                item={item}
                active={selected && selected.letters === item.letters}
                onClick={() => setSelected(item)}
              />
            ))}
          </div>
        </div>

        <div className="trainer-right">
          {selected && <PhonemeDetail item={selected} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PronunciationTrainer });
