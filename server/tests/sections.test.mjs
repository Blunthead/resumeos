import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resumeDataSchema, resumeUpdateSchema } from "../src/lib/resumeSchema.ts";
import { MONO_TEMPLATES, SERIF_TEMPLATES, fontCssFor } from "../src/lib/fonts.ts";

const blank = () => resumeDataSchema.parse({});
const section = (n, extra = {}) => ({ id: `s${n}`, title: `Section ${n}`, entries: [], ...extra });

describe("custom sections", () => {
    test("a blank resume has no custom sections, languages, order or style overrides", () => {
        const d = blank();
        assert.deepEqual(d.custom, []);
        assert.deepEqual(d.languages, []);
        assert.deepEqual(d.order, []);
        assert.deepEqual(d.style, { size: "md", spacing: "normal" });
    });

    test("a section with entries parses, and missing fields get defaults", () => {
        const d = resumeDataSchema.parse({ custom: [{ id: "a", title: "Awards", entries: [{ id: "e1", title: "Winner" }] }] });
        assert.equal(d.custom[0].entries[0].description, "");
        assert.equal(d.custom[0].entries[0].date, "");
    });

    test("at most 10 sections, 30 entries each, 60-character titles", () => {
        assert.equal(resumeDataSchema.safeParse({ custom: Array.from({ length: 10 }, (_, i) => section(i)) }).success, true);
        assert.equal(resumeDataSchema.safeParse({ custom: Array.from({ length: 11 }, (_, i) => section(i)) }).success, false);
        const entries = (n) => Array.from({ length: n }, (_, i) => ({ id: `e${i}`, title: "t" }));
        assert.equal(resumeDataSchema.safeParse({ custom: [section(1, { entries: entries(30) })] }).success, true);
        assert.equal(resumeDataSchema.safeParse({ custom: [section(1, { entries: entries(31) })] }).success, false);
        assert.equal(resumeDataSchema.safeParse({ custom: [section(1, { title: "x".repeat(61) })] }).success, false);
    });

    test("entry text is length-capped like every other field", () => {
        const long = (description) => ({ custom: [section(1, { entries: [{ id: "e", description }] })] });
        assert.equal(resumeDataSchema.safeParse(long("x".repeat(5000))).success, true);
        assert.equal(resumeDataSchema.safeParse(long("x".repeat(5001))).success, false);
    });

    test("a section without an id is rejected", () => {
        assert.equal(resumeDataSchema.safeParse({ custom: [{ title: "No id" }] }).success, false);
    });
});

describe("order, languages, skills and style", () => {
    test("order keys are free-form strings (stale ones are repaired when read), but bounded", () => {
        assert.equal(resumeDataSchema.safeParse({ order: ["summary", "custom:a"] }).success, true);
        assert.equal(resumeDataSchema.safeParse({ order: Array.from({ length: 41 }, (_, i) => `k${i}`) }).success, false);
        assert.equal(resumeDataSchema.safeParse({ order: ["x".repeat(71)] }).success, false);
    });

    test("up to 100 skills and 20 languages", () => {
        assert.equal(resumeDataSchema.safeParse({ skills: Array.from({ length: 100 }, (_, i) => `s${i}`) }).success, true);
        assert.equal(resumeDataSchema.safeParse({ skills: Array.from({ length: 101 }, (_, i) => `s${i}`) }).success, false);
        assert.equal(resumeDataSchema.safeParse({ languages: Array.from({ length: 20 }, (_, i) => `l${i}`) }).success, true);
        assert.equal(resumeDataSchema.safeParse({ languages: Array.from({ length: 21 }, (_, i) => `l${i}`) }).success, false);
    });

    test("style accepts only the known sizes and spacings", () => {
        assert.equal(resumeDataSchema.safeParse({ style: { size: "lg", spacing: "tight" } }).success, true);
        assert.equal(resumeDataSchema.safeParse({ style: { size: "huge" } }).success, false);
        assert.equal(resumeDataSchema.safeParse({ style: { spacing: "wide" } }).success, false);
        assert.deepEqual(resumeDataSchema.parse({ style: { size: "sm" } }).style, { size: "sm", spacing: "normal" });
    });

    test("an update with the new fields validates as part of a resume", () => {
        const ok = resumeUpdateSchema.safeParse({ data: { custom: [section(1)], order: ["custom:s1"], languages: ["English"] } });
        assert.equal(ok.success, true);
    });
});

describe("PDF fonts", () => {
    const resume = (template) => `<style>.rd[data-template="modern"]{}</style><div class="rd" data-template="${template}"></div>`;

    test("the sans family is always embedded, as static weights", () => {
        const css = fontCssFor(resume("modern"));
        assert.match(css, /font-family:"Inter"/);
        for (const w of [300, 400, 500, 600, 700]) assert.match(css, new RegExp(`font-weight:${w};`));
        assert.doesNotMatch(css, /font-weight:100 900/, "variable fonts print as Type 3 and break the text layer");
    });

    test("bold italic has a real face in every family, so combined formatting is not faked", () => {
        for (const [template, family] of [["modern", "Inter"], ["classic", "Source Serif 4"], ["tech", "JetBrains Mono"]]) {
            const css = fontCssFor(`<div class="rd" data-template="${template}"></div>`);
            assert.match(css, new RegExp(`font-family:"${family}";font-style:italic;font-weight:700;`), family);
        }
    });

    test("serif and mono families come only with the templates that use them", () => {
        assert.match(fontCssFor(resume("classic")), /Source Serif 4/);
        assert.match(fontCssFor(resume("tech")), /JetBrains Mono/);
        assert.doesNotMatch(fontCssFor(resume("modern")), /Source Serif 4|JetBrains Mono/);
    });

    test("the template is read from the resume element, not the stylesheet that mentions every template", () => {
        // The stylesheet comes first and names "modern"; the resume is "academic".
        assert.match(fontCssFor(resume("academic")), /Source Serif 4/);
    });

    test("fonts are embedded as data, so printing never needs the network", () => {
        assert.match(fontCssFor(resume("modern")), /src:url\(data:font\/woff2;base64,/);
    });

    test("the font lists match the stylesheet's own use of the serif and mono families", () => {
        const css = readFileSync(new URL("../../frontend/src/components/resumeDocument.css", import.meta.url), "utf8");
        const uses = (token) => {
            const found = new Set();
            for (const m of css.matchAll(/\.rd\[data-template="([a-z-]+)"\]([^{]*)\{([^}]*)\}/g)) {
                if (m[3].includes(token)) found.add(m[1]);
            }
            return [...found].sort();
        };
        assert.deepEqual(uses("var(--rd-serif)"), [...SERIF_TEMPLATES].sort());
        assert.deepEqual(uses("var(--rd-mono)"), [...MONO_TEMPLATES].sort());
    });
});
