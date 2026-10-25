import express from "express";
import type { ErrorRequestHandler, RequestHandler } from "express";
import cors from "cors";
import mongoose from "mongoose";
import resumeRoutes from "./routes/resumes.js";
import pdfRoutes from "./routes/pdf.js";

// Headers that cost nothing and close off whole classes of browser-side abuse.
// API responses are per-guest data and must never be cached by a proxy.
const securityHeaders: RequestHandler = (_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store");
    next();
};

// Client mistakes (malformed JSON, a body over the size limit) carry their own
// 4xx status. Only genuinely unexpected errors are reported as 500s.
export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }
    const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
    if (status === 500) console.error("[server] unhandled", error);
    const message =
        status === 413 ? "That is too large to save" : status < 500 ? "Invalid request" : "Something went wrong";
    res.status(status).json({ error: message });
};

export function createApp(clientUrl = process.env.CLIENT_URL || "http://localhost:5173") {
    const app = express();
    app.disable("x-powered-by");
    // Render sits behind a proxy; without this req.ip is the proxy's address
    // and every visitor would share one rate-limit bucket.
    app.set("trust proxy", 1);

    app.use(securityHeaders);
    app.use(
        cors({
            origin: clientUrl,
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "x-guest-id"],
            // Lets the browser reuse a preflight instead of repeating the
            // OPTIONS round trip before every request (Chrome caps this at 2h).
            maxAge: 7200,
        }),
    );

    // The PDF route mounts its own, larger JSON parser, so it must come first.
    app.use("/api/pdf", pdfRoutes);
    app.use(express.json({ limit: "200kb" }));

    app.get("/", (_req, res) => {
        res.status(200).json({
            status: "ok",
            service: "resumeos-api",
            db: mongoose.connection.readyState === 1 ? "up" : "down",
        });
    });
    app.use("/api/resumes", resumeRoutes);

    app.use("/api", (_req, res) => {
        res.status(404).json({ error: "Not found" });
    });
    app.use(errorHandler);
    return app;
}
