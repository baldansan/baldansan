/**
 * «Апп болгож суулгах» алхам бүрийн жижиг зураг (SVG). Утасны дэлгэц дээр яг хаана
 * дарахыг харуулна. Товчны нэрийг утсан дээр харагддагаар нь (англиар) үлдээсэн.
 */

type ArtProps = { step: 1 | 2 | 3 };

const INK = "var(--bs-ink)";
const MUTED = "var(--bs-muted)";
const LINE = "var(--bs-line)";
const CARD = "var(--bs-card)";
const BG = "var(--bs-bg)";
const HOT = "var(--bs-green)";
const HOT_SOFT = "color-mix(in srgb, var(--bs-green) 16%, var(--bs-card))";

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <svg className="bs-inst-art" viewBox="0 0 280 132" role="img" aria-label={label}>
      <rect x="1" y="1" width="278" height="130" rx="14" fill={BG} stroke={LINE} strokeWidth="2" />
      {children}
    </svg>
  );
}

/** «Энд дар» гэсэн анивчдаг цагираг. */
function Tap({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle className="bs-inst-pulse" cx={x} cy={y} r="19" fill="none" stroke={HOT} strokeWidth="3" />
      <circle cx={x} cy={y} r="19" fill={HOT} opacity=".12" />
    </g>
  );
}

function ShareIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${x - 7} ${y - 2}v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9`} />
      <path d={`M${x} ${y + 3}v-14`} />
      <path d={`M${x - 5} ${y - 7}l5-5 5 5`} />
    </g>
  );
}

function PlusBox({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round">
      <rect x={x - 8} y={y - 8} width="16" height="16" rx="4" />
      <path d={`M${x} ${y - 4}v8M${x - 4} ${y}h8`} />
    </g>
  );
}

function AppIcon({ x, y, size = 30 }: { x: number; y: number; size?: number }) {
  const id = `bs-inst-clip-${x}-${y}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={size} height={size} rx={size * 0.24} />
      </clipPath>
      <rect x={x} y={y} width={size} height={size} rx={size * 0.24} fill={HOT} />
      <image href="/icons/icon-192.png" x={x} y={y} width={size} height={size} clipPath={`url(#${id})`} />
    </g>
  );
}

export function IosStepArt({ step }: ArtProps) {
  if (step === 1) {
    return (
      <Frame label="Safari-ийн доод мөрөн дэх Share товч">
        <rect x="16" y="16" width="248" height="52" rx="8" fill={CARD} stroke={LINE} />
        <rect x="28" y="28" width="120" height="8" rx="4" fill={LINE} />
        <rect x="28" y="44" width="80" height="8" rx="4" fill={LINE} />
        <rect x="16" y="80" width="248" height="38" rx="12" fill={CARD} stroke={LINE} />
        <path d="M44 93l-6 6 6 6" stroke={MUTED} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M88 93l6 6-6 6" stroke={MUTED} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Tap x={140} y={99} />
        <ShareIcon x={140} y={100} color={HOT} />
        <rect x="183" y="91" width="14" height="16" rx="2" stroke={MUTED} strokeWidth="2.2" fill="none" />
        <rect x="228" y="92" width="13" height="13" rx="3" stroke={MUTED} strokeWidth="2.2" fill="none" />
      </Frame>
    );
  }
  if (step === 2) {
    return (
      <Frame label="Цэснээс Add to Home Screen-ийг сонгох">
        <rect x="16" y="12" width="248" height="108" rx="12" fill={CARD} stroke={LINE} />
        <text x="30" y="35" fontSize="13" fill={MUTED}>Copy</text>
        <line x1="30" y1="46" x2="250" y2="46" stroke={LINE} />
        <text x="30" y="66" fontSize="13" fill={MUTED}>Add Bookmark</text>
        <rect x="22" y="78" width="236" height="34" rx="9" fill={HOT_SOFT} stroke={HOT} strokeWidth="2" />
        <text x="32" y="100" fontSize="14" fontWeight="800" fill={INK}>Add to Home Screen</text>
        <PlusBox x={238} y={95} color={HOT} />
      </Frame>
    );
  }
  return (
    <Frame label="Баруун дээд буланд Add дарах">
      <rect x="16" y="12" width="248" height="108" rx="12" fill={CARD} stroke={LINE} />
      <text x="30" y="36" fontSize="13" fill={MUTED}>Cancel</text>
      <Tap x={234} y={31} />
      <text x="234" y="36" textAnchor="middle" fontSize="14" fontWeight="800" fill={HOT}>Add</text>
      <line x1="16" y1="54" x2="264" y2="54" stroke={LINE} />
      <AppIcon x={30} y={68} size={38} />
      <text x="80" y="85" fontSize="15" fontWeight="800" fill={INK}>Сурцгаая</text>
      <text x="80" y="102" fontSize="11" fill={MUTED}>surtsgaay.buunduu.mn</text>
    </Frame>
  );
}

export function AndroidStepArt({ step }: ArtProps) {
  if (step === 1) {
    return (
      <Frame label="Chrome-ийн баруун дээд буланд байгаа гурван цэг">
        <rect x="16" y="14" width="248" height="40" rx="12" fill={CARD} stroke={LINE} />
        <rect x="28" y="23" width="170" height="22" rx="11" fill={BG} stroke={LINE} />
        <text x="40" y="38" fontSize="11" fill={MUTED}>surtsgaay.buunduu.mn</text>
        <Tap x={240} y={34} />
        <circle cx="240" cy="26" r="2.6" fill={HOT} />
        <circle cx="240" cy="34" r="2.6" fill={HOT} />
        <circle cx="240" cy="42" r="2.6" fill={HOT} />
        <rect x="16" y="66" width="248" height="52" rx="8" fill={CARD} stroke={LINE} />
        <rect x="28" y="78" width="120" height="8" rx="4" fill={LINE} />
        <rect x="28" y="94" width="80" height="8" rx="4" fill={LINE} />
      </Frame>
    );
  }
  if (step === 2) {
    return (
      <Frame label="Цэснээс Add to Home screen-ийг сонгох">
        <rect x="70" y="10" width="194" height="112" rx="12" fill={CARD} stroke={LINE} />
        <text x="86" y="33" fontSize="13" fill={MUTED}>New tab</text>
        <text x="86" y="57" fontSize="13" fill={MUTED}>Share…</text>
        <rect x="76" y="68" width="182" height="34" rx="9" fill={HOT_SOFT} stroke={HOT} strokeWidth="2" />
        <text x="86" y="90" fontSize="13.5" fontWeight="800" fill={INK}>Add to Home screen</text>
        <text x="86" y="116" fontSize="11" fill={MUTED}>эсвэл «Install app»</text>
      </Frame>
    );
  }
  return (
    <Frame label="Install товчийг дарах">
      <rect x="30" y="12" width="220" height="108" rx="14" fill={CARD} stroke={LINE} />
      <AppIcon x={44} y={26} size={34} />
      <text x="88" y="41" fontSize="14" fontWeight="800" fill={INK}>Сурцгаая</text>
      <text x="88" y="56" fontSize="11" fill={MUTED}>Install app?</text>
      <text x="128" y="100" textAnchor="middle" fontSize="13" fill={MUTED}>Cancel</text>
      <Tap x={206} y={95} />
      <rect x="174" y="80" width="64" height="30" rx="15" fill={HOT} />
      <text x="206" y="100" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">Install</text>
    </Frame>
  );
}
