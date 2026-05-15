/**
 * Client-side PDF text extractor for vehicle documents.
 * Detects document type and extracts: numero, entidad, emision, venc.
 * Only works on text-based PDFs (digitally generated). Scanned/image PDFs
 * have no text layer — fields will be empty in that case.
 */

export interface DocExtracted {
  tipoId: string        // one of TIPOS_DOC_VEHICULO ids, or '' if unknown
  numero: string
  entidad: string
  venc: string          // ISO YYYY-MM-DD or ''
  emision: string       // ISO YYYY-MM-DD or ''
  rawText: string
}

// ── Date normaliser ───────────────────────────────────────────────────────────

function toIso(raw: string): string {
  // dd/mm/yyyy  dd-mm-yyyy  dd/mm/yy
  const m = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (!m) return ''
  let [, d, mo, y] = m
  if (y.length === 2) y = `20${y}`
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// First matching date from a list of patterns
function matchDate(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return toIso(m[1])
  }
  return ''
}

// First matching string from a list of patterns
function matchStr(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
  return ''
}

// ── Type detection ────────────────────────────────────────────────────────────

const DATE = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/

interface TypeRule {
  id: string
  keywords: RegExp[]   // all must match (AND)
  antiKeywords?: RegExp[] // any hit disqualifies
  score: number        // higher wins ties
}

const TYPE_RULES: TypeRule[] = [
  {
    id: 'vtv',
    keywords: [/verificaci[oó]n\s+t[eé]cnica|VTV|planta\s+verificadora|cert\.?\s*de\s+apt\.|aptitud\s+t[eé]cnica/i],
    score: 10,
  },
  {
    id: 'seguro',
    keywords: [/p[oó]liza|asegurado[^r]|cobertura|prima\s+(?:del\s+)?seguro|aseguradora/i],
    antiKeywords: [/verificaci[oó]n\s+t[eé]cnica/i],
    score: 9,
  },
  {
    id: 'cedula',
    keywords: [/c[eé]dula|titular\s+del\s+dominio|registro\s+(?:seccional|del\s+automotor)|RNPA|dominio\s+del\s+veh[ií]culo/i],
    score: 8,
  },
  {
    id: 'ruta',
    keywords: [/\bRUTA\b|registro\s+[úu]nico.*transport|habilitaci[oó]n.*CNRT|CNRT.*transport/i],
    score: 10,
  },
  {
    id: 'senasa_veh',
    keywords: [/\bSENASA\b/i],
    score: 10,
  },
  {
    id: 'matafuego',
    keywords: [/matafuego|extintor|recarga\s+(?:de\s+)?extintor/i],
    score: 10,
  },
  {
    id: 'tacografo',
    keywords: [/tac[oó]grafo|cronotac[oó]grafo|verificaci[oó]n.*tac[oó]grafo/i],
    score: 10,
  },
]

function detectTipo(text: string): string {
  let best = { id: '', score: -1 }
  for (const rule of TYPE_RULES) {
    const allKeywords = rule.keywords.every((k) => k.test(text))
    if (!allKeywords) continue
    const blocked = rule.antiKeywords?.some((k) => k.test(text))
    if (blocked) continue
    if (rule.score > best.score) best = rule
  }
  return best.id
}

// ── Known Argentine insurers ──────────────────────────────────────────────────

const ASEGURADORAS = [
  'Federación Patronal',
  'La Segunda',
  'MAPFRE',
  'Galeno',
  'Sancor Seguros',
  'Sancor',
  'Zurich',
  'Allianz',
  'Provincia Seguros',
  'Nación Seguros',
  'Banco Nación',
  'San Cristóbal',
  'El Comercio',
  'Integrity',
  'Berkley',
  'Chubb',
  'Swiss Medical',
  'Seguros Rivadavia',
  'Mercantil Andina',
  'HDI Seguros',
  'HDI',
  'QBE',
  'BBVA Seguros',
  'Supervielle Seguros',
  'Triunfo Seguros',
  'Liderar',
  'Plus Ultra',
  'Profru',
  'IAPSER',
  'Río Uruguay',
  'Meridional',
]

// ── Per-type extractors ───────────────────────────────────────────────────────

// Generic vencimiento patterns (shared across types)
const VENC_GENERIC: RegExp[] = [
  /(?:vigencia\s+hasta|vence\s+el|v[aá]lido?\s+hasta|vencimiento)[:\s]+(${DATE.source})/i,
  /fin\s+de\s+vigencia[:\s]+(${DATE.source})/i,
  /hasta[:\s]+(${DATE.source})/i,
  new RegExp(`(?:vigencia\\s+hasta|vence\\s+el|v[aá]lido?\\s+hasta|vencimiento)[:\\s]+(${DATE.source})`, 'i'),
  new RegExp(`fin\\s+de\\s+vigencia[:\\s]+(${DATE.source})`, 'i'),
  new RegExp(`hasta[:\\s]+(${DATE.source})`, 'i'),
]

