export type Thread = "fed" | "pmi";

export interface TimelineEntry {
  id: string;
  year: number;
  decade: number;
  thread: Thread;
  /** Big serif title shown on the exhibit card. */
  title: string;
  /** Smaller line under the title — typically person + role. */
  subtitle?: string;
  /** Filename under /public/background/, no extension. */
  photo: string;
  photoAlt: string;
  /** Short attribution shown under the photo. */
  photoCredit: string;
  /** 2–4 sentences of museum-label prose. */
  body: string;
  source: { label: string; url: string };
}

export const threadLabel: Record<Thread, string> = {
  fed: "Federal Reserve",
  pmi: "PMI / NAPM·ISM",
};

export const timelineEntries: readonly TimelineEntry[] = [
  {
    id: "fed-act-1913",
    year: 1913,
    decade: 1910,
    thread: "fed",
    title: "The Federal Reserve Act is signed",
    subtitle: "Woodrow Wilson, 28th President",
    photo: "wilson",
    photoAlt: "Woodrow Wilson, official presidential portrait",
    photoCredit: "Library of Congress · public domain",
    body:
      "On December 23, 1913 Wilson signed the Federal Reserve Act, creating a Board of Governors in Washington, twelve regional Reserve Banks, and the Federal Open Market Committee. The dual mandate the Fed is most often described by today — stable prices and maximum employment — would not be added until 1977.",
    source: {
      label: "Federal Reserve History — “Federal Reserve Act Signed”",
      url: "https://www.federalreservehistory.org/essays/federal-reserve-act-signed",
    },
  },
  {
    id: "hamlin-1914",
    year: 1914,
    decade: 1910,
    thread: "fed",
    title: "Chair 1 — Charles S. Hamlin",
    subtitle: "1914 → 1916",
    photo: "hamlin",
    photoAlt: "Charles S. Hamlin",
    photoCredit: "Library of Congress · public domain",
    body:
      "A Boston lawyer and Treasury veteran, Hamlin became the new Federal Reserve Board's first Governor — the title only changed to “Chair” in 1935. His job was to stand up an institution that did not yet exist, hire its first staff, and convince Wall Street the regional Reserve Banks were not just twelve more government offices.",
    source: {
      label: "Federal Reserve History — Charles S. Hamlin",
      url: "https://www.federalreservehistory.org/people/charles-s-hamlin",
    },
  },
  {
    id: "napm-1915",
    year: 1915,
    decade: 1910,
    thread: "pmi",
    title: "NAPM is founded in New York",
    subtitle: "National Association of Purchasing Agents",
    photo: "hoover",
    photoAlt: "Herbert Hoover, official presidential portrait",
    photoCredit: "Library of Congress · public domain (Hoover ca. 1929)",
    body:
      "Purchasing managers from a handful of large firms gathered in New York to form a standing forum for sharing supply-chain intelligence. For its first decade and a half NAPM was a trade association, not a publisher of statistics. That would change under the man pictured here, who as Commerce Secretary in the 1920s pushed American trade groups to publish standardized data.",
    source: {
      label: "Wikipedia — Institute for Supply Management",
      url: "https://en.wikipedia.org/wiki/Institute_for_Supply_Management",
    },
  },
  {
    id: "harding-1916",
    year: 1916,
    decade: 1910,
    thread: "fed",
    title: "Chair 2 — William P. G. Harding",
    subtitle: "1916 → 1922",
    photo: "harding",
    photoAlt: "W. P. G. Harding",
    photoCredit: "Library of Congress · public domain",
    body:
      "An Alabama banker (no relation to President Harding), W. P. G. Harding ran the young Fed through World War I — financing Liberty Bonds, holding rates low to support the war effort, then absorbing the violent 1920–21 deflation that followed demobilization. The episode taught the institution its first hard lesson about the cost of holding rates below the market.",
    source: {
      label: "Federal Reserve History — William P. G. Harding",
      url: "https://www.federalreservehistory.org/people/william-p-g-harding",
    },
  },
  {
    id: "crissinger-1923",
    year: 1923,
    decade: 1920,
    thread: "fed",
    title: "Chair 3 — Daniel R. Crissinger",
    subtitle: "1923 → 1927",
    photo: "crissinger",
    photoAlt: "Daniel R. Crissinger",
    photoCredit: "Library of Congress · public domain",
    body:
      "An Ohio politician and President Harding's personal friend, Crissinger presided over the Roaring Twenties and the Fed's first deliberate experiments with open-market operations — buying and selling government securities to influence bank reserves. The technique would become the central tool of modern monetary policy.",
    source: {
      label: "Federal Reserve History — Daniel R. Crissinger",
      url: "https://www.federalreservehistory.org/people/daniel-r-crissinger",
    },
  },
  {
    id: "young-1927",
    year: 1927,
    decade: 1920,
    thread: "fed",
    title: "Chair 4 — Roy A. Young",
    subtitle: "1927 → 1930",
    photo: "young",
    photoAlt: "Roy A. Young",
    photoCredit: "Library of Congress · public domain",
    body:
      "Young was Governor through the speculative blow-off of 1928–29 and the October 1929 crash itself. Historians still argue about whether the Fed of these years tightened too late and then too hard; Young stepped down in August 1930, just as the contraction was becoming a depression.",
    source: {
      label: "Federal Reserve History — Roy A. Young",
      url: "https://www.federalreservehistory.org/people/roy-a-young",
    },
  },
  {
    id: "meyer-1930",
    year: 1930,
    decade: 1930,
    thread: "fed",
    title: "Chair 5 — Eugene Meyer",
    subtitle: "1930 → 1933",
    photo: "meyer",
    photoAlt: "Eugene Meyer",
    photoCredit: "Library of Congress · public domain",
    body:
      "A financier and future owner of the Washington Post, Meyer ran the Fed through the worst phase of the Depression — bank runs, the 1931 sterling crisis, the 1933 Bank Holiday. He resigned shortly after Roosevelt's inauguration over policy disputes about how aggressively the Fed should act.",
    source: {
      label: "Federal Reserve History — Eugene Meyer",
      url: "https://www.federalreservehistory.org/people/eugene-meyer",
    },
  },
  {
    id: "report-on-business-1931",
    year: 1931,
    decade: 1930,
    thread: "pmi",
    title: "NAPM launches the Report on Business",
    subtitle: "Hoover-era origin of the index this site plots",
    photo: "hoover",
    photoAlt: "Herbert Hoover",
    photoCredit: "Library of Congress · public domain",
    body:
      "In 1931, with the Depression deepening, NAPM began publishing a monthly survey of its purchasing-manager members on production, new orders, employment, deliveries, and inventories. Hoover, a former mining engineer who had spent the 1920s pushing trade associations to standardize statistics, gave the project federal blessing. The Report on Business survives — almost a century later — as the ISM Manufacturing PMI you see on the homepage.",
    source: {
      label: "Wikipedia — ISM Report On Business",
      url: "https://en.wikipedia.org/wiki/ISM_Report_On_Business",
    },
  },
  {
    id: "black-1933",
    year: 1933,
    decade: 1930,
    thread: "fed",
    title: "Chair 6 — Eugene R. Black",
    subtitle: "1933 → 1934",
    photo: "black",
    photoAlt: "Eugene R. Black",
    photoCredit: "Library of Congress · public domain",
    body:
      "An Atlanta banker brought in by Roosevelt to steady nerves after the Bank Holiday and the first New Deal banking acts, Black served barely a year before resigning to return to the Atlanta Fed. His brief tenure spanned the creation of the FDIC and the gold-clause cases that would test whether the Fed's liabilities were redeemable in gold.",
    source: {
      label: "Federal Reserve History — Eugene Robert Black",
      url: "https://www.federalreservehistory.org/people/eugene-robert-black",
    },
  },
  {
    id: "eccles-1934",
    year: 1934,
    decade: 1930,
    thread: "fed",
    title: "Chair 7 — Marriner S. Eccles",
    subtitle: "1934 → 1948 · architect of the modern Fed",
    photo: "eccles",
    photoAlt: "Marriner S. Eccles",
    photoCredit: "Federal Reserve · public domain",
    body:
      "A Utah banker who had survived the 1930s with his banks intact, Eccles essentially rewrote the Federal Reserve. The Banking Act of 1935 — which he drafted — moved authority from the regional Reserve Banks to the Washington Board, created the FOMC in its modern form, and renamed the chief officer “Chair.” The Fed's main building in DC bears his name.",
    source: {
      label: "Federal Reserve History — Marriner S. Eccles",
      url: "https://www.federalreservehistory.org/people/marriner-s-eccles",
    },
  },
  {
    id: "pmi-series-1948",
    year: 1948,
    decade: 1940,
    thread: "pmi",
    title: "The modern PMI series begins",
    subtitle: "January 1948 · the first month plotted on this site",
    photo: "mccabe",
    photoAlt: "Thomas B. McCabe",
    photoCredit: "Library of Congress · public domain",
    body:
      "After the Second World War, NAPM standardized its survey into the diffusion-index format we know today: each respondent reports better, same, or worse than last month, and the result is centered on 50. FRED's NAPM time series begins January 1948, which is why the timeline on the homepage starts there. Anything earlier exists in NAPM's own archives but not in a continuous comparable form.",
    source: {
      label: "FRED — NAPM series metadata",
      url: "https://fred.stlouisfed.org/series/NAPM",
    },
  },
  {
    id: "mccabe-1948",
    year: 1948,
    decade: 1940,
    thread: "fed",
    title: "Chair 8 — Thomas B. McCabe",
    subtitle: "1948 → 1951",
    photo: "mccabe",
    photoAlt: "Thomas B. McCabe",
    photoCredit: "Library of Congress · public domain",
    body:
      "A Scott Paper executive recruited by Truman, McCabe inherited a Fed still pegging long-term Treasury yields at 2.5% — a wartime arrangement Truman wanted to keep. McCabe's running fight with the White House, conducted partly through his deputy William McChesney Martin, would produce the document that finally freed the Fed.",
    source: {
      label: "Federal Reserve History — Thomas B. McCabe",
      url: "https://www.federalreservehistory.org/people/thomas-b-mccabe",
    },
  },
  {
    id: "accord-1951",
    year: 1951,
    decade: 1950,
    thread: "fed",
    title: "The Treasury–Fed Accord",
    subtitle: "March 1951 · the Fed wins independence",
    photo: "martin",
    photoAlt: "William McChesney Martin Jr.",
    photoCredit: "Federal Reserve · public domain",
    body:
      "After two years of escalating fights over the wartime rate peg, the Treasury and the Fed agreed on March 4, 1951 that the Fed would no longer be obligated to support government bond prices. McCabe stepped down; William McChesney Martin Jr., the Treasury official who negotiated the Accord, replaced him. It is the founding document of an independent modern central bank.",
    source: {
      label: "Federal Reserve History — Treasury–Fed Accord",
      url: "https://www.federalreservehistory.org/essays/treasury-fed-accord",
    },
  },
  {
    id: "martin-1951",
    year: 1951,
    decade: 1950,
    thread: "fed",
    title: "Chair 9 — William McChesney Martin Jr.",
    subtitle: "1951 → 1970 · longest-serving chair",
    photo: "martin",
    photoAlt: "William McChesney Martin Jr.",
    photoCredit: "Federal Reserve · public domain",
    body:
      "Martin served almost nineteen years under five presidents — Truman, Eisenhower, Kennedy, Johnson, Nixon — and gave the Fed its most-quoted self-description: the central bank's job, he said, is to “take away the punch bowl just as the party gets going.” His tenure ended with mounting Vietnam-era inflation that his successors would inherit.",
    source: {
      label: "Federal Reserve History — William McChesney Martin Jr.",
      url: "https://www.federalreservehistory.org/people/william-mcchesney-martin-jr",
    },
  },
  {
    id: "burns-1970",
    year: 1970,
    decade: 1970,
    thread: "fed",
    title: "Chair 10 — Arthur F. Burns",
    subtitle: "1970 → 1978 · stagflation Fed",
    photo: "burns",
    photoAlt: "Arthur F. Burns",
    photoCredit: "Federal Reserve · public domain",
    body:
      "An academic economist and Nixon confidant, Burns ran the Fed through the 1973 oil shock, the 1974–75 recession, and the long stagflation that followed. Tape recordings later released from the Nixon White House show sustained presidential pressure on Burns to keep money easy ahead of the 1972 election — a textbook case of why central-bank independence matters.",
    source: {
      label: "Federal Reserve History — Arthur F. Burns",
      url: "https://www.federalreservehistory.org/people/arthur-f-burns",
    },
  },
  {
    id: "dual-mandate-1977",
    year: 1977,
    decade: 1970,
    thread: "fed",
    title: "Congress codifies the dual mandate",
    subtitle: "Federal Reserve Reform Act of 1977",
    photo: "burns",
    photoAlt: "Arthur F. Burns chairing the FOMC",
    photoCredit: "Federal Reserve · public domain",
    body:
      "The Federal Reserve Reform Act amended the 1913 Act to direct the Fed to “promote effectively the goals of maximum employment, stable prices, and moderate long-term interest rates.” The dual mandate Powell invokes today was added here — sixty-four years after the institution itself was created. The Full Employment and Balanced Growth Act of 1978 (Humphrey–Hawkins) then required the Fed to report to Congress twice a year on its progress against those goals — the “Humphrey–Hawkins testimony” that ran until 2000 and survives in spirit as the semi-annual Monetary Policy Report.",
    source: {
      label: "Federal Reserve History — Federal Reserve Reform Act of 1977",
      url: "https://www.federalreservehistory.org/essays/federal-reserve-reform-act-of-1977",
    },
  },
  {
    id: "miller-1978",
    year: 1978,
    decade: 1970,
    thread: "fed",
    title: "Chair 11 — G. William Miller",
    subtitle: "1978 → 1979 · briefest modern tenure",
    photo: "miller",
    photoAlt: "G. William Miller",
    photoCredit: "Federal Reserve · public domain",
    body:
      "A Textron CEO with no central-banking background, Miller was Carter's compromise pick. Inflation accelerated from roughly 7% to over 11% during his seventeen months at the Fed, and Carter moved him to Treasury — clearing the way for the chair who would finally break it.",
    source: {
      label: "Federal Reserve History — G. William Miller",
      url: "https://www.federalreservehistory.org/people/g-william-miller",
    },
  },
  {
    id: "volcker-1979",
    year: 1979,
    decade: 1970,
    thread: "fed",
    title: "Chair 12 — Paul A. Volcker",
    subtitle: "1979 → 1987 · the inflation chair",
    photo: "volcker",
    photoAlt: "Paul A. Volcker",
    photoCredit: "Wikimedia Commons · public domain",
    body:
      "On October 6, 1979 — the “Saturday-night special” — Volcker announced the Fed would target the money supply rather than the funds rate, and let rates go where they had to. The funds rate peaked over 20%; back-to-back recessions followed; inflation broke. The first scenario in this site's Fed Chair game puts you in his seat in August 1979.",
    source: {
      label: "Federal Reserve History — Paul Volcker",
      url: "https://www.federalreservehistory.org/people/paul-a-volcker",
    },
  },
  {
    id: "greenspan-1987",
    year: 1987,
    decade: 1980,
    thread: "fed",
    title: "Chair 13 — Alan Greenspan",
    subtitle: "1987 → 2006 · “The Maestro”",
    photo: "greenspan",
    photoAlt: "Alan Greenspan",
    photoCredit: "Federal Reserve · public domain",
    body:
      "Greenspan took office two months before Black Monday and served almost two decades — through the 1990s expansion, the dot-com boom and bust, and the early 2000s housing run-up. His reputation, once Olympian, has been substantially revised since 2008; he himself acknowledged in congressional testimony that his model of the world had a flaw.",
    source: {
      label: "Federal Reserve History — Alan Greenspan",
      url: "https://www.federalreservehistory.org/people/alan-greenspan",
    },
  },
  {
    id: "ism-rebrand-2002",
    year: 2002,
    decade: 2000,
    thread: "pmi",
    title: "NAPM becomes ISM",
    subtitle: "Institute for Supply Management",
    photo: "greenspan",
    photoAlt: "Alan Greenspan, then Fed chair",
    photoCredit: "Federal Reserve · public domain",
    body:
      "On January 1, 2002 NAPM rebranded as the Institute for Supply Management, reflecting a broader scope: not just purchasing, but the full supply chain. The Manufacturing Report on Business kept its month-by-month continuity. The headline number became “ISM Manufacturing PMI” — the name still in use today.",
    source: {
      label: "Wikipedia — Institute for Supply Management",
      url: "https://en.wikipedia.org/wiki/Institute_for_Supply_Management",
    },
  },
  {
    id: "bernanke-2006",
    year: 2006,
    decade: 2000,
    thread: "fed",
    title: "Chair 14 — Ben S. Bernanke",
    subtitle: "2006 → 2014 · the crisis chair",
    photo: "bernanke",
    photoAlt: "Ben S. Bernanke",
    photoCredit: "Federal Reserve · public domain",
    body:
      "A Princeton economist whose academic career had been dedicated to studying the Great Depression, Bernanke arrived at the Fed eighteen months before the Global Financial Crisis. He authored QE1, QE2, and QE3, took the funds rate to zero, and pushed the Fed's balance sheet from under $1 trillion to over $4 trillion.",
    source: {
      label: "Federal Reserve History — Ben S. Bernanke",
      url: "https://www.federalreservehistory.org/people/ben-s-bernanke",
    },
  },
  {
    id: "yellen-2014",
    year: 2014,
    decade: 2010,
    thread: "fed",
    title: "Chair 15 — Janet L. Yellen",
    subtitle: "2014 → 2018 · first woman chair",
    photo: "yellen",
    photoAlt: "Janet L. Yellen",
    photoCredit: "Federal Reserve · public domain",
    body:
      "A labor economist who had chaired Clinton's Council of Economic Advisers, Yellen took office as the first woman to lead the Fed. Her tenure managed the slow “liftoff” from the zero lower bound — December 2015 was the first rate hike in nine years — and the start of the long normalization that Powell would inherit.",
    source: {
      label: "Federal Reserve History — Janet L. Yellen",
      url: "https://www.federalreservehistory.org/people/janet-l-yellen",
    },
  },
  {
    id: "fred-drops-ism-2016",
    year: 2016,
    decade: 2010,
    thread: "pmi",
    title: "FRED drops the ISM series",
    subtitle: "Why this site keeps a hand-curated PMI",
    photo: "yellen",
    photoAlt: "Janet L. Yellen, then Fed chair",
    photoCredit: "Federal Reserve · public domain",
    body:
      "In 2016 ISM tightened the redistribution license on its 22 monthly series. The Federal Reserve Bank of St. Louis's FRED service, which had carried them for years, removed all twenty-two. That is why Bellwether maintains a separate hand-curated PMI file alongside FRED's now-frozen NAPM placeholder — see the data ledger for the full chain.",
    source: {
      label: "FRED — NAPM series notice",
      url: "https://fred.stlouisfed.org/series/NAPM",
    },
  },
  {
    id: "powell-2018",
    year: 2018,
    decade: 2010,
    thread: "fed",
    title: "Chair 16 — Jerome H. Powell",
    subtitle: "2018 → present",
    photo: "powell",
    photoAlt: "Jerome H. Powell",
    photoCredit: "Federal Reserve · public domain",
    body:
      "A lawyer and former private-equity executive — the first non-economist chair since Miller — Powell took the Fed through the 2020 pandemic shock (cutting to zero in two weeks, expanding the balance sheet by $3 trillion) and the 2022–23 hiking cycle that lifted the funds rate from zero to over 5% in eighteen months. He is the chair sitting at the right edge of every chart on this site.",
    source: {
      label: "Federal Reserve History — Jerome H. Powell",
      url: "https://www.federalreservehistory.org/people/jerome-h-powell",
    },
  },
];

export const decades = Array.from(
  new Set(timelineEntries.map((e) => e.decade)),
).sort((a, b) => a - b);
