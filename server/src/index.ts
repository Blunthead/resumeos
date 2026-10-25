import "dotenv/config";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { closeBrowser } from "./routes/pdf.js";
import { connectDb } from "./lib/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
    await connectDb();
    const server = createApp().listen(PORT, () => {
        console.log(`[server] listening on port ${PORT}`);
    });
    const shutdown = () => {
        server.close();
        void Promise.allSettled([closeBrowser(), mongoose.disconnect()]).finally(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

process.on("unhandledRejection", (reason) => console.error("[server] unhandled rejection", reason));

start().catch((error) => {
    console.error("[server] failed to start", error);
    process.exit(1);
});
