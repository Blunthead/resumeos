import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
    TEMPLATE_IDS,
    resumeCreateSchema,
    resumeDataSchema,
    resumeUpdateSchema,
} from "../src/lib/resumeSchema.ts";

test("an empty object parses to a full blank resume", () => {
    const data = resumeDataSchema.parse({});
    assert.equal(data.contact.fullName, "");
    assert.deepEqual(data.experience, []);
    assert.deepEqual(data.skills, []);
});

test("create defaults to the modern template", () => {
    const parsed = resumeCreateSchema.parse({});
    assert.equal(parsed.template, "modern");
    assert.match(parsed.accent, /^#[0-9a-f]{6}$/i);
});

test("unknown templates and malformed accents are rejected", () => {
    assert.equal(resumeUpdateSchema.safeParse({ template: "nope" }).success, false);
    assert.equal(resumeUpdateSchema.safeParse({ accent: "red" }).success, false);
    assert.equal(resumeUpdateSchema.safeParse({ accent: "#12345" }).success, false);
});

test("every accepted template id parses", () => {
    for (const template of TEMPLATE_IDS) {
        assert.equal(resumeUpdateSchema.safeParse({ template }).success, true, template);
    }
});

test("blank or oversized titles are rejected", () => {
    assert.equal(resumeUpdateSchema.safeParse({ title: "   " }).success, false);
    assert.equal(resumeUpdateSchema.safeParse({ title: "x".repeat(101) }).success, false);
});

test("string and list length caps hold", () => {
    assert.equal(resumeDataSchema.safeParse({ summary: "x".repeat(5001) }).success, false);
    assert.equal(
        resumeDataSchema.safeParse({ contact: { fullName: "x".repeat(201) } }).success,
        false,
    );
    assert.equal(
        resumeDataSchema.safeParse({ skills: Array.from({ length: 61 }, (_, i) => `s${i}`) })
            .success,
        false,
    );
});

test("server template ids match the frontend's template list", () => {
    const source = readFileSync(new URL("../../frontend/src/lib/resume.js", import.meta.url), "utf8");
    const frontendIds = [...source.matchAll(/\{ id: '([a-z-]+)', accent:/g)].map((m) => m[1]);
    assert.deepEqual([...frontendIds].sort(), [...TEMPLATE_IDS].sort());
});
