import type { NextFunction, Request, Response } from "express";

// Tiny fixed-window limiter, keyed by guest id (falling back to IP). Enough to
// stop a runaway client hammering Chromium; swap for a shared store if the API
// ever runs on more than one instance.
export function rateLimit(max: number, windowMs: number) {
    const hits = new Map<string, { count: number; resetAt: number }>();
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.owner ?? req.ip ?? "unknown";
        const now = Date.now();
        const entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        if (entry.count >= max) {
            res.status(429).json({ error: "Too many requests, try again in a minute" });
            return;
        }
        entry.count += 1;
        next();
    };
}
