// silhouette.jsx
// Generates a stylised SVG silhouette of a Scottish hill based on its
// generic word (sgùrr/càrn/meall/...) and color-tints it from any color
// adjectives present in the name.
//
// Designed to render at any size — viewBox is 200x100.
// Background is transparent; caller controls placement and bg.

const SHAPE_PATHS = {
  // Sharp pyramidal peak — sgùrr, sgòr, binnein
  sharp: (variant = 0) => {
    const variants = [
      "M0,100 L20,98 L52,72 L78,38 L100,8 L122,42 L150,68 L182,96 L200,100 Z",
      "M0,100 L18,96 L42,76 L70,52 L92,18 L120,46 L148,72 L178,94 L200,100 Z",
      "M0,100 L24,94 L50,68 L82,30 L108,12 L138,50 L172,80 L200,100 Z",
    ];
    return variants[variant % variants.length];
  },
  // Pinnacled / serrated — bidean, stùc, stac, eighe
  pinnacle: () =>
    "M0,100 L12,86 L28,72 L42,82 L58,56 L74,68 L90,28 L108,46 L122,18 L140,42 L156,30 L172,58 L188,76 L200,82 L200,100 Z",
  // Stubby pointed — stob
  stub: () =>
    "M0,100 L26,94 L58,80 L86,52 L102,32 L118,52 L146,82 L180,96 L200,100 Z",
  // Classic mountain — beinn (mid-symmetric, slightly asymmetric)
  classic: (variant = 0) => {
    const variants = [
      "M0,100 L24,90 L58,68 L84,40 L106,24 L130,42 L160,68 L184,90 L200,100 Z",
      "M0,100 L22,86 L50,60 L80,32 L112,28 L138,50 L166,76 L188,94 L200,100 Z",
    ];
    return variants[variant % variants.length];
  },
  // Rounded dome — meall, mam, sìth, cùl
  dome: (variant = 0) => {
    const variants = [
      "M0,100 C20,92 50,76 90,40 C110,28 130,28 150,50 C170,72 188,90 200,100 Z",
      "M0,100 C16,90 44,70 78,46 C104,30 134,38 158,60 C178,78 192,92 200,100 Z",
    ];
    return variants[variant % variants.length];
  },
  // Cairn pile — càrn
  cairn: () =>
    "M0,100 C18,94 36,84 50,76 C60,70 68,68 78,62 C92,54 100,42 116,42 C132,42 142,56 154,64 C168,72 184,84 200,96 L200,100 Z",
  // Knoll — tom, cnoc
  knoll: () =>
    "M0,100 C30,96 60,84 100,68 C140,54 170,80 200,98 L200,100 Z",
  // Long ridge with bumps — aonach, druim, monadh
  ridge: () =>
    "M0,100 L16,76 L36,60 L58,56 L82,40 L108,42 L132,38 L156,52 L178,68 L200,90 L200,100 Z",
  // Nose projection — sròn
  nose: () =>
    "M0,100 L16,88 L34,74 L56,58 L78,46 L100,38 L126,38 L150,52 L174,76 L194,94 L200,100 Z",
  // Spur — sail
  spur: () =>
    "M0,100 L20,90 L46,72 L72,52 L98,42 L126,50 L150,68 L178,86 L200,100 Z",
  // Crag — creag
  crag: () =>
    "M0,100 L14,82 L28,86 L46,54 L70,42 L88,48 L100,22 L118,28 L138,62 L160,58 L182,82 L200,94 L200,100 Z",
  // Slab — leac
  slab: () =>
    "M0,100 L18,86 L40,68 L66,54 L94,52 L128,52 L156,58 L180,76 L200,92 L200,100 Z",
  // Plateau — monadh (broad flat top)
  plateau: () =>
    "M0,100 L18,76 L40,52 L72,38 L108,36 L142,38 L168,50 L184,72 L200,92 L200,100 Z",
};

const SHAPE_LABEL = {
  sharp: "Sharp peak",
  pinnacle: "Pinnacled",
  stub: "Stubby point",
  classic: "Classic mountain",
  dome: "Rounded dome",
  cairn: "Cairn / heap",
  knoll: "Low knoll",
  ridge: "Long ridge",
  nose: "Nose / promontory",
  spur: "Spur",
  crag: "Crag",
  slab: "Flat slab",
  plateau: "Plateau",
};

// Look at all parts of a hill name; find the first generic, return its shape.
function shapeFor(hill) {
  for (const p of hill.parts) {
    const r = window.ROOTS[p.root];
    if (r && r.type === "generic" && r.shape) return r.shape;
  }
  return "classic";
}

