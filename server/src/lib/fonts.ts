import { readFileSync } from "node:fs";
import path from "node:path";

// The PDF is printed by Chromium on the server, which only has the fonts
// installed on that machine. The on-screen preview uses these same families
// (from the frontend's @fontsource packages). Embedding the identical files in
// the HTML that gets printed is what makes the PDF match the preview exactly,
// whatever the server has installed.
//
// Latin subsets only: anything else (Devanagari, Arabic, CJK...) falls back to
// the system fonts, which the Docker image provides.
const LATIN =
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

type Face = { family: string; file: string; weight: number; style: "normal" | "italic" };
type Group = "sans" | "serif" | "mono";

// Bold italic is included too: without a real face Chromium fakes the slant,
// and a faked face is also printed as Type 3 shapes.
//
// Static weights, not variable fonts: Chromium embeds a variable font in a PDF
// as Type 3 glyph shapes, which have no reliable text layer. An em dash comes
// out as a replacement character, and that text layer is exactly what an
// applicant-tracking system reads. Static fonts embed as real TrueType with a
// proper text map.
const face = (family: string, slug: string, weight: number, style: Face["style"] = "normal"): Face => ({
    family,
    file: `${slug}-latin-${weight}-${style}.woff2`,
    weight,
    style,
});

const FACES: Record<Group, Face[]> = {
    sans: [
        ...[300, 400, 500, 600, 700].map((w) => face("Inter", "inter", w)),
        face("Inter", "inter", 400, "italic"),
        face("Inter", "inter", 700, "italic"),
    ],
    serif: [
        ...[400, 600, 700].map((w) => face("Source Serif 4", "source-serif-4", w)),
        face("Source Serif 4", "source-serif-4", 400, "italic"),
        face("Source Serif 4", "source-serif-4", 700, "italic"),
    ],
    mono: [
        ...[400, 600, 700].map((w) => face("JetBrains Mono", "jetbrains-mono", w)),
        face("JetBrains Mono", "jetbrains-mono", 400, "italic"),
        face("JetBrains Mono", "jetbrains-mono", 700, "italic"),
    ],
};

// Templates that use the serif or mono family. Everything else is sans.
// A test checks this against the stylesheet so the two can't drift apart.
export const SERIF_TEMPLATES = ["classic", "elegant", "executive", "academic"];
export const MONO_TEMPLATES = ["tech"];

const dir = path.join(__dirname, "..", "assets", "fonts");
const cache = new Map<string, string>();

function faceCss(face: Face): string {
    let css = cache.get(face.file);
    if (!css) {
        const data = readFileSync(path.join(dir, face.file)).toString("base64");
        css =
            `@font-face{font-family:"${face.family}";font-style:${face.style};font-weight:${face.weight};` +
            `src:url(data:font/woff2;base64,${data}) format("woff2");unicode-range:${LATIN}}`;
        cache.set(face.file, css);
    }
    return css;
}

// The @font-face rules a given resume needs: the sans family always (the base
// of every template), plus serif or mono only for the templates that use them.
export function fontCssFor(html: string): string {
    const groups: Group[] = ["sans"];
    // Match the element, not the stylesheet: the CSS is sent in the same string
    // and mentions every template name before the resume does.
    const template = /<div class="rd" data-template="([a-z-]+)"/.exec(html)?.[1] ?? "";
    if (SERIF_TEMPLATES.includes(template)) groups.push("serif");
    if (MONO_TEMPLATES.includes(template)) groups.push("mono");
    return `<style>${groups.flatMap((g) => FACES[g]).map(faceCss).join("")}</style>`;
}
