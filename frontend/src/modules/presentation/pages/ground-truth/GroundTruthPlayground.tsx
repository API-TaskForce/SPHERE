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
  assumptions?: string;
  charts?: { label: string; url: string }[];
  sectionStart?: string;
}

interface ApiScenario {
  id: string;
  name: string;
  icon: string;
  pricingUrl?: string;
  questions: PlaygroundQuestion[];
}

// ── Ground truth data ──────────────────────────────────────────────────────

const SENDGRID_2025_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'min-time-50k',
    sectionStart: '🔍 Propósito general',
    icon: '⏱',
    label: '¿Cuánto tiempo necesito para enviar 50.000 emails?',
    response:
`¿Cuánto tiempo para enviar 50.000 emails?

  Plan Free   →  999 días y 5 s
  Plan Pro    →  30 días, 16 min y 40 s
  Plan Ultra  →  1 h 23 min 20 s
  Plan Mega   →  16 min 40 s`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1  ·  una petición a la vez

Operaciones
  Si la cuota mensual < 50.000, hay que esperar reinicios de cuota.
  Tiempo total = tiempo_espera_entre_ciclos + tiempo_envío_último_ciclo

  Plan Free   cuota 50 emails/día
              50.000 ÷ 50 = 1.000 días en total
              999 días esperando reinicios + 5 s enviando los últimos 50 emails

  Plan Pro    cuota 40.000 emails/mes  →  necesita 2 ciclos
              Ciclo 1: 40.000 ÷ 10 req/s = 4.000 s  (agota cuota)
              Espera:  30 días hasta reinicio
              Ciclo 2: 10.000 ÷ 10 req/s = 1.000 s = 16 min 40 s
              Total:   30 días + 16 min 40 s

  Plan Ultra  cuota 100.000/mes  ≥  50.000  →  cabe en un ciclo
              50.000 ÷ 10 req/s = 5.000 s = 1 h 23 min 20 s

  Plan Mega   cuota 500.000/mes  ≥  50.000  →  cabe en un ciclo
              50.000 ÷ 50 req/s = 1.000 s = 16 min 40 s`,
    charts: [
      { label: 'Free',  url: chart('/ground-truth/sendgrid-2025/capacity/single-free-50k.html') },
      { label: 'Pro',   url: chart('/ground-truth/sendgrid-2025/capacity/single-pro-50k.html') },
      { label: 'Ultra', url: chart('/ground-truth/sendgrid-2025/capacity/single-ultra-50k.html') },
      { label: 'Mega',  url: chart('/ground-truth/sendgrid-2025/capacity/single-mega-50k.html') },
    ],
  },
  {
    id: 'max-speed-exhaustion',
    icon: '⚡',
    label: '¿A qué velocidad máxima puedo enviar emails y cuánto dura la cuota?',
    response:
`¿A qué velocidad máxima puedo enviar y cuánto aguanta la cuota?

             Velocidad      Cuota agotada en
  Plan Free    10 req/s     5 s
  Plan Pro     10 req/s     1 h 6 min 40 s
  Plan Ultra   10 req/s     2 h 46 min 40 s
  Plan Mega    50 req/s     1 h 40 min`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1  ·  una petición a la vez
  Se envía sin parar a la velocidad máxima del plan desde el inicio.

Operaciones
  tiempo_agotamiento = cuota_mensual ÷ rate_limit

  Plan Free   50 emails   ÷ 10 req/s  =     5 s
  Plan Pro    40.000      ÷ 10 req/s  = 4.000 s  = 1 h 6 min 40 s
  Plan Ultra  100.000     ÷ 10 req/s  = 10.000 s = 2 h 46 min 40 s
  Plan Mega   300.000     ÷ 50 req/s  = 6.000 s  = 1 h 40 min`,
    charts: [
      { label: 'Free',         url: chart('/ground-truth/sendgrid-2025/exhaustions/free.html') },
      { label: 'Pro',          url: chart('/ground-truth/sendgrid-2025/exhaustions/pro.html') },
      { label: 'Ultra',        url: chart('/ground-truth/sendgrid-2025/exhaustions/ultra.html') },
      { label: 'Mega',         url: chart('/ground-truth/sendgrid-2025/exhaustions/mega.html') },
      { label: 'Full Pricing', url: chart('/ground-truth/sendgrid-2025/exhaustions/combined.html') },
    ],
  },
  {
    id: 'supports-demand-over-time',
    icon: '📈',
    label: '¿Puedo mantener 10 RPS y 2.000 emails al día de forma sostenida durante un mes?',
    response:
`¿Puedo mantener 10 RPS y 2.000 emails/día durante 30 días?

  Plan Free   →  ❌  cuota agotada en 5 s  (solo 50 emails en total)
  Plan Pro    →  ❌  cuota agotada a los 20 días  (40.000 emails/mes)
  Plan Ultra  →  ✅  demanda completamente sostenible
  Plan Mega   →  ✅  demanda completamente sostenible`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1  ·  una petición a la vez
  Demanda objetivo: 10 RPS y 2.000 emails/día, sostenida 30 días

Operaciones
  Demanda mensual = 2.000 emails/día × 30 días = 60.000 emails/mes

  Condición 1 — velocidad:  rate_limit ≥ 10 RPS
  Condición 2 — cuota:      cuota_mensual ≥ 60.000 emails

  Plan Free   rate 10 RPS ✅  |  cuota 50/mes << 60.000  ❌  (agota en 5 s)
  Plan Pro    rate 10 RPS ✅  |  cuota 40.000/mes < 60.000  ❌  (agota en 20 días)
  Plan Ultra  rate 10 RPS ✅  |  cuota 100.000/mes ≥ 60.000  ✅
  Plan Mega   rate 50 RPS ✅  |  cuota 500.000/mes ≥ 60.000  ✅`,
    charts: [
      { label: 'Comprueba la demanda', url: chart('/ground-truth/sendgrid-2025/demands-ground-truth.html') },
    ],
  },
  {
    id: 'idle-time-period',
    icon: '🔄',
    label: '¿Cuánto tiempo debo esperar tras agotar la cuota?',
    response:
`¿Cuánto tiempo de espera tras agotar la cuota a tope?

  Plan Free   →  23 h 59 min 55 s
  Plan Pro    →  29 días 22 h 53 min 20 s
  Plan Ultra  →  29 días 21 h 13 min 20 s
  Plan Mega   →  29 días 22 h 20 min`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1  ·  una petición a la vez
  La cuota se agota inmediatamente a velocidad máxima.

Operaciones
  Plan Free tiene cuota diaria (se reinicia cada 24 h).
  El resto tienen cuota mensual (se reinicia cada 30 días).

  tiempo_espera = período_reinicio − tiempo_agotamiento

  Plan Free   24 h      − 5 s                = 23 h 59 min 55 s
  Plan Pro    30 días   − 1 h 6 min 40 s     = 29 días 22 h 53 min 20 s
  Plan Ultra  30 días   − 2 h 46 min 40 s    = 29 días 21 h 13 min 20 s
  Plan Mega   30 días   − 1 h 40 min         = 29 días 22 h 20 min`,
  },
];

