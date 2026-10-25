import { Router } from "express";
import express from "express";
import puppeteer, { type Browser } from "puppeteer";
import { requireOwner } from "../middleware/guest.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { createLimiter } from "../lib/limiter.js";

const router = Router();

// One Chromium process is shared by every request; each PDF gets its own tab.
// If the process dies (out of memory, crash) it is dropped here, so the next
// request starts a fresh one instead of failing until the server restarts.
let browserPromise: Promise<Browser> | null = null;
function getBrowser() {
    browserPromise ??= puppeteer
        .launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                // Docker's /dev/shm is 64MB, which Chromium exhausts and then
                // crashes. This makes it use /tmp instead.
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        })
        .then((browser) => {
            browser.on("disconnected", () => {
                browserPromise = null;
            });
            return browser;
        })
        .catch((error) => {
            browserPromise = null;
            throw error;
        });
    return browserPromise;
}

export async function closeBrowser() {
    if (browserPromise) await (await browserPromise).close().catch(() => undefined);
}

// Two tabs at once is what a 512MB instance can carry. The rest wait their
// turn; past MAX_QUEUED waiting we answer "busy" instead of piling up.
const pdfJobs = createLimiter(2);
const MAX_QUEUED = 8;

async function render(html: string): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        page.setDefaultTimeout(20_000);
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on("request", (request) => {
            if (request.url().startsWith("data:")) void request.continue();
            else void request.abort();
        });
        await page.setContent(
            `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style></head><body>${html}</body></html>`,
            { waitUntil: "load" },
        );
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "14mm", bottom: "14mm", left: "16mm", right: "16mm" },
        });
        return Buffer.from(pdf);
    } finally {
        await page.close().catch(() => undefined);
    }
}

// The client sends the exact HTML + CSS it is previewing, so the PDF always
// matches the screen. That makes this route "render caller-supplied HTML in a
// browser", which is only safe because the page is locked down: JavaScript is
// off and every network or file request is aborted, so injected markup can
// neither run code nor fetch anything.
router.post(
    "/",
    requireOwner,
    rateLimit(15, 60_000),
    // Per-IP as well: a guest id is free to mint, so the per-guest limit alone
    // wouldn't stop one machine from monopolising Chromium.
    rateLimit(40, 60_000, "ip"),
    express.json({ limit: "1mb" }),
    async (req, res) => {
        const html = typeof req.body?.html === "string" ? req.body.html : "";
        if (!html || html.length > 900_000) {
            res.status(400).json({ error: "Invalid resume HTML" });
            return;
        }
        if (pdfJobs.queued >= MAX_QUEUED) {
            res.setHeader("Retry-After", "5");
            res.status(503).json({ error: "We're busy right now. Please try again in a moment." });
            return;
        }
        const rawName = typeof req.body?.filename === "string" ? req.body.filename : "resume";
        const filename = rawName.replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 80) || "resume";

        try {
            const pdf = await pdfJobs.run(() => render(html));
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
            res.send(pdf);
        } catch (error) {
            console.error("[pdf] failed", error);
            res.status(500).json({ error: "Couldn't create the PDF. Please try again." });
        }
    },
);

export default router;
