import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.ts";

const ORIGIN = "http://localhost:5173";
const GUEST_A = "guest-a-0123456789abcdefghij";
const GUEST_B = "guest-b-0123456789abcdefghij";

let mongod;
let server;
let base;

before(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri("resumeos-test"));
    await mongoose.model("Resume").init();
    server = createApp(ORIGIN).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server?.close();
    await mongoose.disconnect();
    await mongod?.stop();
});

async function call(path, { method = "GET", guest = GUEST_A, body, raw } = {}) {
    const res = await fetch(base + path, {
        method,
        headers: {
            ...(guest ? { "x-guest-id": guest } : {}),
            ...(body !== undefined || raw ? { "Content-Type": "application/json" } : {}),
        },
        body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let json = null;
    try {
        json = JSON.parse(text);
    } catch {
        // not JSON
    }
    return { status: res.status, json, headers: res.headers };
}

const create = (guest = GUEST_A, body = { template: "modern", accent: "#3d5a80" }) =>
    call("/api/resumes", { method: "POST", guest, body });

describe("health and headers", () => {
    test("GET / reports ok and the database state", async () => {
        const { status, json } = await call("/", { guest: null });
        assert.equal(status, 200);
        assert.deepEqual(json, { status: "ok", service: "resumeos-api", db: "up" });
    });

    test("responses are not cached, sniffed or fingerprinted", async () => {
        const { headers } = await call("/", { guest: null });
        assert.equal(headers.get("cache-control"), "no-store");
        assert.equal(headers.get("x-content-type-options"), "nosniff");
        assert.equal(headers.get("x-powered-by"), null);
    });

    test("preflight answers are cacheable, so repeat requests skip the OPTIONS trip", async () => {
        const res = await fetch(`${base}/api/resumes`, {
            method: "OPTIONS",
            headers: {
                Origin: ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,x-guest-id",
            },
        });
        assert.equal(res.status, 204);
        assert.equal(res.headers.get("access-control-max-age"), "7200");
        assert.equal(res.headers.get("access-control-allow-origin"), ORIGIN);
    });

    test("unknown API routes answer JSON 404", async () => {
        const { status, json } = await call("/api/nope", { guest: null });
        assert.equal(status, 404);
        assert.equal(json.error, "Not found");
    });
});

describe("resume lifecycle", () => {
    test("requests without a valid guest id are refused", async () => {
        assert.equal((await call("/api/resumes", { guest: null })).status, 401);
        assert.equal((await call("/api/resumes", { guest: "short" })).status, 401);
    });

    test("create, read, update, list, delete", async () => {
        const created = await create(GUEST_A, { template: "classic", accent: "#1f2937" });
        assert.equal(created.status, 201);
        const id = created.json._id;
        assert.equal(created.json.template, "classic");
        assert.equal(created.json.data.contact.fullName, "");

        const read = await call(`/api/resumes/${id}`);
        assert.equal(read.status, 200);
        assert.equal(read.json.title, "Untitled resume");

        const update = await call(`/api/resumes/${id}`, {
            method: "PUT",
            body: { title: "Mine", data: { summary: "Hello" } },
        });
        assert.equal(update.status, 200);
        // The editor ignores this body, so it only carries what changed.
        assert.deepEqual(Object.keys(update.json).sort(), ["_id", "updatedAt"]);

        const after = await call(`/api/resumes/${id}`);
        assert.equal(after.json.title, "Mine");
        assert.equal(after.json.data.summary, "Hello");

        const list = await call("/api/resumes");
        const row = list.json.find((r) => r._id === id);
        assert.ok(row);
        assert.equal(row.data.summary, undefined, "the list must not ship full resume bodies");

        assert.equal((await call(`/api/resumes/${id}`, { method: "DELETE" })).status, 204);
        assert.equal((await call(`/api/resumes/${id}`)).status, 404);
    });

    test("the list is newest-edited first", async () => {
        const guest = "guest-order-0123456789abcdef";
        const first = (await create(guest)).json._id;
        const second = (await create(guest)).json._id;
        await call(`/api/resumes/${first}`, { method: "PUT", guest, body: { title: "touched" } });
        const ids = (await call("/api/resumes", { guest })).json.map((r) => r._id);
        assert.deepEqual(ids, [first, second]);
    });
});

describe("isolation", () => {
    test("another guest's resume is a 404 for read, update and delete", async () => {
        const id = (await create(GUEST_A)).json._id;
        assert.equal((await call(`/api/resumes/${id}`, { guest: GUEST_B })).status, 404);
        assert.equal(
            (await call(`/api/resumes/${id}`, { method: "PUT", guest: GUEST_B, body: { title: "x" } })).status,
            404,
        );
        assert.equal((await call(`/api/resumes/${id}`, { method: "DELETE", guest: GUEST_B })).status, 404);
        assert.equal((await call(`/api/resumes/${id}`)).json.title, "Untitled resume");
        const listB = (await call("/api/resumes", { guest: GUEST_B })).json;
        assert.ok(!listB.some((r) => r._id === id));
    });

    test("a malformed id is a 404, not a server error", async () => {
        assert.equal((await call("/api/resumes/not-an-id")).status, 404);
        assert.equal((await call("/api/resumes/not-an-id", { method: "DELETE" })).status, 404);
    });
});

describe("bad input", () => {
    test("invalid fields are rejected with 400", async () => {
        const id = (await create(GUEST_A)).json._id;
        const put = (body) => call(`/api/resumes/${id}`, { method: "PUT", body });
        assert.equal((await put({ template: "nope" })).status, 400);
        assert.equal((await put({ accent: "red" })).status, 400);
        assert.equal((await put({ title: "   " })).status, 400);
        assert.equal((await put({ data: { summary: "x".repeat(5001) } })).status, 400);
        assert.equal((await call("/api/resumes", { method: "POST", body: { template: "nope" } })).status, 400);
    });

    test("malformed JSON is a 400, not a 500", async () => {
        const { status, json } = await call("/api/resumes", { method: "POST", raw: "{not json" });
        assert.equal(status, 400);
        assert.equal(json.error, "Invalid request");
    });

    test("a body over the size limit is a 413, not a 500", async () => {
        const id = (await create(GUEST_A)).json._id;
        const { status } = await call(`/api/resumes/${id}`, {
            method: "PUT",
            raw: JSON.stringify({ title: "x".repeat(300_000) }),
        });
        assert.equal(status, 413);
    });

    test("an empty update is harmless", async () => {
        const id = (await create(GUEST_A)).json._id;
        assert.equal((await call(`/api/resumes/${id}`, { method: "PUT", body: {} })).status, 200);
    });

    test("emoji, accents and right-to-left text survive a round trip", async () => {
        const id = (await create(GUEST_A)).json._id;
        const summary = "Builder 🚀 café — مرحبا بالعالم — 日本語 — 👨‍👩‍👧‍👦";
        await call(`/api/resumes/${id}`, { method: "PUT", body: { data: { summary, contact: { fullName: "Zoë 😀" } } } });
        const read = (await call(`/api/resumes/${id}`)).json;
        assert.equal(read.data.summary, summary);
        assert.equal(read.data.contact.fullName, "Zoë 😀");
    });

    test("a maximum-size resume is accepted", async () => {
        const id = (await create(GUEST_A)).json._id;
        const data = {
            summary: "s".repeat(5000),
            experience: Array.from({ length: 30 }, (_, i) => ({ id: `e${i}`, role: "r".repeat(200), description: "d".repeat(5000) })),
            skills: Array.from({ length: 60 }, (_, i) => `skill${i}`),
        };
        const res = await call(`/api/resumes/${id}`, { method: "PUT", body: { data } });
        // 30 x 5KB of descriptions is ~150KB: inside the 200KB limit.
        assert.equal(res.status, 200);
    });
});

describe("limits", () => {
    test("a guest can keep 25 resumes, then gets a 409", async () => {
        const guest = "guest-cap-0123456789abcdefghi";
        for (let i = 0; i < 25; i++) assert.equal((await create(guest)).status, 201);
        assert.equal((await create(guest)).status, 409);
    });

    test("the PDF route validates before it touches Chromium", async () => {
        const post = (body) => call("/api/pdf", { method: "POST", body });
        assert.equal((await post({})).status, 400);
        assert.equal((await post({ html: 123 })).status, 400);
        assert.equal((await post({ html: "x".repeat(900_001) })).status, 400);
        assert.equal((await call("/api/pdf", { method: "POST", guest: null, body: { html: "<p>x</p>" } })).status, 401);
    });
});