// Look for a color adjective in the parts; return its hex if found.
function tintFor(hill) {
  for (const p of hill.parts) {
    const r = window.ROOTS[p.root];
    if (r && r.type === "color" && r.hex) return r.hex;
  }
  return null;
}

// Stable variant index from name (for sharp/classic/dome variations).
function variantFor(hill) {
  let h = 0;
  for (let i = 0; i < hill.name.length; i++) h = (h * 31 + hill.name.charCodeAt(i)) >>> 0;
  return h % 3;
}

// Height bracket — drives an indicator strip beside the hill.
function heightBracket(h) {
  if (h >= 1200) return { label: "1200m+", level: 6 };
  if (h >= 1000) return { label: "1000m+", level: 5 };
  if (h >= 914)  return { label: "Munro",  level: 4 };
  if (h >= 762)  return { label: "Corbett", level: 3 };
  if (h >= 610)  return { label: "Fiona",   level: 2 };
  return { label: "<610m", level: 1 };
}

function HillSilhouette({ hill, size = 180, showHeight = true, monochrome = false, inkColor }) {
  const shape = shapeFor(hill);
  const path = SHAPE_PATHS[shape](variantFor(hill));
  const tint = tintFor(hill);
  const bracket = heightBracket(hill.height);
  const ink = inkColor || "var(--ink, #1a1a1a)";

  // Compose the fill — if there's a color adjective, blend with the ink color.
  const baseFill = monochrome || !tint ? ink : tint;
  const id = `silhouette-${hill.anglicised.replace(/\s+/g, "-")}`;

  return (
    <svg viewBox="0 0 220 130" width={size} height={size * 0.59}
         style={{ display: "block", overflow: "visible" }}
         aria-label={`${hill.anglicised} silhouette — ${SHAPE_LABEL[shape]}, ${hill.height}m (${bracket.label})`}>
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={baseFill} stopOpacity="1" />
          <stop offset="1" stopColor={baseFill} stopOpacity="0.78" />
        </linearGradient>
        {/* subtle shadow */}
        <filter id={`${id}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
      </defs>

      {/* horizon line */}
      <line x1="0" y1="100" x2="220" y2="100" stroke={ink} strokeOpacity="0.15" strokeWidth="0.4" />

      {/* the hill */}
      <g transform="translate(0,0)">
        <path d={path} fill={`url(#${id}-grad)`} stroke={ink} strokeOpacity="0.4" strokeWidth="0.6" />
      </g>

      {/* Height tier indicator — rungs fill from the bottom as a hill clears
          each Scottish classification threshold (Fiona 610m, Corbett 762m,
          Munro 914m, 1000m+, 1200m+). The caption underneath names the
          highest tier reached, so the rungs aren't a mystery gauge. */}
      {showHeight && (
        <g transform="translate(198, 14)">
          <title>{`Height: ${hill.height}m — ${bracket.label}`}</title>

          {/* Column label: "ALT" — sets the user's frame */}
          <text x="6" y="-2" textAnchor="middle"
                fontFamily="var(--font-mono, ui-monospace)"
                fontSize="4.5"
                fill={ink}
                fillOpacity="0.55"
                letterSpacing="0.5">ALT</text>

          {/* The six rungs, top-down: 1200m+, 1000m+, Munro, Corbett, Fiona, <610m */}
          {[6, 5, 4, 3, 2, 1].map((lvl, i) => (
            <rect key={lvl} x="0" y={i * 9 + 2} width="12" height="2.6"
                  rx="0.5"
                  fill={ink}
                  fillOpacity={lvl <= bracket.level ? 0.65 : 0.12} />
          ))}

          {/* Active-tier label below the rungs */}
          <text x="6" y={6 * 9 + 9} textAnchor="middle"
                fontFamily="var(--font-mono, ui-monospace)"
                fontSize="5"
                fontWeight="500"
                fill={ink}
                fillOpacity="0.85"
                letterSpacing="0.3">{bracket.label}</text>
          <text x="6" y={6 * 9 + 15.5} textAnchor="middle"
                fontFamily="var(--font-mono, ui-monospace)"
                fontSize="4.2"
                fill={ink}
                fillOpacity="0.5">{hill.height}m</text>
        </g>
      )}
    </svg>
  );
}

// A small inline glyph showing just the shape — for the field guide
function ShapeGlyph({ shape, size = 56, ink }) {
  const path = SHAPE_PATHS[shape]?.(0) || SHAPE_PATHS.classic(0);
  const c = ink || "currentColor";
  return (
    <svg viewBox="0 0 200 100" width={size} height={size * 0.5}>
      <path d={path} fill={c} fillOpacity="0.85" />
    </svg>
  );
}

Object.assign(window, { HillSilhouette, ShapeGlyph, SHAPE_LABEL, SHAPE_PATHS });
