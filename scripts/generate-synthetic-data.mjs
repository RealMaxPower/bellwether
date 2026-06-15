// Generates plausible synthetic monthly series 1948-01 to 2026-04 so the app
// runs without a FRED API key. Replace with real FRED data via fetch-fred.ts.
//
// Series produced:
//   data/fred/NAPM.json         — Headline PMI
//   data/fred/NAPMNOI.json      — New Orders subindex
//   data/fred/NAPMPI.json       — Production subindex
//   data/fred/NAPMEI.json       — Employment subindex
//   data/fred/NAPMSDI.json      — Supplier Deliveries subindex
//   data/fred/NAPMII.json       — Inventories subindex
//   data/fred/FEDFUNDS.json     — Fed Funds rate (effective)
//   data/fred/USREC.json        — NBER recession periods
//
// Numbers are SHAPED but not REAL — use for development. Real data uses the
// same JSON structure, validated by lib/data/schemas.ts.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data", "fred");
mkdirSync(dataDir, { recursive: true });

const TODAY = new Date().toISOString().slice(0, 10);
const NBER_TABLE_URL = "https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions";
const NBER_ANNOUNCEMENTS = {
  "2001-03-01": "https://www.nber.org/news/business-cycle-dating-committee-announcement-july-17-2003",
  "2007-12-01": "https://www.nber.org/news/business-cycle-dating-committee-announcement-september-20-2010",
  "2020-02-01": "https://www.nber.org/news/business-cycle-dating-committee-announcement-july-19-2021",
};

// ---------- Helpers ----------

