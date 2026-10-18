import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
    interface Request {
        owner?: string;
    }
}

const GUEST_ID = /^[A-Za-z0-9_-]{20,64}$/;

// Identifies the caller by the random id their browser generated. It is NOT
// authentication: anyone who learns the id can read that guest's resumes. It
// is a stand-in until real accounts replace it, and every query is scoped by
// it so swapping in a user id later changes one line.
export function requireOwner(req: Request, res: Response, next: NextFunction) {
    const id = req.header("x-guest-id");
    if (!id || !GUEST_ID.test(id)) {
        res.status(401).json({ error: "Missing or invalid guest id" });
        return;
    }
    req.owner = id;
    next();
}
