import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import resumeRoutes from "./routes/resumes.js";
import pdfRoutes, { closeBrowser } from "./routes/pdf.js";
import { connectDb } from "./lib/db.js";

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

app.use(cors({ origin: CLIENT_URL }));
// The PDF route mounts its own, larger JSON parser, so it must come first.
app.use("/api/pdf", pdfRoutes);
app.use(express.json({ limit: "200kb" }));

app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "resumeos-api" });
});
app.use("/api/resumes", resumeRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[server] unhandled", error);
    res.status(500).json({ error: "Something went wrong" });
});

async function start() {
    await connectDb();
    const server = app.listen(PORT, () => {
        console.log(`[server] listening on port ${PORT}`);
    });
    const shutdown = () => {
        server.close();
        void closeBrowser().finally(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

start().catch((error) => {
    console.error("[server] failed to start", error);
    process.exit(1);
});
