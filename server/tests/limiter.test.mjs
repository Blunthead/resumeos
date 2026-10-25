import { test } from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../src/lib/limiter.ts";

const tick = (ms = 5) => new Promise((resolve) => setTimeout(resolve, ms));

test("never runs more than max jobs at once", async () => {
    const limiter = createLimiter(2);
    let running = 0;
    let peak = 0;
    const job = async () => {
        running++;
        peak = Math.max(peak, running);
        await tick();
        running--;
    };
    await Promise.all(Array.from({ length: 10 }, () => limiter.run(job)));
    assert.equal(peak, 2);
});

test("queued jobs all finish, in order", async () => {
    const limiter = createLimiter(1);
    const order = [];
    await Promise.all([1, 2, 3, 4].map((n) => limiter.run(async () => { await tick(); order.push(n); })));
    assert.deepEqual(order, [1, 2, 3, 4]);
});

test("a failing job frees its slot", async () => {
    const limiter = createLimiter(1);
    await assert.rejects(limiter.run(async () => { throw new Error("boom"); }), /boom/);
    assert.equal(await limiter.run(async () => "ok"), "ok");
});

test("reports how many jobs are waiting", async () => {
    const limiter = createLimiter(1);
    const first = limiter.run(() => tick(20));
    const second = limiter.run(() => tick(1));
    const third = limiter.run(() => tick(1));
    assert.equal(limiter.queued, 2);
    await Promise.all([first, second, third]);
    assert.equal(limiter.queued, 0);
});
