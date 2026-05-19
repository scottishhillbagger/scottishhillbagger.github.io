// quiz.jsx
// Quiz mode — three game types in one. Tracks streak + accuracy in-session.

const QUIZ_TYPES = [
  { id: "meaning",      label: "Meaning",       sub: "Decode the hill name." },
  { id: "pronounce",    label: "Pronunciation", sub: "Pick the right way to say it." },
  { id: "roots",        label: "Roots",         sub: "Learn the building blocks." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pool of root entries worth drilling — substantive types only.
function rootPool() {
  return Object.entries(window.ROOTS)
    .map(([key, val]) => ({ key, ...val }))
    .filter(r =>
      r.type === "generic" || r.type === "color" ||
      (r.type === "adj" && r.meaning && !/^the/i.test(r.meaning))
    );
}

function pickQuestion(type, prevKey) {
  if (type === "meaning") {
    const hills = window.HILLS.filter(h => h.anglicised !== prevKey);
    const target = hills[Math.floor(Math.random() * hills.length)];
    const others = shuffle(hills.filter(h => h.anglicised !== target.anglicised)).slice(0, 3);
    const options = shuffle([target, ...others]).map(h => ({ id: h.anglicised, label: h.meaning }));
    return { type, target, key: target.anglicised, options, correctId: target.anglicised };
  }
  if (type === "pronounce") {
    const hills = window.HILLS.filter(h => h.anglicised !== prevKey);
    const target = hills[Math.floor(Math.random() * hills.length)];
    const others = shuffle(hills.filter(h => h.anglicised !== target.anglicised)).slice(0, 3);
    const options = shuffle([
      { id: "correct", label: target.pron },
      ...others.map((h, i) => ({ id: `wrong-${i}`, label: h.pron })),
    ]);
    return { type, target, key: target.anglicised, options, correctId: "correct" };
  }
  if (type === "roots") {
    // Half the time Gaelic→English, half English→Gaelic
    const direction = Math.random() < 0.5 ? "g2e" : "e2g";
    const pool = rootPool().filter(r => r.key !== prevKey);
    const target = pool[Math.floor(Math.random() * pool.length)];
    // Distractors should be the same type for plausible options
    const sameType = shuffle(pool.filter(r => r.type === target.type && r.key !== target.key));
    const distractors = sameType.length >= 3
      ? sameType.slice(0, 3)
      : [...sameType, ...shuffle(pool.filter(r => r.key !== target.key && !sameType.includes(r))).slice(0, 3 - sameType.length)];
    const all = shuffle([target, ...distractors]);
    const options = all.map(r => ({
      id: r.key,
      label: direction === "g2e" ? r.meaning : r.key,
    }));
    return {
      type, direction, target,
      key: target.key,
      options,
      correctId: target.key,
    };
  }
}

function Quiz() {
  const [type, setType] = React.useState("meaning");
  const [question, setQuestion] = React.useState(() => pickQuestion("meaning"));
  const [selected, setSelected] = React.useState(null);
  const [reveal, setReveal] = React.useState(false);
  const [stats, setStats] = React.useState({ correct: 0, total: 0, streak: 0, best: 0 });

  const next = (newType) => {
    const t = newType || type;
    setQuestion(pickQuestion(t, question.key));
    setSelected(null);
    setReveal(false);
  };

  const choose = (optId) => {
    if (reveal) return;
    setSelected(optId);
    setReveal(true);
    const correct = optId === question.correctId;
    setStats(s => {
      const streak = correct ? s.streak + 1 : 0;
      return {
        correct: s.correct + (correct ? 1 : 0),
        total: s.total + 1,
        streak,
        best: Math.max(s.best, streak),
      };
    });
  };

  const switchType = (t) => {
    setType(t);
    next(t);
  };

  const accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div className="quiz-types">
          {QUIZ_TYPES.map(qt => (
            <button
              key={qt.id}
              className={`quiz-type ${type === qt.id ? "active" : ""}`}
              onClick={() => switchType(qt.id)}
            >
              <div className="qt-label">{qt.label}</div>
              <div className="qt-sub">{qt.sub}</div>
            </button>
          ))}
        </div>
        <div className="quiz-stats">
          <div className="stat">
            <div className="stat-value">{stats.correct}/{stats.total}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat">
            <div className="stat-value">{accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.streak}<span className="dim"> / {stats.best}</span></div>
            <div className="stat-label">Streak</div>
          </div>
        </div>
      </div>

      <div className="quiz-body">
        {/* First-visit intro: visible only before any question has been
            answered. Tells the user what this surface is for. Disappears
            after the first answer; the stats row carries the context. */}
        {stats.total === 0 && (
          <div className="quiz-intro">
            Drill the vocabulary from the tour with random questions.
            Three modes — pick one above. Streak and accuracy track
            for the session.
          </div>
        )}
        <QuizPrompt question={question} />
        <QuizOptions
          question={question}
          selected={selected}
          reveal={reveal}
          onChoose={choose}
        />
        <div className="quiz-footer">
          {reveal && <QuizFeedback question={question} selected={selected} />}
          <button className="btn-primary quiz-next" onClick={() => next()} disabled={!reveal}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizPrompt({ question }) {
  if (question.type === "meaning") {
    return (
      <div className="quiz-prompt">
        <div className="prompt-label">What does this hill name mean?</div>
        <div className="prompt-hill">{question.target.anglicised}</div>
        <div className="prompt-pron mono">{question.target.pron}</div>
      </div>
    );
  }
  if (question.type === "pronounce") {
    return (
      <div className="quiz-prompt">
        <div className="prompt-label">How do you say this hill?</div>
        <div className="prompt-hill">{question.target.anglicised}</div>
        <div className="prompt-meaning">"{question.target.meaning}"</div>
      </div>
    );
  }
  if (question.type === "roots") {
    const { direction, target } = question;
    if (direction === "g2e") {
      return (
        <div className="quiz-prompt">
          <div className="prompt-label">What does this Gaelic root mean?</div>
          <div className="prompt-hill">{target.key}</div>
          <div className="prompt-pron mono">{target.pron}</div>
        </div>
      );
    }
    return (
      <div className="quiz-prompt">
        <div className="prompt-label">Which Gaelic root means this?</div>
        <div className="prompt-hill">"{target.meaning}"</div>
        <div className="prompt-meaning">{target.type === "generic" ? "(a kind of hill)" : target.type === "color" ? "(a colour)" : "(a descriptor)"}</div>
      </div>
    );
  }
}

function QuizOptions({ question, selected, reveal, onChoose }) {
  return (
    <div className="quiz-options text">
      {question.options.map((opt, i) => {
        const isSelected = selected === opt.id;
        const isCorrect = opt.id === question.correctId;
        const cls = reveal
          ? (isCorrect ? "correct" : isSelected ? "wrong" : "neutral")
          : (isSelected ? "selected" : "");
        return (
          <button
            key={opt.id}
            className={`option text-option ${cls}`}
            onClick={() => onChoose(opt.id)}
            disabled={reveal}
          >
            <span className="option-marker">{String.fromCharCode(65 + i)}</span>
            <span className="option-text">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuizFeedback({ question, selected }) {
  const right = selected === question.correctId;
  const cls = right ? "right" : "wrong";
  if (question.type === "roots") {
    const t = question.target;
    return (
      <div className={`quiz-feedback ${cls}`}>
        {right ? "Right. " : "Not quite. "}
        <strong>{t.key}</strong> <em>({t.pron})</em> means "{t.meaning}".
        {t.note && <span className="feedback-note"> {t.note}</span>}
      </div>
    );
  }
  const t = question.target;
  return (
    <div className={`quiz-feedback ${cls}`}>
      {right ? "Correct. " : "Not quite. "}
      <strong>{t.anglicised}</strong> means "{t.meaning}", said <em>{t.pron}</em>.
    </div>
  );
}

Object.assign(window, { Quiz });
