import mongoose from "mongoose";

// With MONGODB_URI set, connect to it. Without one (local dev), start an
// embedded MongoDB whose files live in server/.data so resumes survive
// restarts. It is a dev convenience only: production must set MONGODB_URI.
export async function connectDb() {
    mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
    mongoose.connection.on("reconnected", () => console.log("[db] reconnected"));

    const uri = process.env.MONGODB_URI;
    if (uri) {
        // Fail in 10s with a clear error instead of hanging for 30s when Atlas
        // is unreachable (wrong password, IP not allowed, cluster paused).
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
        console.log("[db] connected");
        return;
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error("MONGODB_URI is required in production");
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(".data", { recursive: true });
    const mongod = await MongoMemoryServer.create({
        instance: { dbPath: ".data", storageEngine: "wiredTiger" },
    });
    await mongoose.connect(mongod.getUri("resumeos"));
    console.log("[db] connected to embedded dev database (server/.data)");
}