const SENDGRID_2025_OPTIMAL: PlaygroundQuestion[] = [
  {
    id: 'optimal-overage-50k',
    sectionStart: '💡 Suscripción óptima',
    icon: '💰',
    label: '¿Cuál es la suscripción más barata para 50.000 emails/mes? (overage permitido)',
    description: 'optimal · desired_capacity=50.000 · overage permitido',
    response:
`¿Cuál es la opción más barata para 50.000 emails al mes?

  Plan Pro    →  $19,95/mes   ✅ más económico
  Plan Free   →  $49,95/mes
  Plan Ultra  →  $79,95/mes
  Plan Mega   →  $199,95/mes`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1
  Objetivo: 50.000 emails/mes  ·  overage permitido

Operaciones
  coste_total = precio_base + max(0, emails_sobrantes × precio_overage)

  Plan Free   $0     + (50.000 − 50)     × $0,001 = $0    + $49,95 = $49,95
  Plan Pro    $9,95  + (50.000 − 40.000) × $0,001 = $9,95 + $10,00 = $19,95  ✅
  Plan Ultra  $79,95 + sin overage (100.000 ≥ 50.000)             = $79,95
  Plan Mega   $199,95 + sin overage                               = $199,95`,
    charts: [
      { label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/first.html') },
    ],
  },
  {
    id: 'optimal-no-overage-50k',
    icon: '🚫',
    label: '¿Y si no quiero pagar costes de overage? (50.000 emails/mes)',
    description: 'optimal · desired_capacity=50.000 · sin overage',
    response:
`¿Cuál es la opción más barata sin overage para 50.000 emails al mes?

  Plan Ultra  →  $79,95/mes   ✅ más económico sin overage
  Plan Mega   →  $199,95/mes

  Plan Free y Pro no cubren 50.000 emails sin overage.`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Objetivo: 50.000 emails/mes
  Restricción: cuota_incluida ≥ objetivo  (overage = $0)

Operaciones
  Filtrar planes con cuota mensual ≥ 50.000 y ordenar por precio base.

  Plan Free   cuota 50/mes     < 50.000  ❌ descartado
  Plan Pro    cuota 40.000/mes < 50.000  ❌ descartado
  Plan Ultra  cuota 100.000/mes ≥ 50.000 ✅  $79,95
  Plan Mega   cuota 500.000/mes ≥ 50.000 ✅  $199,95`,
    charts: [
      { label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/second.html') },
    ],
  },
  {
    id: 'optimal-budget-50k',
    icon: '🏷️',
    label: '¿Y si además tengo un presupuesto máximo de $40/mes?',
    description: 'optimal · desired_capacity=50.000 · max_budget=$40',
    response:
`¿Cuál es la opción óptima para 50.000 emails/mes con un tope de $40?

  Plan Pro  →  $19,95/mes   ✅ único plan viable  (margen de $20,05)

  Resto de planes superan el presupuesto de $40.`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Objetivo: 50.000 emails/mes
  Presupuesto máximo: $40/mes

Operaciones
  Calcular coste_total de cada plan y filtrar los que superen $40.

  Plan Free   $49,95  >  $40  ❌
  Plan Pro    $19,95  ≤  $40  ✅  margen $20,05
  Plan Ultra  $79,95  >  $40  ❌
  Plan Mega   $199,95 >  $40  ❌`,
    charts: [
      { label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/third.html') },
    ],
  },
  {
    id: 'optimal-100k',
    icon: '🔀',
    label: '¿Cuál es la mejor suscripción para 100.000 emails al mes?',
    description: 'optimal · desired_capacity=100.000',
    response:
`¿Cuál es la opción más barata para 100.000 emails al mes?

  Plan Pro    →  $69,95/mes   ✅ más económico
  Plan Ultra  →  $79,95/mes   (solo $10 más, sin overage)
  Plan Free   →  $99,95/mes
  Plan Mega   →  $199,95/mes`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Objetivo: 100.000 emails/mes  ·  overage permitido

Operaciones
  coste_total = precio_base + max(0, emails_sobrantes × precio_overage)

  Plan Free   $0     + (100.000 − 50)      × $0,001 = $0    + $99,95 = $99,95
  Plan Pro    $9,95  + (100.000 − 40.000)  × $0,001 = $9,95 + $60,00 = $69,95  ✅
  Plan Ultra  $79,95 + sin overage (100.000 = 100.000)              = $79,95
  Plan Mega   $199,95 + sin overage                                 = $199,95`,
    charts: [
      { label: 'Ver recomendación', url: chart('/ground-truth/sendgrid-2025/recommendations/fourth.html') },
    ],
  },
];

const SENDGRID_2025_NO_OVERAGE: PlaygroundQuestion[] = [
  {
    id: 'exhaustion-crf',
    icon: '⏳',
    label: '¿Cuánto tardo en agotar mi cuota?',
    response:
`¿Cuánto tardo en agotar la cuota? (Plan PRO, sin overage)

  CRF = 1    →  1 h 6 min 40 s      (1 email por petición)
  CRF = 500  →  8 s                 (500 emails por petición)
  Variable   →  depende del peso    (ver gráfico)

A mayor número de emails por petición, antes se agota la cuota.`,
    assumptions:
`Asunciones
  Concurrencia = 1  ·  una petición a la vez
  Plan PRO  ·  cuota: 40.000 emails/mes  ·  rate limit: 10 req/s
  Sin overage — la cuota de emails es el único límite activo.

Operaciones
  tiempo_agotamiento = cuota_emails ÷ (rate_limit × CRF)

  CRF = 1     →  40.000 ÷ (10 × 1)    = 4.000 s  = 1 h 6 min 40 s
  CRF = 500   →  40.000 ÷ (10 × 500)  =     8 s
  Variable    →  consulta el gráfico para el desglose detallado`,
    charts: [
      { label: 'CRF = 1',      url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-1.html') },
      { label: 'CRF = 500',    url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-500.html') },
      { label: 'CRF Variable', url: chart('/ground-truth/sendgrid-2025-no-overage/exhaustions/crf-variable.html') },
    ],
  },
  {
    id: 'consume-40k-pro',
    icon: '📬',
    label: '¿Cuánto tardo en consumir 40.000 correos? (Plan PRO)',
    description: 'capacity · quota=40.000 · plan PRO · sin overage',
    response:
`¿Cuánto tardo en enviar los 40.000 correos del Plan PRO?

  Plan PRO  →  1 h 6 min 40 s  (a velocidad máxima)

Consulta el gráfico para el desglose temporal detallado.`,
    assumptions:
`Asunciones
  CRF = 1  ·  1 email por petición
  Concurrencia = 1  ·  una petición a la vez
  Plan PRO  ·  cuota: 40.000 emails/mes  ·  rate limit: 10 req/s
  Sin overage — se agota exactamente la cuota del plan.

Operaciones
  tiempo = cuota ÷ rate_limit
  40.000 ÷ 10 req/s = 4.000 s = 1 h 6 min 40 s`,
    charts: [
      { label: 'PRO · 40k emails', url: chart('/ground-truth/sendgrid-2025-no-overage/capacity/pro-40k.html') },
    ],
  },
];

const SENDGRID_2026_QUESTIONS: PlaygroundQuestion[] = [
  {
    id: 'crf-equilibrium',
    sectionStart: '📊 Cuota y peso de emails · Plan PRO',
    icon: '⚖️',
    label: 'Paso 1 · ¿Cuál es el punto de equilibrio entre cuota de emails y cuota de datos?',
    description: 'CRF = 0,256 MB/email · ambas cuotas se agotan a la vez',
    response:
`¿Cuándo se agotan emails y datos exactamente a la vez?

  Con emails de 0,256 MB  →  ambas cuotas se agotan al mismo tiempo

  Tiempo hasta agotar:  1 h 6 min 40 s
  Emails enviados:      40.000  ✅
  Datos consumidos:     10.240 MB  ✅

Sin overage. Las dos cuotas se consumen en paralelo.`,
    assumptions:
`Asunciones
  Concurrencia = 1  ·  una petición a la vez
  Plan PRO  ·  cuota emails: 40.000/mes  ·  cuota datos: 10.240 MB/mes
  Rate limit: 10 req/s

Operaciones
  Punto de equilibrio → peso por email = cuota_datos ÷ cuota_emails
  10.240 MB ÷ 40.000 emails = 0,256 MB/email

  tiempo_agotamiento_emails = 40.000 ÷ 10              = 4.000 s = 1 h 6 min 40 s
  datos_consumidos           = 40.000 × 0,256 MB       = 10.240 MB  ✅ coincide exactamente`,
    charts: [
      { label: 'CRF = 0,256 MB', url: chart('/ground-truth/sendgrid-2026/crfs/0.256.html') },
    ],
  },
  {
    id: 'crf-safe',
    icon: '✅',
    label: 'Paso 2 · ¿Qué pasa si los emails pesan menos? (0,2 MB)',
    description: 'CRF = 0,2 MB/email · la cuota de emails se agota primero · margen en datos',
    response:
`¿Qué ocurre con emails más ligeros de 0,2 MB?

  Cuota de emails agotada en:    1 h 6 min 40 s   ← límite activo
  Cuota de datos agotada en:     1 h 25 min 20 s  ← nunca se alcanza

  Datos consumidos al terminar:  8.000 MB
  Margen de datos sin usar:      2.240 MB

Los emails se acaban antes. Sin overage.`,
    assumptions:
`Asunciones
  Concurrencia = 1  ·  una petición a la vez
  Plan PRO  ·  cuota emails: 40.000/mes  ·  cuota datos: 10.240 MB/mes
  CRF = 0,2 MB/email  ·  rate limit: 10 req/s

Operaciones
  tiempo_agotamiento_emails  = 40.000 ÷ 10           = 4.000 s  = 1 h 6 min 40 s
  datos_al_agotar_emails     = 40.000 × 0,2           = 8.000 MB
  tiempo_agotamiento_datos   = 10.240 ÷ (10 × 0,2)   = 5.120 s  = 1 h 25 min 20 s

  4.000 s < 5.120 s  →  la cuota de emails se agota primero.
  Margen de datos:  10.240 − 8.000 = 2.240 MB sin usar.`,
    charts: [
      { label: 'CRF = 0,2 MB', url: chart('/ground-truth/sendgrid-2026/crfs/0.2.html') },
    ],
  },
  {
    id: 'crf-critical',
    icon: '⚠️',
    label: 'Paso 3 · ¿Qué pasa si los emails pesan más? (0,4 MB)',
    description: 'CRF = 0,4 MB/email · la cuota de datos se agota antes de los 40k emails',
    response:
`¿Qué ocurre con emails más pesados de 0,4 MB?

  Cuota de datos agotada en:    42 min 40 s  ← límite activo ⚠️
  Emails enviados en ese punto: 25.600  (faltan 14.400 para los 40k)

La cuota de datos se agota a mitad de camino.
Sin overage, no se llega a los 40.000 emails.`,
    assumptions:
`Asunciones
  Concurrencia = 1  ·  una petición a la vez
  Plan PRO  ·  cuota emails: 40.000/mes  ·  cuota datos: 10.240 MB/mes
  CRF = 0,4 MB/email  ·  rate limit: 10 req/s

Operaciones
  tiempo_agotamiento_datos  = 10.240 ÷ (10 × 0,4)  = 2.560 s  = 42 min 40 s
  emails_en_ese_punto       = 10.240 MB ÷ 0,4 MB   = 25.600 emails
  tiempo_agotamiento_emails = 40.000 ÷ 10           = 4.000 s  = 1 h 6 min 40 s

  2.560 s < 4.000 s  →  la cuota de datos se agota primero.
  Emails restantes sin enviar: 40.000 − 25.600 = 14.400.`,
    charts: [
      { label: 'CRF = 0,4 MB', url: chart('/ground-truth/sendgrid-2026/crfs/0.4.html') },
    ],
  },
  {
    id: 'crf-overage',
    icon: '💸',
    label: 'Paso 4 · ¿Cuánto cuesta completar los 40.000 emails con emails de 0,4 MB?',
    description: 'overage de datos · cálculo de coste · sendgrid-2026',
    response:
`¿Cuánto hay que pagar de overage para llegar a los 40.000 emails?

  Datos necesarios para 40k emails:  16.000 MB
  Datos incluidos en el plan PRO:    10.240 MB
  Overage necesario:                  5.760 MB

  Coste de overage:  $5,76 USD`,
    assumptions:
`Asunciones
  Plan PRO  ·  cuota datos: 10.240 MB/mes  ·  precio overage: $0,001/MB
  CRF = 0,4 MB/email  ·  objetivo: 40.000 emails

Operaciones
  datos_totales  = 40.000 emails × 0,4 MB/email  = 16.000 MB
  overage_datos  = 16.000 − 10.240               =  5.760 MB
  coste_overage  = 5.760 MB × $0,001/MB          =  $5,76 USD`,
    charts: [
      { label: 'Coste de overage',       url: chart('/ground-truth/sendgrid-2026/crfs/overage-cost.html') },
      { label: 'CRF = 0,4 MB + overage', url: chart('/ground-truth/sendgrid-2026/crfs/0.4-overage.html') },
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
`¿Cuántas peticiones caben en 20 segundos?
(con un período de análisis de 1 minuto)

Consulta el gráfico para el número máximo alcanzable.`,
    assumptions:
`Asunciones
  Ventana de medición:  20 s
  Período de análisis:  1 min (60 s)

  El período de análisis determina la ventana temporal que el sistema
  observa para calcular si se supera el límite de peticiones.
  Con un período de 1 min, el límite se aplica sobre los últimos 60 s.`,
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
`¿Cuántas peticiones caben en 5 minutos?
(con un período de análisis de 10 minutos)

Consulta el gráfico para el número máximo alcanzable.`,
    assumptions:
`Asunciones
  Ventana de medición:  5 min (300 s)
  Período de análisis:  10 min (600 s)

  Con un período de análisis mayor, el sistema tiene más contexto
  temporal para distribuir el límite de peticiones.`,
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
`¿Cuántas peticiones caben en 40 minutos?
(con un período de análisis de 60 minutos)

Consulta el gráfico para el número máximo alcanzable.`,
    assumptions:
`Asunciones
  Ventana de medición:  40 min (2.400 s)
  Período de análisis:  60 min (3.600 s)

  Con período = ventana completa, el límite se evalúa sobre la hora entera,
  permitiendo ver el comportamiento del rate limit en su escala máxima.`,
    charts: [
      { label: '40m / 60m', url: chart('/ground-truth/dblp/40min.html') },
    ],
  },
];

const SCENARIOS: ApiScenario[] = [
  { id: 'sendgrid-2025', name: 'Sendgrid - Fresno Phd.', icon: '📧', pricingUrl: '/pricings/psg2-admin/Sendgrid@RAPIDAPI%20-%20Phd.%20Fresno?collectionName=PSG2-2026', questions: [...SENDGRID_2025_QUESTIONS, ...SENDGRID_2025_OPTIMAL] },
  { id: 'sendgrid-2025-no-overage', name: 'Sendgrid 2025', icon: '📧', pricingUrl: '/pricings/psg2-admin/Sendgrid@RAPIDAPI%20-%202025?collectionName=PSG2-2026', questions: SENDGRID_2025_NO_OVERAGE },
  { id: 'sendgrid-2026', name: 'Sendgrid 2026', icon: '📧', pricingUrl: '/pricings/psg2-admin/Sendgrid@RAPIDAPI%20-%202026?collectionName=PSG2-2026', questions: SENDGRID_2026_QUESTIONS },
  { id: 'dblp', name: 'DBLP - API', icon: '📚', pricingUrl: '/pricings/psg2-admin/DBLP%20-%20API?collectionName=PSG2-2026', questions: DBLP_QUESTIONS },
];

// ── Question card ──────────────────────────────────────────────────────────

function QuestionCard({ question }: { question: PlaygroundQuestion }) {
  const [open, setOpen] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
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
              <p className="gt-response-title">Respuesta</p>
              <pre className="gt-response-pre">{question.response}</pre>
            </div>

            {question.assumptions && (
              <div className="gt-assumptions">
                <button
                  type="button"
                  className="gt-assumptions-toggle"
                  onClick={() => setAssumptionsOpen((v) => !v)}
                >
                  {assumptionsOpen ? '▲' : '▼'} Ver asunciones y operaciones
                </button>
                {assumptionsOpen && (
                  <pre className="gt-assumptions-pre">{question.assumptions}</pre>
                )}
              </div>
            )}

            {question.charts && question.charts.length > 0 && (
              <div className="gt-charts">
                {question.charts.map((c) => (
                  <button
                    key={c.url}
                    type="button"
                    className="gt-chart-btn"
                    onClick={() => setActiveUrl(c.url)}
                  >
                    📈 {c.label}
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

      {scenario.pricingUrl && (
        <div className="gt-pricing-link">
          <a href={scenario.pricingUrl} className="gt-pricing-anchor">
            📋 Ver pricing: {scenario.name} →
          </a>
        </div>
      )}

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