function monthIso(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function* months(startYear, startMonth, endYear, endMonth) {
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    yield [y, m];
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
}

// Deterministic-ish noise via mulberry32 seeded by (year * 12 + month).
function rng(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Round to 1 decimal place — PMI is published to one decimal.
const r1 = (x) => Math.round(x * 10) / 10;

// ---------- Recessions (NBER, real dates) ----------

const recessions = [
  { peak: "1948-11-01", trough: "1949-10-01", label: "Postwar adjustment" },
  { peak: "1953-07-01", trough: "1954-05-01", label: "1953 recession" },
  { peak: "1957-08-01", trough: "1958-04-01", label: "Eisenhower recession" },
  { peak: "1960-04-01", trough: "1961-02-01", label: "1960–61 recession" },
  { peak: "1969-12-01", trough: "1970-11-01", label: "Nixon recession" },
  { peak: "1973-11-01", trough: "1975-03-01", label: "1973 oil shock" },
  { peak: "1980-01-01", trough: "1980-07-01", label: "1980 recession" },
  { peak: "1981-07-01", trough: "1982-11-01", label: "Volcker recession" },
  { peak: "1990-07-01", trough: "1991-03-01", label: "Early-90s recession" },
  { peak: "2001-03-01", trough: "2001-11-01", label: "Dot-com bust" },
  { peak: "2007-12-01", trough: "2009-06-01", label: "Great Recession" },
  { peak: "2020-02-01", trough: "2020-04-01", label: "COVID-19 recession" },
];

function inRecession(year, month) {
  const iso = monthIso(year, month);
  return recessions.some((r) => iso >= r.peak && iso <= r.trough);
}

// ---------- PMI shape ----------

// Hand-tuned regime baselines — captures the contour of postwar US manufacturing.
function pmiBaseline(year, month) {
  // Boom-bust amplitude per era
  if (year < 1955) return 53;
  if (year < 1960) return 51;
  if (year < 1970) return 54;
  if (year < 1975) return 51; // stagflation onset
  if (year < 1983) return 47; // stagflation + Volcker
  if (year < 1991) return 53; // Reagan-era recovery
  if (year < 2001) return 54; // Great Moderation
  if (year < 2008) return 53;
  if (year < 2010) return 45; // GFC trough
  if (year < 2020) return 54; // post-GFC expansion
  if (year === 2020 && month <= 5) return 43; // COVID trough
  if (year < 2023) return 56; // post-COVID overheat
  return 49; // 2023–2026 normalization with mild contractions
}

// Apply recession dip
function pmiAdjust(year, month, baseline, noise) {
  let v = baseline + noise * 4 - 2;
  if (inRecession(year, month)) {
    v -= 6;
  }
  // 1979-1982 Volcker double dip — extra crunch on manufacturing
  if (year >= 1980 && year <= 1982) v -= 2;
  // 2008-09 GFC — deeper trough
  if ((year === 2008 && month >= 10) || year === 2009) v -= 5;
  // COVID April 2020 — extreme trough
  if (year === 2020 && month === 4) v -= 8;
  return Math.max(28, Math.min(72, v));
}

// ---------- Series generation ----------

const start = [1948, 1];
const end = [2026, 4];

function buildPMI() {
  const observations = [];
  for (const [y, m] of months(start[0], start[1], end[0], end[1])) {
    const rand = rng(y * 13 + m);
    const noise = (rand() + rand() + rand()) / 3; // ~0..1
    const base = pmiBaseline(y, m);
    observations.push({ date: monthIso(y, m), value: r1(pmiAdjust(y, m, base, noise)) });
  }
  return {
    id: "NAPM",
    title: "ISM Manufacturing: PMI Composite Index",
    source: "Synthetic — replace with FRED via npm run refresh-data",
    provenance: "synthetic",
    lastVerifiedAt: TODAY,
    units: "Index",
    observations,
  };
}

// Subindices vary around the headline with their own character.
function buildSubindex(seedSalt, leadOffset, amplitude, bias) {
  const observations = [];
  let prior = 0;
  for (const [y, m] of months(start[0], start[1], end[0], end[1])) {
    const rand = rng(y * 17 + m + seedSalt);
    const noise = (rand() + rand() + rand()) / 3;
    const base = pmiBaseline(y, m + leadOffset);
    let v = base + (noise - 0.5) * amplitude + bias;
    if (inRecession(y, m)) v -= 5;
    if (year2008Trough(y, m)) v -= 4;
    if (covidTrough(y, m)) v -= 7;
    // Slight serial correlation
    v = 0.7 * v + 0.3 * prior;
    prior = v;
    observations.push({ date: monthIso(y, m), value: r1(Math.max(25, Math.min(75, v))) });
  }
  return observations;
}

function year2008Trough(y, m) {
  return (y === 2008 && m >= 10) || y === 2009;
}
function covidTrough(y, m) {
  return y === 2020 && m >= 3 && m <= 5;
}

// ---------- Fed Funds ----------

function fedFundsValue(y, m) {
  // Hand-shaped contour of the effective Fed Funds rate.
  if (y < 1955) return 1.5;
  if (y < 1960) return 2.5;
  if (y < 1965) return 3.5;
  if (y < 1969) return 5.0;
  if (y < 1973) return 6.5;
  if (y < 1979) return 8.0;
  if (y === 1979 || y === 1980) return 13.0;
  if (y === 1981) return 16.0;
  if (y === 1982) return 12.0;
  if (y < 1990) return 8.0;
  if (y < 1994) return 4.0;
  if (y < 2001) return 5.5;
  if (y < 2004) return 1.5;
  if (y < 2008) return 5.0;
  if (y < 2016) return 0.25;
  if (y < 2019) return 1.5;
  if (y < 2020) return 2.5;
  if (y < 2022) return 0.25;
  if (y < 2024) return 5.0;
  return 4.5;
}

// ---------- Write ----------

const pmi = buildPMI();
writeFileSync(resolve(dataDir, "NAPM.json"), JSON.stringify(pmi, null, 2));

const subindexConfigs = [
  ["NAPMNOI", "New Orders", 11, -1, 6, 0.5], // leads, more volatile
  ["NAPMPI", "Production", 12, 0, 5, 0.3],
  ["NAPMEI", "Employment", 13, 1, 4, -0.5], // lags, smoother
  ["NAPMSDI", "Supplier Deliveries", 14, -1, 5, 1.0], // leads with positive bias (shortages = expansion)
  ["NAPMII", "Inventories", 15, 0, 5, -0.8], // tends below 50
];

for (const [id, title, salt, lead, amp, bias] of subindexConfigs) {
  const obs = buildSubindex(salt, lead, amp, bias);
  writeFileSync(
    resolve(dataDir, `${id}.json`),
    JSON.stringify(
      {
        id,
        title: `ISM Manufacturing: ${title} Index`,
        source: "Synthetic — replace with FRED via npm run refresh-data",
    provenance: "synthetic",
    lastVerifiedAt: TODAY,
        units: "Index",
        observations: obs,
      },
      null,
      2,
    ),
  );
}

const fedFundsObs = [];
for (const [y, m] of months(start[0], start[1], end[0], end[1])) {
  fedFundsObs.push({ date: monthIso(y, m), value: r1(fedFundsValue(y, m) + (rng(y * 19 + m)() - 0.5) * 0.4) });
}
writeFileSync(
  resolve(dataDir, "FEDFUNDS.json"),
  JSON.stringify(
    {
      id: "FEDFUNDS",
      title: "Effective Federal Funds Rate",
      source: "Synthetic — replace with FRED via npm run refresh-data",
    provenance: "synthetic",
    lastVerifiedAt: TODAY,
      units: "Percent",
      observations: fedFundsObs,
    },
    null,
    2,
  ),
);

writeFileSync(
  resolve(dataDir, "USREC.json"),
  JSON.stringify(
    {
      id: "USREC",
      title: "NBER-based Recession Indicator",
      source: "NBER Business Cycle Dating Committee",
      provenance: "nber",
      lastVerifiedAt: TODAY,
      periods: recessions.map((r) => ({
        ...r,
        sourceUrl: NBER_ANNOUNCEMENTS[r.peak] ?? NBER_TABLE_URL,
      })),
    },
    null,
    2,
  ),
);

console.log(`Wrote ${pmi.observations.length} months of synthetic data to ${dataDir}`);
