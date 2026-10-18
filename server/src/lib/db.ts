import mongoose from "mongoose";

// With MONGODB_URI set, connect to it. Without one (local dev), start an
// embedded MongoDB whose files live in server/.data so resumes survive
// restarts. It is a dev convenience only: production must set MONGODB_URI.
export async function connectDb() {
    const uri = process.env.MONGODB_URI;
    if (uri) {
        await mongoose.connect(uri);
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
