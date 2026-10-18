import { Router } from "express";
import express from "express";
import puppeteer, { type Browser } from "puppeteer";
import { requireOwner } from "../middleware/guest.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

let browserPromise: Promise<Browser> | null = null;
function getBrowser() {
    browserPromise ??= puppeteer
        .launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
        .catch((error) => {
            browserPromise = null;
            throw error;
        });
    return browserPromise;
}

export async function closeBrowser() {
    if (browserPromise) await (await browserPromise).close().catch(() => undefined);
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
    express.json({ limit: "1mb" }),
    async (req, res) => {
        const html = typeof req.body?.html === "string" ? req.body.html : "";
        if (!html || html.length > 900_000) {
            res.status(400).json({ error: "Invalid resume HTML" });
            return;
        }
        const rawName = typeof req.body?.filename === "string" ? req.body.filename : "resume";
        const filename = rawName.replace(/[^A-Za-z0-9 _-]/g, "").trim().slice(0, 80) || "resume";

        let page;
        try {
            const browser = await getBrowser();
            page = await browser.newPage();
            await page.setJavaScriptEnabled(false);
            await page.setRequestInterception(true);
            page.on("request", (request) => {
                if (request.url().startsWith("data:")) void request.continue();
                else void request.abort();
            });
            await page.setContent(
                `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style></head><body>${html}</body></html>`,
                { waitUntil: "load", timeout: 15_000 },
            );
            const pdf = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "14mm", bottom: "14mm", left: "16mm", right: "16mm" },
            });
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
            res.send(Buffer.from(pdf));
        } catch (error) {
            console.error("[pdf] failed", error);
            res.status(500).json({ error: "Couldn't create the PDF. Please try again." });
        } finally {
            await page?.close().catch(() => undefined);
        }
    },
);

export default router;
