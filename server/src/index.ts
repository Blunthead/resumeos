import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", service: "resumeos-api" });
});

async function start() {
    if (MONGODB_URI) {
        await mongoose.connect(MONGODB_URI);
        console.log("[db] connected");
    } else {
        console.warn("[db] MONGODB_URI not set — running without a database connection");
    }

    app.listen(PORT, () => {
        console.log(`[server] listening on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error("[server] failed to start", error);
    process.exit(1);
});
