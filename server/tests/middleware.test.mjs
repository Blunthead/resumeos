import { test } from "node:test";
import assert from "node:assert/strict";
import { requireOwner } from "../src/middleware/guest.ts";
import { rateLimit } from "../src/middleware/rateLimit.ts";

function run(middleware, req) {
    const result = { status: 200, body: undefined, nextCalled: false, headers: {} };
    const res = {
        setHeader(name, value) {
            result.headers[name] = value;
        },
        status(code) {
            result.status = code;
            return this;
        },
        json(body) {
            result.body = body;
            return this;
        },
    };
    middleware(req, res, () => {
        result.nextCalled = true;
    });
    return result;
}

const withHeader = (id) => ({ header: (name) => (name === "x-guest-id" ? id : undefined) });

test("requireOwner rejects a missing guest id", () => {
    const out = run(requireOwner, withHeader(undefined));
    assert.equal(out.status, 401);
    assert.equal(out.nextCalled, false);
});

test("requireOwner rejects ids that are too short or contain odd characters", () => {
    for (const bad of ["short", "has spaces in it, definitely > 20", "../../etc/passwd-xxxxxxxxxx"]) {
        assert.equal(run(requireOwner, withHeader(bad)).status, 401, bad);
    }
});

test("requireOwner accepts a UUID and records it as the owner", () => {
    const req = withHeader("3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b");
    const out = run(requireOwner, req);
    assert.equal(out.nextCalled, true);
    assert.equal(req.owner, "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b");
});

test("rateLimit allows up to max requests then answers 429", () => {
    const limit = rateLimit(3, 60_000);
    const req = { owner: "guest-a" };
    for (let i = 0; i < 3; i++) assert.equal(run(limit, req).nextCalled, true);
    const blocked = run(limit, req);
    assert.equal(blocked.status, 429);
    assert.equal(blocked.nextCalled, false);
    assert.ok(Number(blocked.headers["Retry-After"]) >= 1, "tells the client when to retry");
});

test("rateLimit counts each guest separately", () => {
    const limit = rateLimit(1, 60_000);
    assert.equal(run(limit, { owner: "guest-a" }).nextCalled, true);
    assert.equal(run(limit, { owner: "guest-b" }).nextCalled, true);
    assert.equal(run(limit, { owner: "guest-a" }).status, 429);
});

test("rateLimit starts a fresh window once the old one expires", async () => {
    const limit = rateLimit(1, 20);
    const req = { owner: "guest-a" };
    assert.equal(run(limit, req).nextCalled, true);
    assert.equal(run(limit, req).status, 429);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(run(limit, req).nextCalled, true);
});

test("rateLimit can key by IP, so minting new guest ids doesn't dodge it", () => {
    const limit = rateLimit(2, 60_000, "ip");
    assert.equal(run(limit, { owner: "guest-a", ip: "1.2.3.4" }).nextCalled, true);
    assert.equal(run(limit, { owner: "guest-b", ip: "1.2.3.4" }).nextCalled, true);
    assert.equal(run(limit, { owner: "guest-c", ip: "1.2.3.4" }).status, 429);
    assert.equal(run(limit, { owner: "guest-d", ip: "5.6.7.8" }).nextCalled, true);
});
