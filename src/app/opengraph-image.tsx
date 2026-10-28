import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Bellwether — atlas of the ISM PMI suite";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// next/og only bundles one sans-serif face, so the site's fonts are supplied
// here. They're Google Fonts' static TTF instances, unmodified (Satori can't
// read woff2 or variable fonts); the licences sit alongside them. The image
// is prerendered, so they're only read at build time.
const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const [serifMedium, serifMediumItalic, serifItalic, inter, interSemiBold] = await Promise.all([
  font("SourceSerif4-Medium.ttf"),
  font("SourceSerif4-MediumItalic.ttf"),
  font("SourceSerif4-Italic.ttf"),
  font("Inter-Regular.ttf"),
  font("Inter-SemiBold.ttf"),
]);

const PAPER = "rgb(245, 240, 230)";
const PAPER_EDGE = "rgb(221, 211, 191)";
const INK_700 = "rgb(26, 24, 20)";
const INK_400 = "rgb(107, 99, 84)";
const OXBLOOD = "rgb(139, 30, 30)";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: PAPER,
          padding: "72px 96px",
          fontFamily: "Source Serif 4",
          color: INK_700,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontFamily: "Inter",
            fontSize: 22,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: INK_400,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: OXBLOOD,
            }}
          />
          <span>Bellwether</span>
          <span style={{ color: PAPER_EDGE }}>·</span>
          <span>ISM PMI Atlas</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 140,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span>Bell</span>
            <span style={{ fontStyle: "italic", color: OXBLOOD }}>wether</span>
            <span style={{ color: OXBLOOD, marginLeft: 18, fontStyle: "italic" }}>.</span>
          </div>
          <div
            style={{
              fontSize: 42,
              lineHeight: 1.25,
              color: INK_400,
              maxWidth: 900,
              fontStyle: "italic",
            }}
          >
            Interactive 75-year atlas of the ISM Manufacturing &amp; Services
            PMIs, alongside US economic policy.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: `1px solid ${PAPER_EDGE}`,
            fontFamily: "Inter",
            fontSize: 20,
            color: INK_400,
            letterSpacing: "0.06em",
          }}
        >
          <span>Manufacturing 1948 → present · Services 1997 → present</span>
          <span style={{ color: INK_700, fontWeight: 600 }}>bellwether-nine.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Source Serif 4", data: serifMedium, weight: 500, style: "normal" },
        { name: "Source Serif 4", data: serifMediumItalic, weight: 500, style: "italic" },
        { name: "Source Serif 4", data: serifItalic, weight: 400, style: "italic" },
        { name: "Inter", data: inter, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
