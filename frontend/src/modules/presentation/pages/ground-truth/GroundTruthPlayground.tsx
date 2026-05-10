import { useState, useEffect, useRef } from 'react';
import './styles.css';

// Imported as raw strings so the iframes never depend on static-file serving.
// Vite bundles these at build time — no public-folder routing needed.
import freeCap from '../../../../../public/ground-truth/sendgrid-2025/capacity/free-50k.html?raw';
import proCap from '../../../../../public/ground-truth/sendgrid-2025/capacity/pro-50k.html?raw';
import ultraCap from '../../../../../public/ground-truth/sendgrid-2025/capacity/ultra-50k.html?raw';
import megaCap from '../../../../../public/ground-truth/sendgrid-2025/capacity/mega-50k.html?raw';
import freeExh from '../../../../../public/ground-truth/sendgrid-2025/exhaustions/free.html?raw';
import proExh from '../../../../../public/ground-truth/sendgrid-2025/exhaustions/pro.html?raw';
import ultraExh from '../../../../../public/ground-truth/sendgrid-2025/exhaustions/ultra.html?raw';
import megaExh from '../../../../../public/ground-truth/sendgrid-2025/exhaustions/mega.html?raw';
import rec1 from '../../../../../public/ground-truth/sendgrid-2025/recommendations/first.html?raw';
import rec2 from '../../../../../public/ground-truth/sendgrid-2025/recommendations/second.html?raw';
import rec3 from '../../../../../public/ground-truth/sendgrid-2025/recommendations/third.html?raw';
import rec4 from '../../../../../public/ground-truth/sendgrid-2025/recommendations/fourth.html?raw';
import demands from '../../../../../public/ground-truth/sendgrid-2025/demands.html?raw';

// ── Types ──────────────────────────────────────────────────────────────────

interface PlaygroundQuestion {
  id: string;
  icon: string;
  label: string;
  description?: string;
  response: string;
  charts?: { label: string; key: string }[];
  sectionStart?: string;
}

interface ApiScenario {
  id: string;
  name: string;
  icon: string;
  questions: PlaygroundQuestion[];
}

// ── Chart HTML map ─────────────────────────────────────────────────────────

const CHART_HTML: Record<string, string> = {
  freeCap, proCap, ultraCap, megaCap,
  freeExh, proExh, ultraExh, megaExh,
  rec1, rec2, rec3, rec4,
  demands,
};

function makeBlobUrl(key: string): string {
  const html = CHART_HTML[key];
  if (!html) return '';
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

// ── Ground truth data ──────────────────────────────────────────────────────

const DISCLAIMER = `⚠️  Nota: todos los resultados asumen CRF = 1 (1 email por petición) y concurrencia = 1.`;

const SENDGRID_2025_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-50k',
    sectionStart: '🔍 Propósito general',
    icon: '⏱',
    label: '¿Cuánto tiempo necesito para enviar 50.000 emails?',
    response:
      `Tiempo mínimo para enviar 50.000 emails (capacity_goal = 50.000)
Endpoint: /mail/send

  Plan Free   →  999 días y 5 segundos
  Plan Pro    →  30 días, 16 min y 40 s
  Plan Ultra  →  1 h, 23 min y 20 s
  Plan Mega   →  16 min y 40 s

${DISCLAIMER}`,
    charts: [
      { label: 'Free',  key: 'freeCap' },
      { label: 'Pro',   key: 'proCap' },
      { label: 'Ultra', key: 'ultraCap' },
      { label: 'Mega',  key: 'megaCap' },
    ],
  },
  {
    id: 'max-speed-exhaustion',
    icon: '⚡',
    label: '¿A qué velocidad máxima puedo enviar peticiones y durante cuánto tiempo?',
    charts: [
      { label: 'Free',  key: 'freeExh' },
      { label: 'Pro',   key: 'proExh' },
      { label: 'Ultra', key: 'ultraExh' },
      { label: 'Mega',  key: 'megaExh' },
    ],
    response:
      `Velocidad máxima de envío y tiempo hasta agotar la cuota
Endpoint: /mail/send

Velocidad máxima (rate limit):
  Plan Free   →  10 req/s
  Plan Pro    →  10 req/s
  Plan Ultra  →  10 req/s
  Plan Mega   →  50 req/s

Tiempo hasta agotar la cuota a máxima velocidad (CRF = 1):
  Plan Free   →  5 s
  Plan Pro    →  1 h 6 min 40 s
  Plan Ultra  →  2 h 46 min 40 s
  Plan Mega   →  1 h 40 min

${DISCLAIMER}`,
  },
  {
    id: 'supports-demand-over-time',
    icon: '📈',
    label: '¿Puedo enviar 10 peticiones por segundo (10RPS) y 2000 peticiones al día (RPD)?',
    charts: [{ label: 'Comprueba la demanda', key: 'demands' }],
    response:
      `¿Puedo enviar 10 RPS y 2000 RPD?
Endpoint: /mail/send

  Plan Free   →  ❌ NO (quota_exceeded) — límite: 50 emails/día
  Plan Pro    →  ❌ NO (quota_exceeded) — límite: 40.000 emails/mes
  Plan Ultra  →  ✅ SÍ
  Plan Mega   →  ✅ SÍ

${DISCLAIMER}`,
  },
  {
    id: 'idle-time-period',
    icon: '🔄',
    label: '¿Cuánto tiempo tendré que esperar tras consumir toda mi cuota?',
    response:
      `Tiempo de espera tras agotar la cuota a máxima velocidad
Endpoint: /mail/send

  Plan Free   →  23 h 59 min 55 s
  Plan Pro    →  29 días 22 h 53 min 20 s
  Plan Ultra  →  29 días 21 h 13 min 20 s
  Plan Mega   →  29 días 22 h 20 min

${DISCLAIMER}`,
  },
];