// Generic emision patterns
const EMISION_GENERIC: RegExp[] = [
  new RegExp(`(?:fecha\\s+de\\s+emisi[oó]n|emitido\\s+el|fecha\\s+de\\s+expedici[oó]n)[:\\s]+(${DATE.source})`, 'i'),
  new RegExp(`(?:vigencia\\s+desde|desde\\s+el|inicio\\s+de\\s+vigencia)[:\\s]+(${DATE.source})`, 'i'),
  new RegExp(`(?:fecha\\s+de\\s+expedici[oó]n|fecha\\s+de\\s+otorgamiento)[:\\s]+(${DATE.source})`, 'i'),
]

function extractVtv(text: string) {
  return {
    numero: matchStr(text, [
      /certificado\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /[Nn]°?\s*de\s*certificado[:\s]+([\d][\d\-\.\/]+)/i,
      /informe\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /\bVTV[:\s#]*([\d][\d\-\.\/]+)/i,
    ]),
    entidad: matchStr(text, [
      /planta\s+verificadora[:\s]+([A-Za-záéíóúÁÉÍÓÚñÑ][^\n]{3,50})/i,
      /taller[:\s]+([A-Za-záéíóúÁÉÍÓÚñÑ][^\n]{3,40})/i,
      /realizado\s+por[:\s]+([A-Za-záéíóúÁÉÍÓÚñÑ][^\n]{3,40})/i,
    ]),
    venc: matchDate(text, [
      ...VENC_GENERIC,
      new RegExp(`[Pp]r[oó]ximo\\s+turno[:\\s]+(${DATE.source})`),
    ]),
    emision: matchDate(text, [
      new RegExp(`[Ff]echa\\s+de\\s+verificaci[oó]n[:\\s]+(${DATE.source})`),
      ...EMISION_GENERIC,
    ]),
  }
}

function extractSeguro(text: string) {
  const entidad = (() => {
    for (const n of ASEGURADORAS) {
      if (text.toLowerCase().includes(n.toLowerCase())) return n
    }
    return matchStr(text, [
      /(?:compa[ñn][ií]a|aseguradora)[:\s]+([A-ZÁÉÍÓÚ][^\n]{3,45})/im,
    ])
  })()
  return {
    numero: matchStr(text, [
      /p[oó]liza\s*[Nn](?:ro|°|º|o)?\.?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /[Nn]°?\s*de\s*p[oó]liza[:\s]+([\d][\d\-\.\/]+)/i,
      /p[oó]liza[:\s]+([\d]{5,})/i,
      /n[úu]mero\s+de\s+p[oó]liza[:\s]+([\d][\d\-\.\/]+)/i,
    ]),
    entidad,
    venc: matchDate(text, VENC_GENERIC),
    emision: matchDate(text, EMISION_GENERIC),
  }
}

function extractCedula(text: string) {
  return {
    numero: matchStr(text, [
      /n[úu]mero\s+de\s+c[eé]dula[:\s]+([\d][\d\-\.\/]+)/i,
      /c[eé]dula\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /registro\s+seccional\s+[Nn]°?\s*([\d]+)/i,
      /\bdominio[:\s]+([A-Z]{2,3}\s*\d{3}\s*[A-Z]{0,2})/i,
    ]),
    entidad: matchStr(text, [
      /registro\s+seccional\s+(?:[Nn]°?\s*\d+\s+)?([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
      /ministerio[^\n]{0,60}/i,
      /\bDNRPA\b|\bRNPA\b/i,
    ]) || 'DNRPA',
    venc: matchDate(text, [
      ...VENC_GENERIC,
      new RegExp(`[Vv]igencia[:\\s]+(${DATE.source})`),
    ]),
    emision: matchDate(text, EMISION_GENERIC),
  }
}

function extractRuta(text: string) {
  return {
    numero: matchStr(text, [
      /habilitaci[oó]n\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /expediente\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /\bRUTA[:\s#]*([\d][\d\-\.\/]+)/i,
      /[Nn]°?\s*de\s*habilitaci[oó]n[:\s]+([\d][\d\-\.\/]+)/i,
    ]),
    entidad: 'CNRT',
    venc: matchDate(text, VENC_GENERIC),
    emision: matchDate(text, EMISION_GENERIC),
  }
}

function extractSenasa(text: string) {
  return {
    numero: matchStr(text, [
      /resoluci[oó]n\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /expediente\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /habilitaci[oó]n\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /\bSENASA[:\s#]*([\d][\d\-\.\/]+)/i,
    ]),
    entidad: 'SENASA',
    venc: matchDate(text, VENC_GENERIC),
    emision: matchDate(text, EMISION_GENERIC),
  }
}

function extractMatafuego(text: string) {
  return {
    numero: matchStr(text, [
      /n[úu]mero\s+de\s+serie[:\s]+([\w\d\-]+)/i,
      /serie[:\s]+([\w\d\-]{4,})/i,
      /recarga\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
    ]),
    entidad: matchStr(text, [
      /empresa[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
      /recargado\s+por[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
      /prestador[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
    ]),
    venc: matchDate(text, [
      new RegExp(`pr[oó]xima\s+recarga[:\\s]+(${DATE.source})`, 'i'),
      new RegExp(`vencimiento\s+(?:de\s+)?recarga[:\\s]+(${DATE.source})`, 'i'),
      ...VENC_GENERIC,
    ]),
    emision: matchDate(text, [
      new RegExp(`[Ff]echa\s+de\s+recarga[:\\s]+(${DATE.source})`),
      ...EMISION_GENERIC,
    ]),
  }
}

function extractTacografo(text: string) {
  return {
    numero: matchStr(text, [
      /n[úu]mero\s+de\s+verificaci[oó]n[:\s]+([\d][\d\-\.\/]+)/i,
      /certificado\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
      /tac[oó]grafo\s*[Nn]°?\s*:?\s*([\d][\d\-\.\/]+)/i,
    ]),
    entidad: matchStr(text, [
      /taller[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
      /verificador[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,40})/i,
    ]) || 'CNRT',
    venc: matchDate(text, VENC_GENERIC),
    emision: matchDate(text, [
      new RegExp(`[Ff]echa\s+de\s+verificaci[oó]n[:\\s]+(${DATE.source})`),
      ...EMISION_GENERIC,
    ]),
  }
}

// Generic fallback
function extractGeneric(text: string) {
  return {
    numero: matchStr(text, [
      /[Nn](?:°|ro|úmero)?\.?\s*:?\s*([\d]{5,}[\d\-\/]*)/,
      /expediente[:\s]+([\d][\d\-\.\/]+)/i,
      /certificado[:\s]+([\d][\d\-\.\/]+)/i,
    ]),
    entidad: matchStr(text, [
      /(?:emitido\s+por|organismo|entidad|empresa)[:\s]+([A-Za-záéíóúÁÉÍÓÚ][^\n]{3,45})/im,
    ]),
    venc: matchDate(text, VENC_GENERIC),
    emision: matchDate(text, EMISION_GENERIC),
  }
}

// ── PDF text extraction ───────────────────────────────────────────────────────

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''
  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Preserve line structure: items with same Y are on the same line
    type TItem = { str: string; transform: number[] }
    const items = (content.items as unknown[]).filter(
      (it): it is TItem => typeof (it as TItem).str === 'string' && Array.isArray((it as TItem).transform)
    )
    // Sort by Y descending (top to bottom), then X
    items.sort((a, b) => {
      const dy = b.transform[5] - a.transform[5]
      return Math.abs(dy) > 3 ? dy : a.transform[4] - b.transform[4]
    })
    // Group by approximate Y to form lines
    const lines: string[] = []
    let lastY: number | null = null
    let line = ''
    for (const item of items) {
      const y = Math.round(item.transform[5] / 4) * 4
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (line.trim()) lines.push(line.trim())
        line = ''
      }
      line += (line ? ' ' : '') + item.str
      lastY = y
    }
    if (line.trim()) lines.push(line.trim())
    fullText += lines.join('\n') + '\n\n'
  }
  return fullText
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseDocumentoPdf(file: File): Promise<DocExtracted> {
  const rawText = await extractTextFromPdf(file)

  const tipoId = detectTipo(rawText)

  const extractors: Record<string, (t: string) => { numero: string; entidad: string; venc: string; emision: string }> = {
    vtv:        extractVtv,
    seguro:     extractSeguro,
    cedula:     extractCedula,
    ruta:       extractRuta,
    senasa_veh: extractSenasa,
    matafuego:  extractMatafuego,
    tacografo:  extractTacografo,
  }

  const extracted = tipoId && extractors[tipoId]
    ? extractors[tipoId](rawText)
    : extractGeneric(rawText)

  return { tipoId, rawText, ...extracted }
}

// Keep old export name for backwards compat
export const parsePolizaPdf = parseDocumentoPdf
