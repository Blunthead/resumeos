import type { NextFunction, Request, Response } from "express";

// Tiny fixed-window limiter. Keyed by guest id by default, or by IP for limits
// that must hold across guest ids (a guest id is free to mint, so it can't
// protect against someone creating thousands). Swap for a shared store if the
// API ever runs on more than one instance.
//
// Expired entries are swept at most once per window, on the request path, so
// the map can't grow without bound and no timer keeps the process alive.
export function rateLimit(max: number, windowMs: number, by: "owner" | "ip" = "owner") {
    const hits = new Map<string, { count: number; resetAt: number }>();
    let nextSweep = Date.now() + windowMs;
    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        if (now >= nextSweep) {
            for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
            nextSweep = now + windowMs;
        }
        const key = (by === "ip" ? req.ip : (req.owner ?? req.ip)) ?? "unknown";
        const entry = hits.get(key);
        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        if (entry.count >= max) {
            res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
            res.status(429).json({ error: "Too many requests, try again in a minute" });
            return;
        }
        entry.count += 1;
        next();
    };
}