const SENDGRID_2025_OPTIMAL: PlaygroundQuestion[] = [
  {
    id: 'optimal-overage-50k',
    sectionStart: '💡 Suscripción óptima',
    icon: '💰',
    label: '¿Cuál es la suscripción óptima para 50.000 correos/mes (overage permitido)?',
    description: 'optimal · desired_capacity=50.000 · overage permitido',
    charts: [{ label: 'Ver recomendación', key: 'rec1' }],
    response:
      `Suscripción óptima · 50.000 correos/mes · overage permitido
Endpoint: /mail/send

  Plan Pro    →  $19.95/mes  (base $9.95 + overage $10.00)   ✅ más económico
  Plan Free   →  $49.95/mes  (base $0.00 + overage $49.95)
  Plan Ultra  →  $79.95/mes  (sin overage)
  Plan Mega   →  $199.95/mes (sin overage, 16 min 40 s)

${DISCLAIMER}`,
  },
  {
    id: 'optimal-no-overage-50k',
    icon: '🚫',
    label: '¿Y si no quiero incurrir en costes de overage?',
    description: 'optimal · desired_capacity=50.000 · sin overage',
    charts: [{ label: 'Ver recomendación', key: 'rec2' }],
    response:
      `Suscripción óptima · 50.000 correos/mes · sin overage
Endpoint: /mail/send

  Plan Ultra  →  $79.95/mes  ✅ más económico sin overage
  Plan Mega   →  $199.95/mes
  Plan Pro / Free requieren overage → descartados

${DISCLAIMER}`,
  },
  {
    id: 'optimal-budget-50k',
    icon: '🏷️',
    label: '¿Y si además tengo un presupuesto máximo de $40/mes?',
    description: 'optimal · desired_capacity=50.000 · max_budget=$40',
    charts: [{ label: 'Ver recomendación', key: 'rec3' }],
    response:
      `Suscripción óptima · 50.000 correos/mes · presupuesto $40
Endpoint: /mail/send

  Plan Pro    →  $19.95/mes  ✅ único viable (margen $20.05)
  Resto superan el límite de $40

${DISCLAIMER}`,
  },
  {
    id: 'optimal-100k',
    icon: '🔀',
    label: '¿Cuál es la mejor suscripción para 100.000 correos al mes?',
    description: 'optimal · desired_capacity=100.000',
    charts: [{ label: 'Ver recomendación', key: 'rec4' }],
    response:
      `Suscripción óptima · 100.000 correos/mes
Endpoint: /mail/send

  Plan Pro    →  $69.95/mes  ✅ más económico  (base $9.95 + overage $60)
  Plan Ultra  →  $79.95/mes  (solo $10 más, sin overage)
  Plan Free   →  $99.95/mes
  Plan Mega   →  $199.95/mes (33 min 20 s)

${DISCLAIMER}`,
  },
];

