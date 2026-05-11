import { useState } from 'react';
import './styles.css';

const CHARTS_BASE = import.meta.env.VITE_CHARTS_BASE_URL ?? '';
const chart = (path: string) => `${CHARTS_BASE}${path}`;

// ── Types ──────────────────────────────────────────────────────────────────

interface PlaygroundQuestion {
  id: string;
  icon: string;
  label: string;
  description?: string;
  response: string;
  charts?: { label: string; url: string }[];
  sectionStart?: string;
}

interface ApiScenario {
  id: string;
  name: string;
  icon: string;
  questions: PlaygroundQuestion[];
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
      { label: 'Free', url: chart('/ground-truth/sendgrid-2025/capacity/single-free-50k.html') },
      { label: 'Pro', url: chart('/ground-truth/sendgrid-2025/capacity/single-pro-50k.html') },
      { label: 'Ultra', url: chart('/ground-truth/sendgrid-2025/capacity/single-ultra-50k.html') },
      { label: 'Mega', url: chart('/ground-truth/sendgrid-2025/capacity/single-mega-50k.html') },
    ],
  },
  {
    id: 'max-speed-exhaustion',
    icon: '⚡',
    label: '¿A qué velocidad máxima puedo enviar peticiones y durante cuánto tiempo?',
    charts: [
      { label: 'Free', url: chart('/ground-truth/sendgrid-2025/exhaustions/free.html') },
      { label: 'Pro', url: chart('/ground-truth/sendgrid-2025/exhaustions/pro.html') },
      { label: 'Ultra', url: chart('/ground-truth/sendgrid-2025/exhaustions/ultra.html') },
      { label: 'Mega', url: chart('/ground-truth/sendgrid-2025/exhaustions/mega.html') },
      { label: 'Full Pricing', url: chart('/ground-truth/sendgrid-2025/exhaustions/combined.html') },
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
    charts: [{ label: 'Comprueba la demanda', url: chart('/ground-truth/sendgrid-2025/demands-ground-truth.html') }],
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
    charts: [{ label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/first.html') }],
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
    charts: [{ label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/second.html') }],
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
    charts: [{ label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/third.html') }],
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
    charts: [{ label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/fourth.html') }],
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

const SENDGRID_2025_NO_OVERAGE: PlaygroundQuestion[] = [
  {
    id: 'exhaustion-crf',
    icon: '⏳',
    label: '¿Cuánto tardo en agotar mi cuota?',
    response:
      `Tiempo hasta agotar la cuota · Sin overage
Endpoint: /mail/send

3 casuísticas según el número de emails por llamada (CRF):

  CRF = 1    →  1 email por petición
  CRF = 500  →  500 emails por petición
  Variable   →  número variable de emails por petición

Consulta cada gráfico para ver el desglose de agotamiento por plan.`,
    charts: [
      { label: 'CRF = 1', url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-1.html') },
      { label: 'CRF = 500', url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-500.html') },
      { label: 'CRF Variable', url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-variable.html') },
    ],
  },
  {
    id: 'consume-40k-pro',
    icon: '📬',
    label: '¿Cuánto tardo en consumir 40.000 correos? (Plan PRO)',
    description: 'capacity · quota=40.000 · plan PRO · sin overage',
    response:
      `Tiempo para consumir 40.000 correos · Plan PRO · Sin overage
Endpoint: /mail/send

  Plan Pro  →  Consulta el gráfico para el desglose temporal detallado.

Cuota del plan PRO: 40.000 emails/mes`,
    charts: [
      { label: 'PRO · 40k emails', url: chart('/ground-truth/sendgrid-2025-no-overage/capacity/pro-40k.html') },
    ],
  },
];

const DBLP_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'dblp-20s-1m',
    sectionStart: '⏱ Rate limits',
    icon: '🔢',
    label: '¿Cuántas peticiones puedo hacer en 20 segundos? (período de análisis: 1 min)',
    description: 'rate-limit · window=20s · analysis_period=1m',
    response:
      `Peticiones posibles en 20 s · Período de análisis: 1 minuto
Endpoint: DBLP API

Consulta el gráfico para ver el número máximo de peticiones alcanzables en una ventana de 20 segundos bajo un período de análisis de 1 minuto.`,
    charts: [
      { label: '20s / 1m', url: chart('/ground-truth/dblp/20seg.html') },
    ],
  },
  {
    id: 'dblp-5m-10m',
    icon: '🔢',
    label: '¿Cuántas peticiones puedo hacer en 5 minutos? (período de análisis: 10 min)',
    description: 'rate-limit · window=5m · analysis_period=10m',
    response:
      `Peticiones posibles en 5 min · Período de análisis: 10 minutos
Endpoint: DBLP API

Consulta el gráfico para ver el número máximo de peticiones alcanzables en una ventana de 5 minutos bajo un período de análisis de 10 minutos.`,
    charts: [
      { label: '5m / 10m', url: chart('/ground-truth/dblp/5min.html') },
    ],
  },
  {
    id: 'dblp-40m-60m',
    icon: '🔢',
    label: '¿Cuántas peticiones puedo hacer en 40 minutos? (período de análisis: 60 min)',
    description: 'rate-limit · window=40m · analysis_period=60m',
    response:
      `Peticiones posibles en 40 min · Período de análisis: 60 minutos
Endpoint: DBLP API

Consulta el gráfico para ver el número máximo de peticiones alcanzables en una ventana de 40 minutos bajo un período de análisis de 60 minutos.`,
    charts: [
      { label: '40m / 60m', url: chart('/ground-truth/dblp/40min.html') },
    ],
  },
];

const SCENARIOS: ApiScenario[] = [
  { id: 'sendgrid-2025', name: 'Sendgrid - Fresno Phd.', icon: '📧', questions: [...SENDGRID_2025_QUESTIONS, ...SENDGRID_2025_OPTIMAL] },
  { id: 'sendgrid-2025-no-overage', name: 'Sendgrid 2025', icon: '📧', questions: SENDGRID_2025_NO_OVERAGE },
  { id: 'sendgrid-2026', name: 'Sendgrid 2026', icon: '📧', questions: [] },
  { id: 'dblp', name: 'DBLP - API', icon: '📚', questions: DBLP_QUESTIONS },
];

// ── Question card ──────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: PlaygroundQuestion }) {
  const [open, setOpen] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

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
                    key={chart.url}
                    type="button"
                    className="gt-chart-btn"
                    onClick={() => setActiveUrl(chart.url)}
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
        <h2 className="gt-title">
          PRIME4API <span className="gt-badge">Ground Truth</span>
        </h2>
        <p className="gt-subtitle">Reference responses for validating H.A.R.V.E.Y. answers.</p>
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