const SENDGRID_2026_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-1000',
    icon: '⏱',
    label: 'How much time to send 1,000 requests?',
    description: 'min-time · capacity_goal=1000 · datasheet: sendgrid-2026',
    response: '_Pending ground truth — run in Bruno and fill in._',
  },
];

const MAILERSEND_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-1000',
    icon: '⏱',
    label: 'How much time to send 1,000 requests?',
    description: 'min-time · capacity_goal=1000 · datasheet: mailersend',
    response: '_Pending ground truth — run in Bruno and fill in._',
  },
];

const PEERTUBE_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-1000',
    icon: '⏱',
    label: 'How much time to send 1,000 requests?',
    description: 'min-time · capacity_goal=1000 · datasheet: peertube',
    response: '_Pending ground truth — run in Bruno and fill in._',
  },
];

const DAILYMOTION_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-1000',
    icon: '⏱',
    label: 'How much time to send 1,000 requests?',
    description: 'min-time · capacity_goal=1000 · datasheet: dailymotion',
    response: '_Pending ground truth — run in Bruno and fill in._',
  },
];

const SCENARIOS: ApiScenario[] = [
  { id: 'sendgrid-2025', name: 'Sendgrid 2025', icon: '📧', questions: [...SENDGRID_2025_QUESTIONS, ...SENDGRID_2025_OPTIMAL] },
  { id: 'sendgrid-2026', name: 'Sendgrid 2026', icon: '📧', questions: SENDGRID_2026_QUESTIONS },
  { id: 'mailersend',    name: 'Mailersend',    icon: '✉️',  questions: MAILERSEND_QUESTIONS },
  { id: 'peertube',      name: 'PeerTube',      icon: '📹',  questions: PEERTUBE_QUESTIONS },
  { id: 'dailymotion',   name: 'Dailymotion',   icon: '🎬',  questions: DAILYMOTION_QUESTIONS },
];

// ── Question card ──────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: PlaygroundQuestion }) {
  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const blobUrls = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(blobUrls.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  function openChart(key: string) {
    if (!blobUrls.current[key]) {
      blobUrls.current[key] = makeBlobUrl(key);
    }
    setActiveUrl(blobUrls.current[key]);
  }

  return (
    <>
      <div className={`gt-card${open ? ' gt-card--open' : ''}`}>
        <button
          type="button"
          className="gt-card-header"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="gt-card-icon">{question.icon}</span>
          <span className="gt-card-meta">
            <span className="gt-card-label">{question.label}</span>
            {question.description && (
              <span className="gt-card-desc">{question.description}</span>
            )}
          </span>
          <span className="gt-card-chevron">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="gt-card-body">
            <div className="gt-response">
              <p className="gt-response-title">Ground truth response</p>
              <pre className="gt-response-pre">{question.response}</pre>
            </div>
            {question.charts && question.charts.length > 0 && (
              <div className="gt-charts">
                {question.charts.map((chart) => (
                  <button
                    key={chart.key}
                    type="button"
                    className="gt-chart-btn"
                    onClick={() => openChart(chart.key)}
                  >
                    📈 {chart.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {activeUrl && (
        <div className="gt-modal-overlay" onClick={() => setActiveUrl(null)}>
          <div className="gt-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gt-modal-close"
              onClick={() => setActiveUrl(null)}
            >
              ✕
            </button>
            <iframe className="gt-modal-iframe" src={activeUrl} title="Chart" />
          </div>
        </div>
      )}
    </>
  );
}

// ── Main playground ────────────────────────────────────────────────────────

export default function GroundTruthPlayground() {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((s) => s.id === activeScenario) ?? SCENARIOS[0];

  return (
    <div className="gt-playground">
      <div className="gt-header">
        <div>
          <h2 className="gt-title">
            PRIME4API <span className="gt-badge">Ground Truth</span>
          </h2>
          <p className="gt-subtitle">Reference responses for validating H.A.R.V.E.Y. answers.</p>
        </div>
      </div>

      <div className="gt-tabs">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`gt-tab${s.id === activeScenario ? ' gt-tab--active' : ''}`}
            onClick={() => setActiveScenario(s.id)}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      <div className="gt-questions">
        {scenario.questions.map((q) => (
          <div key={q.id}>
            {q.sectionStart && <h3 className="gt-section-heading">{q.sectionStart}</h3>}
            <QuestionCard question={q} />
          </div>
        ))}
      </div>
    </div>
  );
}
